// lib/eventUtils.ts
import { collection, getDocs, doc, getDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { TimelineEvent } from '@/data/events';
import { extractPlayersFromEvent } from '../src/config/players';
import { updatePlayerData } from './playerUtils';

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
       await updatePlayerData(name);
     } catch (error) {
       console.error(`Error processing player ${name}:`, error);
     }
   }

   await batch.commit();
   console.log('Event creation successful');
   
   return newEventRef.id;
 } catch (error) {
   console.error('Error creating event:', error);
   throw error;
 }
}

export async function updateEvent(id: string, eventData: Partial<TimelineEvent>): Promise<void> {
 console.log('updateEvent called with id:', id, 'and data:', eventData);
 try {
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

   const batch = writeBatch(db);
   const eventRef = doc(db, 'events', id);

   batch.update(eventRef, {
     ...eventData,
     updatedAt: new Date()
   });

   for (const name of playerNames) {
     try {
       await updatePlayerData(name);
     } catch (error) {
       console.error(`Error processing player ${name}:`, error);
     }
   }

   await batch.commit();
   console.log('Event update successful');
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