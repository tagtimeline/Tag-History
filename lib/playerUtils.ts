// lib/playerUtils.ts
import { doc, setDoc, collection, getDocs, query, where, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

async function processAltAccount(input: string, mainPlayerUuid: string): Promise<string | null> {
    try {
        const playersRef = collection(db, 'players');
        let uuid: string;
        let currentIgn: string;

        // Check if input is UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        if (uuidRegex.test(input)) {
            // Input is UUID, use Ashcon API only
            try {
                const response = await fetch(`https://api.ashcon.app/mojang/v2/user/${input}`);
                if (!response.ok) {
                    // If API fails, check database
                    const existingPlayerQuery = await getDocs(query(playersRef, where('uuid', '==', input)));
                    if (!existingPlayerQuery.empty) {
                        const existingData = existingPlayerQuery.docs[0].data();
                        uuid = input;
                        currentIgn = existingData.currentIgn;
                    } else {
                        return null;
                    }
                } else {
                    const data = await response.json();
                    uuid = data.uuid;
                    currentIgn = data.username;
                }
            } catch (error) {
                console.error('Error fetching from Ashcon API:', error);
                // Check database as fallback
                const existingPlayerQuery = await getDocs(query(playersRef, where('uuid', '==', input)));
                if (!existingPlayerQuery.empty) {
                    const existingData = existingPlayerQuery.docs[0].data();
                    uuid = input;
                    currentIgn = existingData.currentIgn;
                } else {
                    return null;
                }
            }
        } else {
            // Input is IGN
            try {
                // Try official Mojang API first
                const mojangResponse = await fetch(`https://api.mojang.com/users/profiles/minecraft/${input}`);
                if (mojangResponse.ok) {
                    const mojangData = await mojangResponse.json();
                    uuid = mojangData.id;
                    currentIgn = mojangData.name;
                } else {
                    // If Mojang API fails, try Ashcon
                    const ashconResponse = await fetch(`https://api.ashcon.app/mojang/v2/user/${input}`);
                    if (!ashconResponse.ok) {
                        // If both APIs fail, check database
                        const existingPlayerQuery = await getDocs(
                            query(playersRef, where('currentIgn', '==', input))
                        );
                        if (!existingPlayerQuery.empty) {
                            const existingData = existingPlayerQuery.docs[0].data();
                            uuid = existingData.uuid;
                            currentIgn = input;
                        } else {
                            return null;
                        }
                    } else {
                        const ashconData = await ashconResponse.json();
                        uuid = ashconData.uuid;
                        currentIgn = ashconData.username;
                    }
                }
            } catch (error) {
                console.error('Error fetching player data:', error);
                // Check database as final fallback
                const existingPlayerQuery = await getDocs(
                    query(playersRef, where('currentIgn', '==', input))
                );
                if (!existingPlayerQuery.empty) {
                    const existingData = existingPlayerQuery.docs[0].data();
                    uuid = existingData.uuid;
                    currentIgn = input;
                } else {
                    return null;
                }
            }
        }

        // Rest of the function remains the same...
        const existingPlayerQuery = await getDocs(query(playersRef, where('uuid', '==', uuid)));
        if (!existingPlayerQuery.empty) {
            const existingPlayer = existingPlayerQuery.docs[0];
            const existingData = existingPlayer.data();
            
            if (!existingData.mainAccount) {
                await updateDoc(existingPlayer.ref, {
                    mainAccount: mainPlayerUuid,
                    lastUpdated: new Date()
                });
            }
            return existingData.uuid;
        }

        const playerRef = doc(collection(db, 'players'));
        await setDoc(playerRef, {
            currentIgn,
            uuid,
            pastIgns: [],
            events: [],
            role: null,
            mainAccount: mainPlayerUuid,
            altAccounts: [],
            lastUpdated: new Date()
        });
        
        return uuid;
    } catch (error) {
        console.error('Error processing alt account:', error);
        return null;
    }
}

