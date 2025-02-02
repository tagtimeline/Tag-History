// src/pages/player/[ign].tsx
import type { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useMemo, useRef, useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { TimelineEvent } from '../../data/events';
import styles from '../../styles/player.module.css';
import controlStyles from '../../styles/controls.module.css';
import headerStyles from '../../styles/header.module.css';
import withAuth from '../../components/auth/withAuth';
import { PlayerProfile } from '../../config/players';
import PlayerEventsList from '../../components/player/PlayerEventsList';
import PlayerInfo from '../../components/player/PlayerInfo';
import PlayerSkinViewer from '../../components/player/PlayerSkinViewer';
import PlayerSearch from '../../components/player/PlayerSearch';
import { getAllCategories } from '../../config/categories';
import { ALL_EVENTS_OPTION } from '../../config/dropdown';
import { searchEvents } from '../../config/search';
import EventModal from '../../components/timeline/EventModal';
import { getAllEvents } from '../../../lib/eventUtils';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';

interface PlayerPageProps extends Record<string, unknown> {
  historicalIgn: string;
  currentIgn: string | null;
  allUsernames: string[];
  playerData: PlayerProfile | null;
  initialEvents: TimelineEvent[];
}

interface GuildMember {
  uuid: string;
  rank?: string;
}

const PlayerPage: NextPage<PlayerPageProps> = ({ 
  historicalIgn, 
  currentIgn, 
  allUsernames, 
  playerData,
  initialEvents
}) => {
  const [events, setEvents] = useState<TimelineEvent[]>(initialEvents);
  const [selectedCategories, setSelectedCategories] = useState([ALL_EVENTS_OPTION.id]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<TimelineEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allCategories = [ALL_EVENTS_OPTION, ...getAllCategories()];

  // Set up real-time listener for events
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'events'),
      (snapshot) => {
        const updatedEvents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TimelineEvent[];
        
        setEvents(updatedEvents.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        ));
      },
      (error) => {
        console.error('Error listening to events:', error);
        setError('Failed to load updates');
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (categoryId === ALL_EVENTS_OPTION.id) {
        return [ALL_EVENTS_OPTION.id];
      }
      
      if (prev.includes(ALL_EVENTS_OPTION.id)) {
        return [categoryId];
      }
      
      const newCategories = prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId];
        
      return newCategories.length === 0 ? [ALL_EVENTS_OPTION.id] : newCategories;
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSearchResults(searchEvents(events, value));
  };

  const playerEvents = useMemo(() => {
    if (!allUsernames || allUsernames.length === 0 || !events) return [];
    
    return events.filter(event => 
      allUsernames.some(username => 
        event.description.toLowerCase().includes(`<${username.toLowerCase()}>`)
      )
    )
    .filter(event => 
      selectedCategories.includes(ALL_EVENTS_OPTION.id) || 
      selectedCategories.includes(event.category)
    )
    .filter(event => 
      searchTerm === '' || 
      searchEvents([event], searchTerm).length > 0
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}, [allUsernames, selectedCategories, searchTerm, events]);

  if (!currentIgn || !playerData) {
    return (
      <>
        <Header>
          <div className={controlStyles.headerControls}>
            <Link href="/timeline">
              <button className={controlStyles.timelineButton}>Timeline</button>
            </Link>
            <Link href="/events">
              <button className={controlStyles.eventsButton}>Events</button>
            </Link>
            <Link href="/info">
              <button className={controlStyles.infoButton}>Info</button>
            </Link>
          </div>
        </Header>
        <div className={headerStyles['info-box']}>Version: Beta 1.0</div>
        <main className="centered">
          <div className={styles.playerPageContent}>
          <div className={styles.errorMessage}>
            Player &quot;{historicalIgn}&quot; not found
          </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{currentIgn} - TNT Tag History</title>
        <meta name="description" content={`Player profile and event history for ${currentIgn}`} />
      </Head>
      
      <Header>
        <div className={controlStyles.headerControls}>
          <div className={controlStyles.dropdown} ref={dropdownRef}>
            <div 
              className={controlStyles.dropdownHeader}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className={controlStyles.label}>Categories...</span>
            </div>
            {isDropdownOpen && (
              <ul className={controlStyles.dropdownMenu}>
                {allCategories.map((category) => (
                  <li 
                    key={category.id}
                    className={`${controlStyles.dropdownItem} ${
                      selectedCategories.includes(category.id) ? controlStyles.selected : ''
                    }`}
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    <span 
                      className={controlStyles.categoryColor} 
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <PlayerSearch
            searchTerm={searchTerm}
            searchResults={searchResults}
            onSearchChange={handleSearchChange}
            onEventSelect={setSelectedEvent}
          />

          <Link href="/timeline">
            <button className={controlStyles.timelineButton}>Timeline</button>
          </Link>
          <Link href="/events">
            <button className={controlStyles.eventsButton}>Events</button>
          </Link>
          <Link href="/info">
            <button className={controlStyles.infoButton}>Info</button>
          </Link>
        </div>
      </Header>

      <div className={headerStyles['info-box']}>Version: Beta 1.0</div>

      {error && (
        <div className="error-message" style={{ 
          color: 'red', 
          textAlign: 'center', 
          padding: '10px' 
        }}>
          {error}
        </div>
      )}
      
      <main className="centered">
        <div className={styles.playerPageContent}>
          <div className={styles.gridContainer}>
            <PlayerSkinViewer playerData={playerData} />
            <PlayerInfo 
              currentIgn={currentIgn}
              playerData={playerData}
              allUsernames={allUsernames}
            />

            <div className={styles.eventsSection}>
              <div className={styles.eventsTitle}>Player History</div>
              {playerEvents.length > 0 ? (
                <PlayerEventsList 
                  events={playerEvents}
                  onEventSelect={setSelectedEvent}
                />
              ) : (
                <div className={styles.noEvents}>
                  No recorded events for this player
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {selectedEvent && (
        <EventModal 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
        />
      )}

      <Footer />
    </>
  );
};

export const getServerSideProps: GetServerSideProps<PlayerPageProps> = async ({ params }) => {
  try {
    const ign = params?.ign;
    
    if (typeof ign !== 'string') {
      return {
        props: {
          historicalIgn: '',
          currentIgn: null,
          allUsernames: [],
          playerData: null,
          initialEvents: []
        }
      };
    }

    // First get UUID and basic info from Ashcon
    const ashconResponse = await fetch(`https://api.ashcon.app/mojang/v2/user/${ign}`);
    
    if (!ashconResponse.ok) {
      return {
        props: {
          historicalIgn: ign,
          currentIgn: null,
          allUsernames: [],
          playerData: null,
          initialEvents: []
        }
      };
    }

    // Fetch initial events for SSR
    const events = await getAllEvents();

    const ashconData = await ashconResponse.json();
    const currentIgn = ashconData.username;
    const allUsernames = ashconData.username_history?.map((history: { username: string }) => history.username) || [ashconData.username];
    
    // If they're using an old IGN, redirect to the current one
    if (currentIgn.toLowerCase() !== ign.toLowerCase()) {
      return {
        redirect: {
          destination: `/player/${currentIgn}`,
          permanent: false,
        }
      };
    }

    // Now get the official textures from Minecraft API
    const profileResponse = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${ashconData.uuid}`);
    const profileData = await profileResponse.json();

    // Decode the base64 texture data
    const textureProperty = profileData.properties.find((p: { name: string, value: string }) => p.name === 'textures');
    const textureData = JSON.parse(Buffer.from(textureProperty.value, 'base64').toString());

    // Prepare the player data with official texture URLs
    const playerData: PlayerProfile = {
      username: currentIgn,
      uuid: ashconData.uuid,
      created_at: ashconData.created_at,
      username_history: ashconData.username_history,
      textures: {
        skin: {
          url: textureData.textures.SKIN.url
        },
        cape: (textureData.textures.CAPE && {
          url: textureData.textures.CAPE.url
        }) || null
      },
      hypixel: null
    };

    // Validate Hypixel API key exists
    const HYPIXEL_API_KEY = process.env.HYPIXEL_API_KEY;
    if (!HYPIXEL_API_KEY) {
      console.error('Hypixel API key not found in environment variables');
      throw new Error('Hypixel API key not configured');
    }

    // Fetch Hypixel data
    try {
      const hypixelResponse = await fetch(`https://api.hypixel.net/player?uuid=${ashconData.uuid}`, {
        headers: {
          'API-Key': HYPIXEL_API_KEY
        }
      });

      if (!hypixelResponse.ok) {
        console.error('Hypixel API error:', await hypixelResponse.text());
        throw new Error(`Hypixel API error: ${hypixelResponse.status}`);
      }

      const hypixelData = await hypixelResponse.json();
      
      if (!hypixelData.success || !hypixelData.player) {
        console.warn('No Hypixel data found for player');
        playerData.hypixel = null;
      } else {
        const player = hypixelData.player;
        
        // Calculate network level from networkExp (with fallback)
        const networkExp = player.networkExp || 0;
        const networkLevel = Math.floor((Math.sqrt(networkExp + 15312.5) - 125/Math.sqrt(2))/(25*Math.sqrt(2)));

        // Extract TNT Games stats with fallbacks
        const tntGames = player.stats?.TNTGames || {};
        const tntWins = tntGames.wins_tntag || 0;
        const tntKills = tntGames.kills_tntag || 0;
        const tntDeaths = tntGames.deaths_tntag || 0;
        const tntKdr = tntDeaths === 0 ? tntKills : Number((tntKills / tntDeaths).toFixed(2));
        const tntPlaytimeMinutes = player.achievements?.tntgames_tnt_triathlon || null;
        const tntPlaytime = tntPlaytimeMinutes ? Math.round(tntPlaytimeMinutes / 60) : 'N/A';

        // Handle guild data separately with explicit null handling
        let guildInfo = null;
        try {
          const guildLookupResponse = await fetch(`https://api.hypixel.net/guild?player=${ashconData.uuid}`, {
            headers: {
              'API-Key': HYPIXEL_API_KEY
            }
          });

          if (guildLookupResponse.ok) {
            const guildLookupData = await guildLookupResponse.json();
            
            if (guildLookupData.success && guildLookupData.guild) {
              const hypixelUuid = ashconData.uuid.replace(/-/g, '');
              const member = guildLookupData.guild.members.find(
                (m: GuildMember) => m.uuid === hypixelUuid
              );

              guildInfo = {
                name: guildLookupData.guild.name,
                rank: member?.rank || null
              };
            }
          }
        } catch (guildError) {
          console.error('Error fetching guild data:', guildError);
        }

        // Set hypixel data with all fields explicitly defined
        playerData.hypixel = {
          rank: player.rank || 
                (player.monthlyPackageRank !== 'NONE' ? 'SUPERSTAR' : null) || 
                player.newPackageRank || 
                'DEFAULT',
          rankPlusColor: player.rankPlusColor || null,
          monthlyPackageRank: player.monthlyPackageRank || '',
          newPackageRank: player.newPackageRank || '',
          networkLevel: networkLevel,
          guild: guildInfo,
          tntGames: {
            wins_tntag: tntWins,
            playtime: tntPlaytime,
            kdr: tntKdr
          },
          discord: player.socialMedia?.links?.DISCORD || null
        };
      }
    } catch (hypixelError) {
      console.error('Error fetching Hypixel data:', hypixelError);
      playerData.hypixel = null;
    }

    return {
      props: {
        historicalIgn: ign,
        currentIgn,
        allUsernames,
        playerData,
        initialEvents: events
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        historicalIgn: params?.ign as string,
        currentIgn: null,
        allUsernames: [],
        playerData: null,
        initialEvents: []
      }
    };
  }
};

export default withAuth<PlayerPageProps>(PlayerPage);
