import { doc, setDoc, collection, getDocs, query, where, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

interface PastIgn {
 name: string;
 hidden: boolean;
 number?: number;
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
       const normalizedMainUuid = mainPlayerUuid.replace(/-/g, '');
       let uuid: string;
       let currentIgn: string;

       // Check if input is UUID format
       const uuidRegex = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
       const normalizedInput = input.replace(/-/g, '');
       
       if (uuidRegex.test(input)) {
           // Check if player already exists
           const existingPlayerQuery = await getDocs(query(playersRef, where('uuid', '==', normalizedInput)));
           if (!existingPlayerQuery.empty) {
               const existingData = existingPlayerQuery.docs[0].data() as PlayerDocument;
               return existingData.uuid;
           }

           try {
               const craftyData = await fetchCraftyData(normalizedInput);
               if (!craftyData?.data?.username) {
                   return null;
               }
               uuid = normalizedInput;
               currentIgn = craftyData.data.username;
           } catch (error) {
               console.error('Error fetching Crafty data:', error);
               return null;
           }
       } else {
           try {
               const craftyResponse = await fetch(`https://api.crafty.gg/api/v2/players/search?username=${input}`);
               if (!craftyResponse.ok) {
                   return null;
               }
               const searchData = await craftyResponse.json() as {
                   success: boolean;
                   data?: { username: string; uuid: string; }[];
               };
               
               if (!searchData.success || !searchData.data?.length) {
                   return null;
               }

               const player = searchData.data.find(p => 
                   p.username.toLowerCase() === input.toLowerCase()
               );
               if (!player) {
                   return null;
               }

               const normalizedFoundUuid = player.uuid.replace(/-/g, '');
               
               // Check if player already exists
               const existingPlayerQuery = await getDocs(query(playersRef, where('uuid', '==', normalizedFoundUuid)));
               if (!existingPlayerQuery.empty) {
                   return normalizedFoundUuid;
               }

               uuid = normalizedFoundUuid;
               currentIgn = player.username;
           } catch (error) {
               console.error('Error processing IGN:', error);
               return null;
           }
       }

       // Get past usernames from Crafty
       let pastIgns: PastIgn[] = [];
       const craftyData = await fetchCraftyData(uuid);
       if (craftyData?.data?.usernames) {
           const uniqueNames = Array.from(new Set<string>(
               craftyData.data.usernames
                   .filter((username: string | CraftyUsername) => {
                       const name = typeof username === 'string' ? username : username.username;
                       return name && currentIgn && name.toLowerCase() !== currentIgn.toLowerCase();
                   })
                   .map((username: string | CraftyUsername) => 
                       typeof username === 'string' ? username : username.username
                   )
                   .filter((name): name is string => name !== undefined)
           ));

           pastIgns = uniqueNames.map((name: string, index, array) => ({ 
               name, 
               hidden: false,
               number: array.length - 1 - index
           }));
       }

       const playerRef = doc(collection(db, 'players'));
       await setDoc(playerRef, {
           currentIgn,
           uuid,
           pastIgns,
           events: [],
           role: null,
           mainAccount: normalizedMainUuid,
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
   uuid: string, 
   role?: string | null, 
   altAccounts: string[] = []
): Promise<void> {
   try {
       const normalizedUuid = uuid.replace(/-/g, '');
       const playersRef = collection(db, 'players');

       const existingPlayerQuery = await getDocs(query(playersRef, where('uuid', '==', normalizedUuid)));
       const existingPlayer = existingPlayerQuery.docs[0];
       const existingData = existingPlayer?.data() as PlayerDocument | undefined;

       if (existingPlayer && existingData?.mainAccount) {
           console.warn(`Cannot update ${existingData.currentIgn} as it is an alt account`);
           return;
       }

       const craftyData = await fetchCraftyData(normalizedUuid);
       if (!craftyData?.data) {
           console.warn(`Unable to fetch Crafty data for UUID ${normalizedUuid}`);
           return;
       }

       const currentIgn = craftyData.data.username;
       let newPastIgns: PastIgn[] = [];

        if (craftyData.data.usernames) {
            newPastIgns = craftyData.data.usernames
                   .filter((username: string | CraftyUsername) => {
                       const name = typeof username === 'string' ? username : username.username;
                       return name && currentIgn && name.toLowerCase() !== currentIgn.toLowerCase();
                   })
                .map((username: string | CraftyUsername, index, array) => ({
                    name: typeof username === 'string' ? username : username.username || '',
                    hidden: false,
                    number: array.length - 1 - index
                }));
        }
       
       const processedAltUuids = await Promise.all(
           altAccounts
               .filter(alt => alt.trim() !== '')
               .map(alt => processAltAccount(alt.trim(), normalizedUuid))
       );
       
       const validAltUuids = processedAltUuids.filter((uuid): uuid is string => uuid !== null);
       
       const playerRef = existingPlayer ? 
           doc(db, 'players', existingPlayer.id) : 
           doc(collection(db, 'players'));
           
       const existingPastIgns = (existingData?.pastIgns || []).map((ign: PastIgn | string) => 
           typeof ign === 'string' ? { name: ign, hidden: false, number: 0 } : ign
       );
       
       const mergedPastIgns = [...existingPastIgns];
       newPastIgns.forEach(newIgn => {
           if (!mergedPastIgns.some(existing => 
               existing.name.toLowerCase() === newIgn.name.toLowerCase()
           )) {
               mergedPastIgns.push(newIgn);
           }
       });

       // Reassign numbers based on merged list
       const sortedPastIgns = mergedPastIgns.map((ign, index, array) => ({
           ...ign,
           number: array.length - 1 - index
       }));

       await setDoc(playerRef, {
           currentIgn,
           uuid: normalizedUuid,
           pastIgns: sortedPastIgns,
           events: existingData?.events || [],
           role: role || null,
           altAccounts: validAltUuids,
           lastUpdated: new Date()
       }, { merge: true });
       
       const mainAccountQuery = await getDocs(
           query(playersRef, where('altAccounts', 'array-contains', normalizedUuid))
       );
       
       for (const doc of mainAccountQuery.docs) {
           const docData = doc.data() as PlayerDocument;
           await updateDoc(doc.ref, {
               altAccounts: docData.altAccounts.filter((id: string) => id !== normalizedUuid)
           });
       }
       
   } catch (error) {
       console.error('Error updating player data:', error);
   }
}

export async function updatePlayerEvents(playerId: string, eventId: string, action: 'add' | 'remove'): Promise<void> {
    try {
      const playerDoc = await getDoc(doc(db, 'players', playerId));
  
      if (playerDoc.exists()) {
        const playerData = playerDoc.data() as PlayerDocument;
        let events = playerData.events || [];
  
        if (action === 'add') {
          if (!events.includes(eventId)) {
            events.push(eventId);
            console.log(`Added event ${eventId} to player ${playerId}`);
          } else {
            console.log(`Event ${eventId} already exists in player ${playerId}`);
          }
        } else if (action === 'remove') {
          const updatedEvents = events.filter((id: string) => id !== eventId);
          if (events.length !== updatedEvents.length) {
            events = updatedEvents;
            console.log(`Removed event ${eventId} from player ${playerId}`);
          } else {
            console.log(`Event ${eventId} not found in player ${playerId}`);
          }
        }
  
        await setDoc(playerDoc.ref, { events }, { merge: true });
        console.log(`Successfully ${action}ed event ${eventId} for player ${playerData.currentIgn} (${playerId})`);
      } else {
        console.warn(`No player document found with ID: ${playerId}`);
      }
    } catch (error) {
      console.error('Error updating player events:', error);
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

export async function getAllIgnsForPlayer(uuid: string): Promise<string[]> {
   try {
       const normalizedUuid = uuid.replace(/-/g, '');
       const playersRef = collection(db, 'players');
       const playerQuery = await getDocs(query(playersRef, where('uuid', '==', normalizedUuid)));
       
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