// lib/playerUtils.ts
import { doc, setDoc, collection, getDocs, query, where, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

export async function updatePlayerData(playerIgn: string, role?: string | null): Promise<void> {
    try {
        // First check if player already exists (case insensitive)
        const playersRef = collection(db, 'players');
        const existingPlayerQuery = await getDocs(playersRef);
        const existingPlayer = existingPlayerQuery.docs.find(doc => 
            doc.data().currentIgn.toLowerCase() === playerIgn.toLowerCase()
        );

        if (existingPlayer) {
            // Player exists, update role if provided
            if (role !== undefined) {
                await updateDoc(existingPlayer.ref, {
                    role: role,
                    lastUpdated: new Date()
                });
            }
            return;
        }

        // If player doesn't exist, fetch from Minecraft API
        const response = await fetch(`https://api.ashcon.app/mojang/v2/user/${playerIgn}`);
        if (!response.ok) {
            console.warn(`Unable to fetch Minecraft data for player ${playerIgn}`);
            // Create minimal player record with correct capitalization from input
            const playerRef = doc(collection(db, 'players'));
            await setDoc(playerRef, {
                currentIgn: playerIgn,
                pastIgns: [],
                events: [],
                role: role || null,
                lastUpdated: new Date()
            });
            return;
        }
        
        const data = await response.json();
        const uuid = data.uuid;
        const currentIgn = data.username;
        
        // Query for existing player document with this UUID
        const playerQuery = await getDocs(query(playersRef, where('uuid', '==', uuid)));
        
        let existingPlayerId: string | null = null;
        let pastIgns: string[] = [];
        let events: string[] = [];
        
        if (!playerQuery.empty) {
            const existingDoc = playerQuery.docs[0];
            existingPlayerId = existingDoc.id;
            const existingData = existingDoc.data();
            pastIgns = existingData.pastIgns || [];
            events = existingData.events || [];
        }
        
        // Create or update player document
        const playerRef = existingPlayerId ? 
            doc(db, 'players', existingPlayerId) : 
            doc(collection(db, 'players'));
            
        await setDoc(playerRef, {
            currentIgn,
            uuid,
            pastIgns,
            events,
            role: role || null,
            lastUpdated: new Date()
        }, { merge: true });
        
    } catch (error) {
        console.error('Error updating player data:', error);
    }
}

export async function deletePlayer(playerId: string): Promise<void> {
    try {
      const playerRef = doc(db, 'players', playerId);
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
      const playerRef = doc(db, 'players', uuid);
      const playerDoc = await getDoc(playerRef);
      
      if (playerDoc.exists()) {
        const data = playerDoc.data();
        return [data.currentIgn, ...data.pastIgns];
      }
      return [];
    } catch (error) {
      console.error('Error getting player IGNs:', error);
      return [];
    }
  }