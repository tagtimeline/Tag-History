// src/config/players.ts
import { TimelineEvent } from "@/data/events";

export const ROLE_ORDER = [
  "head-dev",
  "dev",
  "staff",
  "sponsor",
  "contributor",
] as const;

export function sortRolesByPriority(
  roleIds: (typeof ROLE_ORDER)[number][]
): (typeof ROLE_ORDER)[number][] {
  return [...roleIds].sort((a, b) => {
    const aIndex = ROLE_ORDER.indexOf(a);
    const bIndex = ROLE_ORDER.indexOf(b);
    return aIndex - bIndex;
  });
}

interface GuildInfo {
  name: string;
  rank?: string;
}

export interface UsernameHistoryItem {
  username: string;
  changedToAt?: number;
}

export interface PlayerProfile {
  username: string;
  uuid: string;
  created_at: string;
  username_history: UsernameHistoryItem[];
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
  events?: string[];
  role?: string | null;
  playerId?: string;
  altAccounts?: string[];
  mainAccount?: string | null;
  pastIgns?: Array<string | { name: string; hidden: boolean }>;
}

export const getCurrentUsername = async (
  historicalIgn: string
): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://api.ashcon.app/mojang/v2/user/${historicalIgn}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

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
  const regex = /<([^:]+):([^>]+)>/gi;
  const matches = text.match(regex) || [];
  // Extract the document ID (second capture group) instead of UUIDs
  const documentIds = [
    ...new Set(
      matches.map((match) => {
        const [, , documentId] = match.match(/<([^:]+):([^>]+)>/) || [];
        return documentId;
      })
    ),
  ];
  return documentIds.filter((id) => id); // Filter out any undefined/null values
}

export function extractPlayersFromEvent(
  event: Partial<TimelineEvent> | Record<string, string | object | null>
): string[] {
  const playerNames = new Set<string>();

  console.log("Scanning event for player names:", event);

  Object.entries(event).forEach(([key, value]) => {
    console.log(`Checking field "${key}":`, value);

    if (typeof value === "string") {
      const names = extractPlayerNames(value);
      names.forEach((name) => playerNames.add(name));
      console.log(`Found names in ${key}:`, names);
    } else if (typeof value === "object" && value !== null) {
      console.log(`Checking nested object in ${key}:`, value);
      Object.values(value).forEach((nestedValue) => {
        if (typeof nestedValue === "string") {
          const names = extractPlayerNames(nestedValue);
          names.forEach((name) => playerNames.add(name));
          console.log(`Found names in nested value:`, names);
        }
      });
    }
  });

  const finalNames = Array.from(playerNames);
  console.log("Final unique player names found in event:", finalNames);
  return finalNames;
}

// Function to format text with player names and links
export const formatPlayerNames = (text: string): string => {
  return text.replace(
    /<([^:]+):([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})>/gi,
    (match, name, uuid) => {
      return `<${name}:${uuid}>`;
    }
  );
};
