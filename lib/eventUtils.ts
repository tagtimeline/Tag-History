// lib/eventUtils.ts
import { collection, getDocs, doc, getDoc, deleteDoc, writeBatch, query, where, updateDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { TimelineEvent } from '@/data/events';
import { extractPlayersFromEvent } from '../src/config/players';
import { updatePlayerData, updatePlayerEvents } from './playerUtils';

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

// Helper function to get player ref by name
async function getPlayerRefByName(name: string) {
  const playersRef = collection(db, 'players');
  const querySnapshot = await getDocs(
    query(playersRef, where('currentIgn', '==', name))
  );
  
  if (!querySnapshot.empty) {
    return doc(db, 'players', querySnapshot.docs[0].id);
  }
  
  return null;
}

// Helper function to update player names from Crafty.gg
async function updatePlayerNameHistory(name: string): Promise<void> {
  const playerRef = await getPlayerRefByName(name);
  if (!playerRef) {
    console.log(`No existing player found for ${name}, will create new`);
    return;
  }

  const playerDoc = await getDoc(playerRef);
  if (!playerDoc.exists()) return;

  const playerData = playerDoc.data();
  try {
    const craftyResponse = await fetch(`https://api.crafty.gg/api/v2/players/${playerData.uuid}`);
    if (!craftyResponse.ok) {
      console.log(`Failed to fetch Crafty.gg data for ${name}`);
      return;
    }

    const craftyData = await craftyResponse.json();
    const currentIgn = craftyData.usernames[0];
    const pastIgns = Array.from(new Set(
      craftyData.usernames.filter((n: string) => 
        n.toLowerCase() !== currentIgn.toLowerCase()
      )
    ));

    // Only update if there are changes
    if (currentIgn.toLowerCase() !== playerData.currentIgn.toLowerCase() || 
        JSON.stringify(pastIgns.sort()) !== JSON.stringify(playerData.pastIgns.sort())) {
      
      console.log(`Updating ${playerData.currentIgn} -> ${currentIgn}`);
      await updateDoc(playerRef, {
        currentIgn,
        pastIgns,
        lastUpdated: new Date()
      });
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (error) {
    console.error(`Error updating name history for ${name}:`, error);
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
    
    // Create the event first
    const batch = writeBatch(db);
    const eventsRef = collection(db, 'events');
    const newEventRef = doc(eventsRef);
    
    batch.set(newEventRef, {
      ...eventData,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await batch.commit();

    // After event is created, update player references
    for (const name of playerNames) {
      try {
        // First update name history
        await updatePlayerNameHistory(name);
        
        // Then ensure player exists and is linked to event
        await updatePlayerData(name);
        await updatePlayerEvents(name, newEventRef.id, 'add');
      } catch (error) {
        console.error(`Error processing player ${name}:`, error);
      }
    }

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
    // Get old event to compare players
    const oldEvent = await getEventById(id);
    if (!oldEvent) {
      throw new Error('Event not found');
    }
    
    // Create complete new event data by merging old and new
    const newEventData = {
      ...oldEvent,
      ...eventData
    };

    // Get all players from both versions of the event
    const oldPlayers = extractPlayersFromEvent(oldEvent);
    const newPlayers = extractPlayersFromEvent(newEventData);
    console.log('Old players:', oldPlayers);
    console.log('New players:', newPlayers);

    // Update the event first
    const batch = writeBatch(db);
    const eventRef = doc(db, 'events', id);

    batch.update(eventRef, {
      ...eventData,
      updatedAt: new Date()
    });

    await batch.commit();

    // First, remove event from all old players
    for (const player of oldPlayers) {
      try {
        await updatePlayerEvents(player, id, 'remove');
        console.log(`Removed event ${id} from player ${player}`);
      } catch (error) {
        console.error(`Error removing event from player ${player}:`, error);
      }
    }

    // Then, process all new players
    for (const player of newPlayers) {
      try {
        // First update name history
        await updatePlayerNameHistory(player);
        
        // Then ensure player exists and is linked to event
        await updatePlayerData(player);
        await updatePlayerEvents(player, id, 'add');
        console.log(`Added/Verified event ${id} for player ${player}`);
      } catch (error) {
        console.error(`Error adding event to player ${player}:`, error);
      }
    }

    // Double-check all new players have the event
    for (const player of newPlayers) {
      try {
        const playersRef = collection(db, 'players');
        const playerQuery = await getDocs(query(playersRef, where('currentIgn', '==', player)));
        
        if (!playerQuery.empty) {
          const playerDoc = playerQuery.docs[0];
          const playerData = playerDoc.data();
          const events = playerData.events || [];
          
          if (!events.includes(id)) {
            console.log(`Re-adding missing event ${id} to player ${player}`);
            await updatePlayerEvents(player, id, 'add');
          }
        }
      } catch (error) {
        console.error(`Error verifying event for player ${player}:`, error);
      }
    }

    console.log('Event update successful with player links verified');
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
}

export async function deleteEvent(id: string): Promise<void> {
  try {
    // Get event to find affected players
    const event = await getEventById(id);
    if (event) {
      const players = extractPlayersFromEvent(event);
      
      // Remove event reference from all players
      for (const player of players) {
        try {
          await updatePlayerEvents(player, id, 'remove');
        } catch (error) {
          console.error(`Error removing event from player ${player}:`, error);
        }
      }
    }

    // Delete the event
    const eventRef = doc(db, 'events', id);
    await deleteDoc(eventRef);
    
    console.log('Event deletion successful');
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}

export async function getPlayerEvents(playerIds: string[]): Promise<TimelineEvent[]> {
  try {
    const eventsRef = collection(db, 'events');
    const eventsQuery = query(eventsRef, where('id', 'in', playerIds));
    const querySnapshot = await getDocs(eventsQuery);
    
    const events = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as TimelineEvent[];
    
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error('Error fetching player events:', error);
    return [];
  }
}