export async function updatePlayerData(
    playerIgn: string, 
    role?: string | null, 
    altAccounts: string[] = []
): Promise<void> {
    try {
        // First check if player already exists (case insensitive)
        const playersRef = collection(db, 'players');
        const existingPlayerQuery = await getDocs(playersRef);
        const existingPlayer = existingPlayerQuery.docs.find(doc => 
            doc.data().currentIgn.toLowerCase() === playerIgn.toLowerCase()
        );

        // If player exists and is an alt account, don't process further
        if (existingPlayer && existingPlayer.data().mainAccount) {
            console.warn(`Cannot update ${playerIgn} as it is an alt account`);
            return;
        }

        // Fetch main player data from Minecraft API
        const response = await fetch(`https://api.ashcon.app/mojang/v2/user/${playerIgn}`);
        if (!response.ok) {
            console.warn(`Unable to fetch Minecraft data for player ${playerIgn}`);
            
            // Create minimal player record if API fails
            if (!existingPlayer) {
                const playerRef = doc(collection(db, 'players'));
                await setDoc(playerRef, {
                    currentIgn: playerIgn,
                    pastIgns: [],
                    events: [],
                    role: role || null,
                    altAccounts: [],
                    lastUpdated: new Date()
                });
            }
            return;
        }
        
        const data = await response.json();
        const uuid = data.uuid;
        const currentIgn = data.username;
        
        // Process all alt accounts
        const processedAltUuids = await Promise.all(
            altAccounts
                .filter(alt => alt.trim() !== '')
                .map(alt => processAltAccount(alt.trim(), uuid))
        );
        
        const validAltUuids = processedAltUuids.filter((uuid): uuid is string => uuid !== null);
        
        // Update or create main player document
        const playerRef = existingPlayer ? 
            doc(db, 'players', existingPlayer.id) : 
            doc(collection(db, 'players'));
            
        const existingData = existingPlayer?.data();
        
        await setDoc(playerRef, {
            currentIgn,
            uuid,
            pastIgns: existingData?.pastIgns || [],
            events: existingData?.events || [],
            role: role || null,
            altAccounts: validAltUuids,
            lastUpdated: new Date()
        }, { merge: true });
        
        // Remove this player as an alt from any other accounts if it was previously an alt
        const mainAccountQuery = await getDocs(
            query(playersRef, where('altAccounts', 'array-contains', uuid))
        );
        
        for (const doc of mainAccountQuery.docs) {
            await updateDoc(doc.ref, {
                altAccounts: doc.data().altAccounts.filter((id: string) => id !== uuid)
            });
        }
        
    } catch (error) {
        console.error('Error updating player data:', error);
    }
}

export async function deletePlayer(playerId: string): Promise<void> {
    try {
        const playerRef = doc(db, 'players', playerId);
        const playerDoc = await getDoc(playerRef);
        
        if (playerDoc.exists()) {
            const playerData = playerDoc.data();
            
            // If this is a main account, update all its alts
            if (playerData.altAccounts?.length > 0) {
                const playersRef = collection(db, 'players');
                for (const altUuid of playerData.altAccounts) {
                    const altQuery = await getDocs(query(playersRef, where('uuid', '==', altUuid)));
                    if (!altQuery.empty) {
                        await updateDoc(altQuery.docs[0].ref, {
                            mainAccount: null
                        });
                    }
                }
            }
            
            // If this is an alt account, update its main account
            if (playerData.mainAccount) {
                const mainQuery = await getDocs(
                    query(collection(db, 'players'), where('uuid', '==', playerData.mainAccount))
                );
                if (!mainQuery.empty) {
                    const mainDoc = mainQuery.docs[0];
                    await updateDoc(mainDoc.ref, {
                        altAccounts: mainDoc.data().altAccounts.filter((id: string) => id !== playerData.uuid)
                    });
                }
            }
        }
        
        await deleteDoc(playerRef);
        console.log('Player deletion successful');
    } catch (error) {
        console.error('Error deleting player:', error);
        throw error;
    }
}

export async function updatePlayerEvents(
    playerIgn: string, 
    eventId: string, 
    action: 'add' | 'remove'
): Promise<void> {
    try {
        const playersRef = collection(db, 'players');
        const allPlayersQuery = await getDocs(playersRef);
        const playerDoc = allPlayersQuery.docs.find(doc => 
            doc.data().currentIgn.toLowerCase() === playerIgn.toLowerCase()
        );
        
        if (playerDoc) {
            const playerData = playerDoc.data();
            let events = playerData.events || [];
            
            if (action === 'add' && !events.includes(eventId)) {
                events.push(eventId);
            } else if (action === 'remove') {
                events = events.filter((id: string) => id !== eventId);
            }
            
            await setDoc(playerDoc.ref, { events }, { merge: true });
            console.log(`Successfully ${action}ed event ${eventId} for player ${playerData.currentIgn}`);
        } else {
            console.warn(`No player document found for IGN: ${playerIgn}`);
        }
    } catch (error) {
        console.error('Error updating player events:', error);
    }
}

export async function getAllIgnsForPlayer(uuid: string): Promise<string[]> {
    try {
        const playersRef = collection(db, 'players');
        const playerQuery = await getDocs(query(playersRef, where('uuid', '==', uuid)));
        
        if (!playerQuery.empty) {
            const playerData = playerQuery.docs[0].data();
            const igns = [playerData.currentIgn, ...playerData.pastIgns];
            
            // Include alt account IGNs if this is a main account
            if (playerData.altAccounts?.length > 0) {
                for (const altUuid of playerData.altAccounts) {
                    const altQuery = await getDocs(query(playersRef, where('uuid', '==', altUuid)));
                    if (!altQuery.empty) {
                        const altData = altQuery.docs[0].data();
                        igns.push(altData.currentIgn);
                        igns.push(...(altData.pastIgns || []));
                    }
                }
            }
            
            // Include main account IGNs if this is an alt account
            if (playerData.mainAccount) {
                const mainQuery = await getDocs(
                    query(playersRef, where('uuid', '==', playerData.mainAccount))
                );
                if (!mainQuery.empty) {
                    const mainData = mainQuery.docs[0].data();
                    igns.push(mainData.currentIgn);
                    igns.push(...(mainData.pastIgns || []));
                }
            }
            
            return [...new Set(igns)]; // Remove duplicates
        }
        return [];
    } catch (error) {
        console.error('Error getting player IGNs:', error);
        return [];
    }
}