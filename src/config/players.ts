// src/config/players.ts

interface GuildInfo {
    name: string;
    rank?: string;
  }

export interface PlayerProfile {
    username: string;
    uuid: string;
    created_at: string;
    username_history: {
      username: string;
      changed_at?: string;
    }[];
    textures: {
      skin: {
        url: string;
        data?: string;
      };
      cape: {
        url: string;
        data?: string;
      } | null;
    };
    hypixel: {
      rank: string;
      rankPlusColor: string | null;
      monthlyPackageRank: string;
      newPackageRank: string;
      networkLevel: number;
      guild: GuildInfo | null;
      tntGames: {
        wins_tntag: number;
        playtime: number | string;
        kdr: number;
    };
      discord: string | null;
    } | null;
}
  
    export const getCurrentUsername = async (historicalIgn: string): Promise<string | null> => {
    try {
        const response = await fetch(`https://api.ashcon.app/mojang/v2/user/${historicalIgn}`, {
        headers: {
            'Accept': 'application/json'
        }
        });
        
        if (!response.ok) {
        if (response.status === 404) {
            console.log(`Player ${historicalIgn} not found`);
            return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: PlayerProfile = await response.json();
        return data.username;
    } catch (error) {
        console.error(`Error fetching player data for ${historicalIgn}:`, error);
        return null;
    }
    };
  
  // Function to extract player IGNs from text
  export function extractPlayerNames(text: string): string[] {
    const regex = /<([^>]+)>/g;
    const matches = text.match(regex) || [];
    const names = [...new Set(matches.map(match => match.slice(1, -1).trim()))];
    console.log('Extracted names from text:', { text, names });
    return names;
  }
  
  export function extractPlayersFromEvent(event: any): string[] {
    const playerNames = new Set<string>();
    
    console.log('Scanning event for player names:', event);
    
    Object.entries(event).forEach(([key, value]) => {
      console.log(`Checking field "${key}":`, value);
      
      if (typeof value === 'string') {
        const names = extractPlayerNames(value);
        names.forEach(name => playerNames.add(name));
        console.log(`Found names in ${key}:`, names);
      } else if (typeof value === 'object' && value !== null) {
        console.log(`Checking nested object in ${key}:`, value);
        Object.values(value).forEach(nestedValue => {
          if (typeof nestedValue === 'string') {
            const names = extractPlayerNames(nestedValue);
            names.forEach(name => playerNames.add(name));
            console.log(`Found names in nested value:`, names);
          }
        });
      }
    });
    
    const finalNames = Array.from(playerNames);
    console.log('Final unique player names found in event:', finalNames);
    return finalNames;
  }

  // Function to format text with player names and links
  export const formatPlayerNames = (text: string): string => {
    return text.replace(/<([^>]+)>/g, (match, ign) => {
      return `<${ign}>`; // Keep the original IGN in text
    });
  };