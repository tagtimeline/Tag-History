// lib/playerUtils.ts
import { doc, setDoc, collection, getDocs, query, where, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

export async function updatePlayerData(playerIgn: string, usedIgn?: string): Promise<void> {
    try {
        const response = await fetch(`https://api.ashcon.app/mojang/v2/user/${playerIgn}`);
        if (!response.ok) return;
        
        const data = await response.json();
        const uuid = data.uuid;
        const currentIgn = data.username;
        
        // Query for existing player document with this UUID
        const playersRef = collection(db, 'players');
        const playerQuery = await getDocs(query(playersRef, where('uuid', '==', uuid)));
        
        let existingPlayerId: string | null = null;
        let pastIgns: string[] = [];
        let events: string[] = [];  // Add events array
        
        if (!playerQuery.empty) {
            const existingDoc = playerQuery.docs[0];
            existingPlayerId = existingDoc.id;
            const existingData = existingDoc.data();
            pastIgns = existingData.pastIgns || [];
            events = existingData.events || [];  // Preserve existing events
        }
        
        if (usedIgn && usedIgn !== currentIgn && !pastIgns.includes(usedIgn)) {
            pastIgns.push(usedIgn);
        }
        
        if (data.username_history) {
            data.username_history.forEach((history: { username: string }) => {
                if (history.username !== currentIgn && !pastIgns.includes(history.username)) {
                    pastIgns.push(history.username);
                }
            });
        }
        
        pastIgns = [...new Set(pastIgns)].filter(ign => ign !== currentIgn);
        
        // Create or update document
        const playerRef = existingPlayerId ? 
            doc(db, 'players', existingPlayerId) : 
            doc(collection(db, 'players')); // This creates a random ID
            
        await setDoc(playerRef, {
            uuid,
            currentIgn,
            pastIgns,
            events,  // Include events array
            lastUpdated: new Date()
        }, { merge: true });
    } catch (error) {
        console.error('Error updating player data:', error);
    }
}

// New function to update player's events array
export async function updatePlayerEvents(
    playerIgn: string, 
    eventId: string, 
    action: 'add' | 'remove'
): Promise<void> {
    try {
        const playersRef = collection(db, 'players');
        const playerQuery = await getDocs(query(playersRef, where('currentIgn', '==', playerIgn)));
        
        if (!playerQuery.empty) {
            const playerDoc = playerQuery.docs[0];
            const playerData = playerDoc.data();
            let events = playerData.events || [];
            
            if (action === 'add' && !events.includes(eventId)) {
                events.push(eventId);
            } else if (action === 'remove') {
                events = events.filter((id: string) => id !== eventId);
            }
            
            await setDoc(playerDoc.ref, { events }, { merge: true });
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