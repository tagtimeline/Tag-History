// src/components/player/PlayerAPI.tsx
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { PlayerProfile } from '../../config/players';
import { TimelineEvent } from '../../data/events';
import { getAllEvents } from '../../../lib/eventUtils';
import { getAllIgnsForPlayer } from '../../../lib/playerUtils';

interface PlayerDataResponse extends Record<string, unknown> {
  historicalIgn: string;
  currentIgn: string | null;
  allUsernames: string[];
  playerData: PlayerProfile | null;
  initialEvents: TimelineEvent[];
}

export async function getPlayerData(ign: string): Promise<PlayerDataResponse> {
  try {
    // First check our database
    const playersRef = collection(db, 'players');
    const q = query(playersRef, where('currentIgn', '==', ign));
    const querySnapshot = await getDocs(q);
    
    let dbPlayerData = null;
    if (!querySnapshot.empty) {
      dbPlayerData = querySnapshot.docs[0].data();
    }

    // Get player UUID and basic info from Ashcon
    const mojangData = await fetchMojangData(ign);
    if (!mojangData) {
      return createErrorResponse(ign);
    }

    // Get events and Hypixel data in parallel
    const [events, hypixelData] = await Promise.all([
      getAllEvents(),
      fetchHypixelData(mojangData.uuid)
    ]);

    // Build the player profile
    const playerData: PlayerProfile = {
      username: mojangData.currentIgn,
      uuid: mojangData.uuid,
      created_at: mojangData.created_at,
      username_history: mojangData.username_history,
      textures: {
        skin: {
          url: mojangData.textures.skin
        },
        cape: mojangData.textures.cape
      },
      hypixel: hypixelData,
      events: dbPlayerData?.events || []
    };

    const allUsernames = await getAllIgnsForPlayer(mojangData.uuid);

    return {
      historicalIgn: ign,
      currentIgn: mojangData.currentIgn,
      allUsernames,
      playerData,
      initialEvents: events
    };
  } catch (error) {
    console.error('Error in getPlayerData:', error);
    return createErrorResponse(ign);
  }
}

async function fetchMojangData(ign: string) {
  try {
    // Get UUID from Ashcon
    const ashconResponse = await fetch(`https://api.ashcon.app/mojang/v2/user/${ign}`);
    if (!ashconResponse.ok) return null;
    const ashconData = await ashconResponse.json();

    // Get profile data from Mojang
    const mojangResponse = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${ashconData.uuid}`);
    if (!mojangResponse.ok) return null;
    const mojangData = await mojangResponse.json();

    // Parse texture data
    const textureProperty = mojangData.properties.find((p: { name: string }) => p.name === 'textures');
    const textureData = JSON.parse(Buffer.from(textureProperty.value, 'base64').toString());

    let capeUrl = null;
    try {
      const capesResponse = await fetch(`https://api.capes.dev/load/${ashconData.uuid}`);
      if (capesResponse.ok) {
        const capesData = await capesResponse.json();
        
        // Check for OptiFine cape by looking at the specific message
        if (capesData.optifine?.msg === "Cape found") {
          capeUrl = capesData.optifine.imageUrl;
          console.log(`[Cape] ${mojangData.name} is using OptiFine cape: ${capeUrl}`);
        }
        // If no OptiFine cape, fallback to Minecraft cape from textureData
        else if (textureData.textures.CAPE) {
          capeUrl = textureData.textures.CAPE.url;
          console.log(`[Cape] ${mojangData.name} is using Minecraft cape: ${capeUrl}`);
        } else {
          console.log(`[Cape] ${mojangData.name} has no cape`);
        }
      }
    } catch (error) {
      console.error('Error fetching capes data:', error);
      // Fallback to Minecraft cape if capes.dev request fails
      if (textureData.textures.CAPE) {
        capeUrl = textureData.textures.CAPE.url;
        console.log(`[Cape] ${mojangData.name} is using Minecraft cape (fallback): ${capeUrl}`);
      }
    }

    return {
      uuid: ashconData.uuid,
      currentIgn: mojangData.name,
      created_at: ashconData.created_at,
      username_history: ashconData.username_history,
      allUsernames: ashconData.username_history?.map((history: { username: string }) => history.username) || [mojangData.name],
      textures: {
        skin: textureData.textures.SKIN.url,
        cape: capeUrl ? { url: capeUrl } : null
      }
    };
  } catch (error) {
    console.error('Error in fetchMojangData:', error);
    return null;
  }
}

async function fetchHypixelData(uuid: string) {
  const HYPIXEL_API_KEY = process.env.HYPIXEL_API_KEY;
  if (!HYPIXEL_API_KEY) {
    console.error('Hypixel API key not found');
    return null;
  }

  try {
    // Fetch player and guild data in parallel
    const [playerResponse, guildResponse] = await Promise.all([
      fetch(`https://api.hypixel.net/player?uuid=${uuid}`, {
        headers: { 'API-Key': HYPIXEL_API_KEY }
      }),
      fetch(`https://api.hypixel.net/guild?player=${uuid}`, {
        headers: { 'API-Key': HYPIXEL_API_KEY }
      })
    ]);

    const playerData = await playerResponse.json();
    if (!playerData.success || !playerData.player) return null;
    
    const guildData = await guildResponse.json();
    const player = playerData.player;

    // Calculate stats
    const networkExp = player.networkExp || 0;
    const networkLevel = Math.floor((Math.sqrt(networkExp + 15312.5) - 125/Math.sqrt(2))/(25*Math.sqrt(2)));

    const tntGames = player.stats?.TNTGames || {};
    const tntWins = tntGames.wins_tntag || 0;
    const tntKills = tntGames.kills_tntag || 0;
    const tntDeaths = tntGames.deaths_tntag || 0;
    const tntKdr = tntDeaths === 0 ? tntKills : Number((tntKills / tntDeaths).toFixed(2));
    const tntPlaytimeMinutes = player.achievements?.tntgames_tnt_triathlon || null;
    const tntPlaytime = tntPlaytimeMinutes ? Math.round(tntPlaytimeMinutes / 60) : 'N/A';

    // Get guild info
    let guildInfo = null;
    if (guildData.success && guildData.guild) {
      const hypixelUuid = uuid.replace(/-/g, '');
      const member = guildData.guild.members.find(
        (m: { uuid: string }) => m.uuid === hypixelUuid
      );

      guildInfo = {
        name: guildData.guild.name,
        rank: member?.rank || null
      };
    }

    return {
      rank: player.rank || 
            (player.monthlyPackageRank !== 'NONE' ? 'SUPERSTAR' : null) || 
            player.newPackageRank || 
            'DEFAULT',
      rankPlusColor: player.rankPlusColor || null,
      monthlyPackageRank: player.monthlyPackageRank || '',
      newPackageRank: player.newPackageRank || '',
      networkLevel,
      guild: guildInfo,
      tntGames: {
        wins_tntag: tntWins,
        playtime: tntPlaytime,
        kdr: tntKdr
      },
      discord: player.socialMedia?.links?.DISCORD || null
    };

  } catch (error) {
    console.error('Error fetching Hypixel data:', error);
    return null;
  }
}

function createErrorResponse(ign: string): PlayerDataResponse {
  return {
    historicalIgn: ign,
    currentIgn: null,
    allUsernames: [],
    playerData: null,
    initialEvents: []
  };
}