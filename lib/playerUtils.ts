// lib/playerUtils.ts
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

export async function updatePlayerData(playerIgn: string, usedIgn?: string): Promise<void> {
   try {
       const response = await fetch(`https://api.ashcon.app/mojang/v2/user/${playerIgn}`);
       if (!response.ok) return;
       
       const data = await response.json();
       const uuid = data.uuid;
       const currentIgn = data.username;
       
       // Get existing player data using old IGN
       const oldPlayerRef = doc(db, 'players', playerIgn);
       const oldPlayerDoc = await getDoc(oldPlayerRef);
       
       let pastIgns: string[] = [];
       if (oldPlayerDoc.exists()) {
           const existingData = oldPlayerDoc.data();
           pastIgns = existingData.pastIgns || [];
           // Delete old document if IGN changed
           if (playerIgn !== currentIgn) {
               await deleteDoc(oldPlayerRef);
           }
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
       
       // Create/update document with current IGN as ID
       const newPlayerRef = doc(db, 'players', currentIgn);
       await setDoc(newPlayerRef, {
           uuid,
           currentIgn,
           pastIgns,
           lastUpdated: new Date()
       }, { merge: true });
   } catch (error) {
       console.error('Error updating player data:', error);
   }
}

export async function getAllIgnsForPlayer(currentIgn: string): Promise<string[]> {
   try {
       const playerRef = doc(db, 'players', currentIgn);
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