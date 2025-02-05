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
    // console.log(`[PlayerAPI] Starting lookup for ${ign}`);
    
    // First check our database
    const playersRef = collection(db, 'players');
    const q = query(playersRef, where('currentIgn', '==', ign));
    const querySnapshot = await getDocs(q);
    
    let dbPlayerData = null;
    if (!querySnapshot.empty) {
      dbPlayerData = querySnapshot.docs[0].data();
     // console.log(`[PlayerAPI] Found player in database:`, dbPlayerData);
    } else {
      // console.log(`[PlayerAPI] Player not found in database`);
    }

    // Get player data from Mojang/Ashcon
    const mojangData = await fetchMojangData(ign);
    if (!mojangData) {
      // console.log(`[PlayerAPI] Failed to fetch Mojang data for ${ign}`);
      return createErrorResponse(ign);
    }
    // console.log(`[PlayerAPI] Successfully fetched Mojang data:`, mojangData);

    // Get events and Hypixel data in parallel
    const [events, hypixelData] = await Promise.all([
      getAllEvents(),
      fetchHypixelData(mojangData.uuid)
    ]);

    // console.log(`[PlayerAPI] Successfully gathered all data for ${ign}`);

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
    // console.log(`[PlayerAPI] All usernames for player:`, allUsernames);

    return {
      historicalIgn: ign,
      currentIgn: mojangData.currentIgn,
      allUsernames,
      playerData,
      initialEvents: events
    };
  } catch (error) {
    console.error('[PlayerAPI] Error in getPlayerData:', error);
    return createErrorResponse(ign);
  }
}

async function fetchMojangData(ign: string) {
  try {
    // console.log(`[MojangAPI] Fetching data for ${ign}`);
    
    // First try official Minecraft API
    const minecraftResponse = await fetch(`https://api.mojang.com/users/profiles/minecraft/${ign}`);
    let uuid;
    let currentIgn;

    if (minecraftResponse.ok) {
      const minecraftData = await minecraftResponse.json();
      uuid = minecraftData.id;
      currentIgn = minecraftData.name;
      // console.log(`[MojangAPI] Found player via Minecraft API:`, minecraftData);
    } else {
      // If Minecraft API fails, try Ashcon as fallback
      // console.log(`[MojangAPI] Minecraft API failed, trying Ashcon fallback`);
      const ashconResponse = await fetch(`https://api.ashcon.app/mojang/v2/user/${ign}`);
      
      if (!ashconResponse.ok) {
        // console.log(`[MojangAPI] Ashcon API fallback failed:`, ashconResponse.status);
        return null;
      }
      
      const ashconData = await ashconResponse.json();
      uuid = ashconData.uuid;
      currentIgn = ashconData.username;
      // console.log(`[MojangAPI] Found player via Ashcon API:`, ashconData);
    }

    // Get profile data from Mojang
    const profileResponse = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`);
    if (!profileResponse.ok) {
      // console.log(`[MojangAPI] Failed to fetch profile data:`, profileResponse.status);
      return null;
    }
    const profileData = await profileResponse.json();

    // Get additional data from Ashcon (for username history and creation date)
    const ashconDataResponse = await fetch(`https://api.ashcon.app/mojang/v2/user/${currentIgn}`);
    const ashconData = await ashconDataResponse.json();

    // Parse texture data
    const textureProperty = profileData.properties.find((p: { name: string }) => p.name === 'textures');
    const textureData = JSON.parse(Buffer.from(textureProperty.value, 'base64').toString());

    let capeUrl = null;
    try {
      const capesResponse = await fetch(`https://api.capes.dev/load/${uuid}`);
      if (capesResponse.ok) {
        const capesData = await capesResponse.json();
        
        // Check for OptiFine cape
        if (capesData.optifine?.msg === "Cape found") {
          capeUrl = capesData.optifine.imageUrl;
          // console.log(`[Cape] ${currentIgn} is using OptiFine cape: ${capeUrl}`);
        }
        // Fallback to Minecraft cape
        else if (textureData.textures.CAPE) {
          capeUrl = textureData.textures.CAPE.url;
          // console.log(`[Cape] ${currentIgn} is using Minecraft cape: ${capeUrl}`);
        } else {
          // console.log(`[Cape] ${currentIgn} has no cape`);
        }
      }
    } catch {
      // console.error('Error fetching capes data:');
      if (textureData.textures.CAPE) {
        capeUrl = textureData.textures.CAPE.url;
        // onsole.log(`[Cape] ${currentIgn} is using Minecraft cape (fallback): ${capeUrl}`);
      }
    }

    return {
      uuid,
      currentIgn,
      created_at: ashconData.created_at || new Date().toISOString(),
      username_history: ashconData.username_history || [{ username: currentIgn }],
      textures: {
        skin: textureData.textures.SKIN.url,
        cape: capeUrl ? { url: capeUrl } : null
      }
    };
  } catch {
    console.error('[MojangAPI] Error', );
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

  } catch {
    console.error('Error fetching Hypixel data');
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