// lib/playerUtils.ts
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

export async function updatePlayerData(playerIgn: string, usedIgn?: string): Promise<void> {
    try {
      // Fetch current data from Ashcon API
      const response = await fetch(`https://api.ashcon.app/mojang/v2/user/${playerIgn}`);
      if (!response.ok) return;
      
      const data = await response.json();
      const uuid = data.uuid;
      const currentIgn = data.username;
      
      // Get existing player data
      const playerRef = doc(db, 'players', uuid);
      const playerDoc = await getDoc(playerRef);
      
      let pastIgns: string[] = [];
      if (playerDoc.exists()) {
        const existingData = playerDoc.data();
        pastIgns = existingData.pastIgns || [];
      }
      
      // If the IGN used in the event is different from current IGN, add it to pastIgns
      if (usedIgn && usedIgn !== currentIgn && !pastIgns.includes(usedIgn)) {
        pastIgns.push(usedIgn);
      }
      
      // Add username history from Ashcon
      if (data.username_history) {
        data.username_history.forEach((history: { username: string }) => {
          if (history.username !== currentIgn && !pastIgns.includes(history.username)) {
            pastIgns.push(history.username);
          }
        });
      }
      
      // Remove duplicates and current IGN from pastIgns
      pastIgns = [...new Set(pastIgns)].filter(ign => ign !== currentIgn);
      
      // Update player document
      await setDoc(playerRef, {
        uuid,
        currentIgn,
        pastIgns,
        lastUpdated: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating player data:', error);
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