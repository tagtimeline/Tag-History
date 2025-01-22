import { categories } from "@/config/categories";

// src/data/events.ts
export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  category: keyof typeof categories;
  description: string;
  tags: string[];
}

export const events: TimelineEvent[] = [
  {
    id: 'initial-tnt-release',
    title: 'TNT Tag Released on Hypixel',
    date: '2014-03-15',
    category: 'hypixel',
    description: `TNT Tag was officially released on the Hypixel Network as a new minigame!

Game Overview:
A fast-paced game of hot potato with TNT. One player starts with TNT and must tag other players before it explodes. Last player standing wins!

Features:
- Multiple maps designed for strategic gameplay
- Power-ups and special abilities
- Custom particle effects and sounds
- Unique scoring system`,
    tags: ['release', 'launch', 'hot potato']
  },
  {
    id: 'first-guild-war',
    title: 'First Major Guild War: Shadow vs. Light',
    date: '2014-08-22',
    category: 'guilds',
    description: `The first major guild war between Shadow Dynasty and Light Brigade erupted over control of the weekly leaderboards.

The conflict lasted for 3 weeks, with both guilds competing intensely in TNT Tag matches. Members from both sides showed exceptional skill and strategy.

Notable Moments:
- Record-breaking 12-hour gaming session
- Multiple perfect games achieved
- New strategies developed that would later become standard
- Over 1000 matches played between the guilds

The war ended with Shadow Dynasty claiming victory by a narrow margin of 50 points.`,
    tags: ['guild war', 'feud']
  },
  {
    id: 'halloween-update-2015',
    title: 'Spooky TNT Tag Halloween Update',
    date: '2015-10-31',
    category: 'hypixel',
    description: `Special Halloween-themed update bringing spooky changes to TNT Tag!

New Features:
- Ghost particles when tagged
- Pumpkin head cosmetics
- Haunted mansion map
- Special Halloween sound effects
- Limited-time achievements

The update was available throughout the Halloween season and became one of the most popular seasonal events.`,
    tags: ['update', 'seasonal']
  },
  {
    id: 'first-tournament',
    title: 'First Official TNT Tag Tournament',
    date: '2015-12-20',
    category: 'hypixel',
    description: `The first officially sanctioned TNT Tag tournament hosted by Hypixel staff.

Tournament Structure:
- 64 players qualified through preliminary rounds
- Single elimination bracket
- Best of 5 matches per round
- Custom tournament lobby

Prize Pool:
- 1st Place: 100,000 Hypixel Coins + Exclusive Tag
- 2nd Place: 50,000 Hypixel Coins
- 3rd Place: 25,000 Hypixel Coins

The event drew over 1,000 spectators and set the standard for future tournaments.`,
    tags: ['tournament', 'competition']
  },
  {
    id: 'technique-discovery',
    title: 'Discovery of "Wall-Jumping" Technique',
    date: '2016-04-15',
    category: 'other',
    description: `Player xXSpeedsterXx discovered a revolutionary new movement technique called "wall-jumping" that changed how TNT Tag was played.

The Technique:
- Utilizing specific block corners to gain extra height
- Combining jumps with precise timing
- Allowing for new escape routes and tag strategies

Impact:
This discovery led to a complete meta shift in high-level play, with players incorporating wall-jumping into their standard strategies. The technique was later officially acknowledged by Hypixel staff as a legitimate strategy.

Training academies began including wall-jumping in their basic curriculum, and new maps were designed with this technique in mind.`,
    tags : ['technique', 'strategy']
  },
  {
    id: 'tnt-championships-2025',
    title: 'TNT Tag Championships - CAPTAINS EDITION',
    date: '2025-01-09',
    category: 'feuds',
    description: `Event Details
Hosted by matasx in collaboration with Skyscraper and xbadman

Concept
In this tournament, the top 8 most skilled players to sign up will be pre selected as team captains. Each captain will draft a team of 5, from a total pool of 32 players.

Pre Selection Group Stage:
Players will be divided into about 8 groups (balanced). Each player will face the others once, in a first-to-5 format. Players with the lowest score in each group will be eliminated.

Captains Selection Process:
Captains will select their teams in a public voice channel of the people that qualified, with the picking order randomized live.

Bracket Stage:
The teams will enter a double-elimination bracket.

Prizes
A huge thanks to our generous sponsors!
🥇 1st Place: $250 ($50 per player) + Custom Role`,
    tags: ['tournament', 'competition']
  }
];