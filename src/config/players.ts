// src/config/players.ts

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
      guild: {
        name: string;
      } | null;
      tntGames: {
        wins: number;
        playtime: number;
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
  export const extractPlayerNames = (text: string): string[] => {
    const matches = text.match(/<([^>]+)>/g) || [];
    return matches.map(match => match.slice(1, -1));
  };
  
  // Function to format text with player names and links
  export const formatPlayerNames = (text: string): string => {
    return text.replace(/<([^>]+)>/g, (match, ign) => {
      return `<${ign}>`; // Keep the original IGN in text
    });
  };