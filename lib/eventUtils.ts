// lib/eventUtils.ts
import { collection, getDocs, doc, getDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { TimelineEvent } from '@/data/events';
import { extractPlayersFromEvent } from '../src/config/players';

export async function getAllEvents(): Promise<TimelineEvent[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'events'));
    const events = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as TimelineEvent[];
    
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

export async function getEventById(id: string): Promise<TimelineEvent | null> {
  try {
    const docRef = doc(db, 'events', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as TimelineEvent;
    }
    return null;
  } catch (error) {
    console.error('Error fetching event:', error);
    return null;
  }
}

export async function createEvent(eventData: Omit<TimelineEvent, 'id'>): Promise<string> {
    console.log('createEvent called with data:', eventData);
    try {
      // Convert eventData to a simple record of strings
      const eventRecord = {
        ...Object.fromEntries(
          Object.entries(eventData).map(([key, value]) => [
            key, 
            typeof value === 'string' ? value : 
            typeof value === 'boolean' ? value.toString() : 
            JSON.stringify(value)
          ])
        )
      };

      const playerNames = extractPlayersFromEvent(eventRecord);
      console.log('Starting player processing for names:', playerNames);
      
      // Rest of the function remains the same...
      const batch = writeBatch(db);
      const eventsRef = collection(db, 'events');
      const newEventRef = doc(eventsRef);
      
      batch.set(newEventRef, {
        ...eventData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
  
      for (const name of playerNames) {
        try {
          console.log(`Fetching data for player: ${name}`);
          const response = await fetch(`https://api.ashcon.app/mojang/v2/user/${name}`);
          
          if (!response.ok) {
            console.log(`API response not OK for ${name}:`, response.status);
            continue;
          }
          
          const data = await response.json();
          console.log(`Received API data for ${name}:`, data);
          
          const uuid = data.uuid;
          const currentIgn = data.username;
          
          const playerRef = doc(db, 'players', uuid);
          const playerDoc = await getDoc(playerRef);
          
          let pastIgns: string[] = [];
          if (playerDoc.exists()) {
            const existingData = playerDoc.data();
            pastIgns = existingData.pastIgns || [];
            console.log(`Existing data for ${name}:`, existingData);
          }
  
          if (name !== currentIgn && !pastIgns.includes(name)) {
            pastIgns.push(name);
            console.log(`Added ${name} to pastIgns for ${currentIgn}`);
          }
  
          if (data.username_history) {
            const newNames = data.username_history
              .map((history: { username: string }) => history.username)
              .filter((username: string) => 
                username !== currentIgn && !pastIgns.includes(username)
              );
            
            pastIgns.push(...newNames);
            console.log(`Added historical names for ${currentIgn}:`, newNames);
          }
  
          pastIgns = [...new Set(pastIgns)].filter(ign => ign !== currentIgn);
          console.log(`Final pastIgns for ${currentIgn}:`, pastIgns);
  
          batch.set(playerRef, {
            uuid,
            currentIgn,
            pastIgns,
            lastUpdated: new Date()
          }, { merge: true });
          
          console.log(`Added/Updated player document for ${currentIgn} (${uuid})`);
        } catch (error) {
          console.error(`Error processing player ${name}:`, error);
        }
      }
  
      console.log('Committing batch write...');
      await batch.commit();
      console.log('Batch write successful');
      
      return newEventRef.id;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
}

  

export async function updateEvent(id: string, eventData: Partial<TimelineEvent>): Promise<void> {
    console.log('updateEvent called with id:', id, 'and data:', eventData);
    try {
      // Convert eventData to a simple record of strings
      const eventRecord = {
        ...Object.fromEntries(
          Object.entries(eventData).map(([key, value]) => [
            key, 
            typeof value === 'string' ? value : 
            typeof value === 'boolean' ? value.toString() : 
            JSON.stringify(value)
          ])
        )
      };

      const playerNames = extractPlayersFromEvent(eventRecord);
      console.log('Starting player processing for names:', playerNames);

      // Rest of the function remains the same...
      const batch = writeBatch(db);
      const eventRef = doc(db, 'events', id);

      batch.update(eventRef, {
        ...eventData,
        updatedAt: new Date()
      });
  
      for (const name of playerNames) {
        try {
          console.log(`Fetching data for player: ${name}`);
          const response = await fetch(`https://api.ashcon.app/mojang/v2/user/${name}`);
          
          if (!response.ok) {
            console.log(`API response not OK for ${name}:`, response.status);
            continue;
          }
          
          const data = await response.json();
          console.log(`Received API data for ${name}:`, data);
          
          const uuid = data.uuid;
          const currentIgn = data.username;
          
          const playerRef = doc(db, 'players', uuid);
          const playerDoc = await getDoc(playerRef);
          
          let pastIgns: string[] = [];
          if (playerDoc.exists()) {
            const existingData = playerDoc.data();
            pastIgns = existingData.pastIgns || [];
            console.log(`Existing data for ${name}:`, existingData);
          }
  
          if (name !== currentIgn && !pastIgns.includes(name)) {
            pastIgns.push(name);
            console.log(`Added ${name} to pastIgns for ${currentIgn}`);
          }
  
          if (data.username_history) {
            const newNames = data.username_history
              .map((history: { username: string }) => history.username)
              .filter((username: string) => 
                username !== currentIgn && !pastIgns.includes(username)
              );
            
            pastIgns.push(...newNames);
            console.log(`Added historical names for ${currentIgn}:`, newNames);
          }
  
          pastIgns = [...new Set(pastIgns)].filter(ign => ign !== currentIgn);
          console.log(`Final pastIgns for ${currentIgn}:`, pastIgns);
  
          batch.set(playerRef, {
            uuid,
            currentIgn,
            pastIgns,
            lastUpdated: new Date()
          }, { merge: true });
          
          console.log(`Added/Updated player document for ${currentIgn} (${uuid})`);
        } catch (error) {
          console.error(`Error processing player ${name}:`, error);
        }
      }
  
      console.log('Committing batch write...');
      await batch.commit();
      console.log('Batch write successful');
    } catch (error) {
        console.error('Error updating event:', error);
        throw error;
    }
}

export async function deleteEvent(id: string): Promise<void> {
  try {
    const eventRef = doc(db, 'events', id);
    await deleteDoc(eventRef);
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}