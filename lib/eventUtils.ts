import {
  collection,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { TimelineEvent } from "@/data/events";
import { extractPlayersFromEvent } from "../src/config/players";
import { updatePlayerData, updatePlayerEvents } from "./playerUtils";

export async function getAllEvents(): Promise<TimelineEvent[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "events"));
    const events = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TimelineEvent[];

    return events.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
}

export async function getEventById(id: string): Promise<TimelineEvent | null> {
  try {
    const docRef = doc(db, "events", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as TimelineEvent;
    }
    return null;
  } catch (error) {
    console.error("Error fetching event:", error);
    return null;
  }
}

async function fetchCraftyData(uuid: string) {
  try {
    const response = await fetch(
      `https://api.crafty.gg/api/v2/players/${uuid}`
    );
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Error fetching Crafty data:", error);
    return null;
  }
}

async function updatePlayerNameHistory(uuid: string): Promise<void> {
  const normalizedUuid = uuid.replace(/-/g, "");
  const playersRef = collection(db, "players");
  const playerQuery = await getDocs(
    query(playersRef, where("uuid", "==", normalizedUuid))
  );

  if (!playerQuery.empty) {
    const playerDoc = playerQuery.docs[0];
    const craftyData = await fetchCraftyData(normalizedUuid);
    if (!craftyData?.data) return;

    const currentIgn = craftyData.data.username;
    const newPastIgns = craftyData.data.usernames
      ?.filter((username: string | { username?: string }) => {
        const name =
          typeof username === "string" ? username : username.username;
        return name && name.toLowerCase() !== currentIgn.toLowerCase();
      })
      .map(
        (
          username: string | { username?: string },
          index: number,
          array: (string | { username?: string })[]
        ) => ({
          name:
            typeof username === "string" ? username : username.username || "",
          hidden: false,
          number: array.length - 1 - index,
        })
      );

    await updateDoc(playerDoc.ref, {
      currentIgn,
      pastIgns: newPastIgns,
      lastUpdated: new Date(),
    });

    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

export async function createEvent(
  eventData: Omit<TimelineEvent, "id">
): Promise<string> {
  console.log("createEvent called with data:", eventData);
  try {
    const eventRecord = {
      ...Object.fromEntries(
        Object.entries(eventData).map(([key, value]) => [
          key,
          typeof value === "string"
            ? value
            : typeof value === "boolean"
            ? value.toString()
            : JSON.stringify(value),
        ])
      ),
    };

    // Extract all player document IDs from the event content
    const playerIds = extractPlayersFromEvent(eventRecord);

    const batch = writeBatch(db);
    const eventsRef = collection(db, "events");
    const newEventRef = doc(eventsRef);

    batch.set(newEventRef, {
      ...eventData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await batch.commit();

    // Update each mentioned player to include this event
    for (const playerId of playerIds) {
      try {
        // Only add if not already present
        await updatePlayerEvents(playerId, newEventRef.id, "add");
      } catch (error) {
        console.error(`Error processing player ${playerId}:`, error);
      }
    }

    return newEventRef.id;
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
}

export async function updateEvent(
  id: string,
  eventData: Partial<TimelineEvent>
): Promise<void> {
  try {
    const oldEvent = await getEventById(id);
    if (!oldEvent) {
      throw new Error("Event not found");
    }

    const newEventData = {
      ...oldEvent,
      ...eventData,
    };

    // Get both old and new sets of player mentions
    const oldPlayers = extractPlayersFromEvent(oldEvent);
    const newPlayers = extractPlayersFromEvent(newEventData);

    console.log("Old player IDs:", oldPlayers);
    console.log("New player IDs:", newPlayers);

    const batch = writeBatch(db);
    const eventRef = doc(db, "events", id);

    batch.update(eventRef, {
      ...eventData,
      updatedAt: new Date(),
    });

    await batch.commit();

    // Remove event from players no longer mentioned
    const removedPlayers = oldPlayers.filter(
      (playerId) => !newPlayers.includes(playerId)
    );
    for (const playerId of removedPlayers) {
      try {
        await updatePlayerEvents(playerId, id, "remove");
      } catch (error) {
        console.error(`Error removing event from player ${playerId}:`, error);
      }
    }

    // Add event to newly mentioned players
    const addedPlayers = newPlayers.filter(
      (playerId) => !oldPlayers.includes(playerId)
    );
    console.log("Added players:", addedPlayers);
    for (const playerId of addedPlayers) {
      console.log(`Updating events for player ${playerId}`);
      try {
        await updatePlayerEvents(playerId, id, "add");
      } catch (error) {
        console.error(`Error adding event to player ${playerId}:`, error);
      }
    }
  } catch (error) {
    console.error("Error updating event:", error);
    throw error;
  }
}

export async function deleteEvent(id: string): Promise<void> {
  try {
    const event = await getEventById(id);
    if (event) {
      // Get all players mentioned in the event
      const players = extractPlayersFromEvent(event);

      // Remove this event from all mentioned players
      for (const playerId of players) {
        try {
          await updatePlayerEvents(playerId, id, "remove");
        } catch (error) {
          console.error(`Error removing event from player ${playerId}:`, error);
        }
      }
    }

    const eventRef = doc(db, "events", id);
    await deleteDoc(eventRef);
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
}

export async function getPlayerEvents(
  playerIds: string[]
): Promise<TimelineEvent[]> {
  try {
    const eventsRef = collection(db, "events");
    const eventsQuery = query(eventsRef, where("id", "in", playerIds));
    const querySnapshot = await getDocs(eventsQuery);

    const events = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TimelineEvent[];

    return events.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  } catch (error) {
    console.error("Error fetching player events:", error);
    return [];
  }
}
