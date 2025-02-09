// lib/playerUtils.ts
import { doc, setDoc, collection, getDocs, query, where, getDoc, updateDoc, deleteDoc, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from './firebaseConfig';

interface PastIgn {
  name: string;
  hidden: boolean;
}

interface CraftyUsername {
  username?: string;
}

interface CraftyData {
  username?: string;
  usernames?: (string | CraftyUsername)[];
}

interface PlayerDocument {
  currentIgn: string;
  uuid: string;
  pastIgns: PastIgn[];
  events: string[];
  role: string | null;
  mainAccount?: string | null;
  altAccounts: string[];
  lastUpdated: Date;
}

async function fetchCraftyData(uuid: string): Promise<{ data?: CraftyData } | null> {
  try {
    const response = await fetch(`https://api.crafty.gg/api/v2/players/${uuid}`);
    if (!response.ok) {
      console.log(`[CraftyAPI] Failed to fetch data for UUID ${uuid}`);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[CraftyAPI] Error fetching data:', error);
    return null;
  }
}

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
                        const existingData = existingPlayerQuery.docs[0].data() as PlayerDocument;
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
                    const existingData = existingPlayerQuery.docs[0].data() as PlayerDocument;
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
                            const existingData = existingPlayerQuery.docs[0].data() as PlayerDocument;
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
                    const existingData = existingPlayerQuery.docs[0].data() as PlayerDocument;
                    uuid = existingData.uuid;
                    currentIgn = input;
                } else {
                    return null;
                }
            }
        }

        // Check Crafty.gg for username history
        const craftyData = await fetchCraftyData(uuid);
        if (craftyData?.data?.username) {
            currentIgn = craftyData.data.username;
        }

        const existingPlayerQuery = await getDocs(query(playersRef, where('uuid', '==', uuid)));
        if (!existingPlayerQuery.empty) {
            const existingPlayer = existingPlayerQuery.docs[0];
            const existingData = existingPlayer.data() as PlayerDocument;
            
            if (!existingData.mainAccount) {
                await updateDoc(existingPlayer.ref, {
                    mainAccount: mainPlayerUuid,
                    lastUpdated: new Date()
                });
            }
            return existingData.uuid;
        }

        // Get past usernames from Crafty.gg
        let pastIgns: PastIgn[] = [];
        if (craftyData?.data?.usernames) {
            pastIgns = Array.from(new Set<string>(
                craftyData.data.usernames
                    .filter((username: string | CraftyUsername) => {
                        const name = typeof username === 'string' 
                            ? username 
                            : username.username;
                        return name && name.toLowerCase() !== currentIgn.toLowerCase();
                    })
                    .map((username: string | CraftyUsername) => 
                        typeof username === 'string' ? username : username.username
                    )
                    .filter((name): name is string => name !== undefined)
            )).map((name: string) => ({ name, hidden: false }));
        }

        const playerRef = doc(collection(db, 'players'));
        await setDoc(playerRef, {
            currentIgn,
            uuid,
            pastIgns,
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
        const playersRef = collection(db, 'players');
        const existingPlayerQuery = await getDocs(playersRef);
        const existingPlayer = existingPlayerQuery.docs.find(doc => 
            (doc.data() as PlayerDocument).currentIgn.toLowerCase() === playerIgn.toLowerCase()
        );

        if (existingPlayer && (existingPlayer.data() as PlayerDocument).mainAccount) {
            console.warn(`Cannot update ${playerIgn} as it is an alt account`);
            return;
        }

        const response = await fetch(`https://api.ashcon.app/mojang/v2/user/${playerIgn}`);
        if (!response.ok) {
            console.warn(`Unable to fetch Minecraft data for player ${playerIgn}`);
            
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
        let currentIgn = data.username;

        const craftyData = await fetchCraftyData(uuid);
        let newPastIgns: PastIgn[] = [];
        
        if (craftyData?.data?.usernames) {
            newPastIgns = craftyData.data.usernames
                .filter((username: string | CraftyUsername) => {
                    const name = typeof username === 'string' 
                        ? username 
                        : username.username;
                    return name && name.toLowerCase() !== currentIgn.toLowerCase();
                })
                .map((username: string | CraftyUsername) => ({
                    name: typeof username === 'string' 
                        ? username 
                        : username.username || '',
                    hidden: false
                }));
                        
            if (craftyData.data.username && 
                craftyData.data.username.toLowerCase() !== currentIgn.toLowerCase()) {
                console.log(`[CraftyAPI] Username mismatch detected. Updating to: ${craftyData.data.username}`);
                currentIgn = craftyData.data.username;
            }
        }
        
        // Process alt accounts
        const processedAltUuids = await Promise.all(
            altAccounts
                .filter(alt => alt.trim() !== '')
                .map(alt => processAltAccount(alt.trim(), uuid))
        );
        
        const validAltUuids = processedAltUuids.filter((uuid): uuid is string => uuid !== null);
        
        const playerRef = existingPlayer ? 
            doc(db, 'players', existingPlayer.id) : 
            doc(collection(db, 'players'));
            
        const existingData = existingPlayer?.data() as PlayerDocument | undefined;
        
        // Merge past IGNs while preserving hidden status
        const existingPastIgns = (existingData?.pastIgns || []).map((ign: PastIgn | string) => 
            typeof ign === 'string' ? { name: ign, hidden: false } : ign
        );
        
        const mergedPastIgns = newPastIgns.map(newIgn => {
            const existing = existingPastIgns.find((existing: PastIgn) => 
                existing.name.toLowerCase() === newIgn.name.toLowerCase()
            );
            return existing || newIgn;
        });

        await setDoc(playerRef, {
            currentIgn,
            uuid,
            pastIgns: mergedPastIgns,
            events: existingData?.events || [],
            role: role || null,
            altAccounts: validAltUuids,
            lastUpdated: new Date()
        }, { merge: true });
        
        // Update alt relationships
        const mainAccountQuery = await getDocs(
            query(playersRef, where('altAccounts', 'array-contains', uuid))
        );
        
        for (const doc of mainAccountQuery.docs) {
            const docData = doc.data() as PlayerDocument;
            await updateDoc(doc.ref, {
                altAccounts: docData.altAccounts.filter((id: string) => id !== uuid)
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
            const playerData = playerDoc.data() as PlayerDocument;
            
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
            
            if (playerData.mainAccount) {
                const mainQuery = await getDocs(
                    query(collection(db, 'players'), where('uuid', '==', playerData.mainAccount))
                );
                if (!mainQuery.empty) {
                    const mainDoc = mainQuery.docs[0];
                    const mainData = mainDoc.data() as PlayerDocument;
                    await updateDoc(mainDoc.ref, {
                        altAccounts: mainData.altAccounts.filter((id: string) => id !== playerData.uuid)
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
            (doc.data() as PlayerDocument).currentIgn.toLowerCase() === playerIgn.toLowerCase()
        );
        
        if (playerDoc) {
            const playerData = playerDoc.data() as PlayerDocument;
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
            const igns = [
                playerData.currentIgn,
                ...playerData.pastIgns.map((ign: PastIgn | string) => 
                    typeof ign === 'string' ? ign : ign.name
                )
            ];
            
            if (playerData.altAccounts?.length > 0) {
                for (const altUuid of playerData.altAccounts) {
                    const altQuery = await getDocs(query(playersRef, where('uuid', '==', altUuid)));
                    if (!altQuery.empty) {
                        const altData = altQuery.docs[0].data();
                        igns.push(altData.currentIgn);
                        igns.push(...altData.pastIgns.map((ign: PastIgn | string) => 
                            typeof ign === 'string' ? ign : ign.name
                        ));
                    }
                }
            }
            
            if (playerData.mainAccount) {
                const mainQuery = await getDocs(
                    query(playersRef, where('uuid', '==', playerData.mainAccount))
                );
                if (!mainQuery.empty) {
                    const mainData = mainQuery.docs[0].data();
                    igns.push(mainData.currentIgn);
                    igns.push(...mainData.pastIgns.map((ign: PastIgn | string) => 
                        typeof ign === 'string' ? ign : ign.name
                    ));
                }
            }
            
            return [...new Set(igns)];
        }
        return [];
    } catch (error) {
        console.error('Error getting player IGNs:', error);
        return [];
    }
}