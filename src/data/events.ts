// src/data/events.ts
import { categories } from "@/config/categories";

export interface SideEvent {
  id: string;
  title: string;
  description: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  category: keyof typeof categories;
  isSpecial?: boolean;
  description: string;
  sideEvents?: SideEvent[]; 
  tags: string[];
}

export const events: TimelineEvent[] = [
  {
    id: 'initial-tnt-release',
    title: 'TNT Tag Released on Hypixel',
    date: '2013-10-20',
    category: 'hypixel',
    isSpecial: true,
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
    id: "event1",
    title: "Fist Tag Feuds Main Event",
    date: "2014-01-24",
    endDate: "2014-10-23",
    description: `TNT Tag was officially released on the Hypixel Network as a new minigame!

Game Overview:
A fast-paced game of hot potato with TNT. One player starts with TNT and must tag other players before it explodes. Last player standing wins!

Features:
- Multiple maps designed for strategic gameplay
- Power-ups and special abilities
- Custom particle effects and sounds
- Unique scoring system`,
    category: "feuds",
    tags: ["feuds", "main event"],
    sideEvents: [
      {
        id: "side1",
        title: "Taggers' Gauntlet Showdown",
        description: "Players compete in an intense gauntlet where the TNT explodes faster each round. Speed, strategy, and reflexes are key as the last player standing earns the ultimate bragging rights!"
      },
      {
        id: "side2",
        title: "Timed Explosion Tournament",
        description: "A high-stakes tournament where players have a set amount of time to pass the TNT before it detonates. With shorter rounds and shrinking safe zones, this event keeps everyone on their toes!"
      }
    ]
  },
  {
    id: 'first-guild-war',
    title: 'First Major Guild War: Shadow vs. Light',
    date: '2014-04-22',
    endDate: '2015-02-13',
    category: 'guilds',
    description: `The first major guild war between Shadow Dynasty and Light Brigade erupted over control of the weekly leaderboards.

The conflict lasted for 3 weeks, with both guilds competing intensely in TNT Tag matches. Members from both sides showed exceptional skill and strategy.

Notable Moments:
- Record-breaking 12-hour gaming session
- Multiple perfect games achieved
- New strategies developed that would later become standard
- Over 1000 matches played between the guilds

The war ended with Shadow Dynasty claiming victory by a narrow margin of 50 points.`,
    tags: ['guild war', 'feud'],
    sideEvents: [
      {
        id: "side3",
        title: "Guild Trivia Night",
        description: "A fun side event where members of both guilds competed in a TNT-themed trivia contest."
      },
      {
        id: "side4",
        title: "Shadow vs. Light Charity Match",
        description: "A friendly match held to raise funds for a community cause, with proceeds going to a player-nominated charity."
      }
    ]
  },
  {
    id: "event2",
    title: "Fist Tag Feuds Mini Event",
    date: "2015-01-24",
    endDate: "2016-10-23",
    description: `TNT Tag was officially released on the Hypixel Network as a new minigame!

Game Overview:
A fast-paced game of hot potato with TNT. One player starts with TNT and must tag other players before it explodes. Last player standing wins!

Features:
- Multiple maps designed for strategic gameplay
- Power-ups and special abilities
- Custom particle effects and sounds
- Unique scoring system`,
    category: "feuds",
    tags: ["feuds", "main event"],
    sideEvents: [
      {
        id: "side1",
        title: "Taggers' Gauntlet Showdown",
        description: "Players compete in an intense gauntlet where the TNT explodes faster each round. Speed, strategy, and reflexes are key as the last player standing earns the ultimate bragging rights!"
      },
      {
        id: "side2",
        title: "Timed Explosion Tournament",
        description: "A high-stakes tournament where players have a set amount of time to pass the TNT before it detonates. With shorter rounds and shrinking safe zones, this event keeps everyone on their toes!"
      }
    ]
  },
  {
    id: 'first-tournament',
    title: 'First Official TNT Tag Tournament',
    date: '2016-12-20',
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
    tags: ['technique', 'strategy']
  },
  {
    id: 'holiday-bash-2017',
    title: 'Holiday Bash 2017: Winter Wonderland',
    date: '2017-12-20',
    category: 'hypixel',
    description: `A festive holiday update featuring winter-themed maps and seasonal features!

Highlights:
- Snowy maps with ice mechanics
- Christmas tree cosmetics
- Snowball power-up
- Limited-time challenges and achievements

The event brought the spirit of the holidays to the TNT Tag community and became a fan favorite.`,
    tags: ['holiday', 'seasonal'],
    sideEvents: [
      {
        id: "side8",
        title: "Snowball Showdown",
        description: "Players competed in a special mode where snowballs could freeze opponents temporarily."
      },
      {
        id: "side9",
        title: "Ice Tag Relay",
        description: "Teams raced across icy maps, tagging teammates to keep their team in the game."
      }
    ]
  },
  {
    id: 'halloween-update-2015',
    title: 'Spooky TNT Tag Halloween Update',
    date: '2019-10-31',
    endDate: '2022-10-31',
    category: 'guilds',
    description: `Special Halloween-themed update bringing spooky changes to TNT Tag!

New Features:
- Ghost particles when tagged
- Pumpkin head cosmetics
- Haunted mansion map
- Special Halloween sound effects
- Limited-time achievements

The update was available throughout the Halloween season and became one of the most popular seasonal events.`,
    tags: ['update', 'seasonal'],
    sideEvents: [
      {
        id: "side5",
        title: "Pumpkin Tag Marathon",
        description: "A marathon match where players competed to tag the most pumpkins in a single game."
      },
      {
        id: "side6",
        title: "Spooky Costume Contest",
        description: "Players showed off their best Halloween-themed skins, with winners voted on by the community."
      },
      {
        id: "side7",
        title: "Community Draft Night",
        description: "A fun-filled draft night where players not in the main event could form their own teams and compete in a parallel mini-tournament."
      }
    ]
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
    tags: ['tournament', 'competition'],
    sideEvents: [
      {
        id: "side10",
        title: "Mini-Captains Tournament",
        description: "A smaller event where captains faced off in 1v1 matches to earn their team extra perks."
      },
    ]
  }
];
