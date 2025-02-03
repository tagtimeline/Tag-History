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
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { getPlayerData } from '../../components/player/PlayerAPI';

interface PlayerPageProps extends Record<string, unknown> {
  historicalIgn: string;
  currentIgn: string | null;
  allUsernames: string[];
  playerData: PlayerProfile | null;
  initialEvents: TimelineEvent[];
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

  // Handle clicking outside dropdown
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
          historicalIgn: params?.ign as string || '', // Use the original IGN or empty string
          currentIgn: null,
          allUsernames: [],
          playerData: null,
          initialEvents: []
        }
      };
    }

    // Decode the IGN from the URL
    const decodedIgn = decodeURIComponent(ign);
    const playerData = await getPlayerData(decodedIgn);

    // Handle redirect for old IGNs (compare with decoded IGN)
    if (playerData.currentIgn && playerData.currentIgn.toLowerCase() !== decodedIgn.toLowerCase()) {
      return {
        redirect: {
          destination: `/player/${encodeURIComponent(playerData.currentIgn)}`, // Ensure proper encoding
          permanent: false,
        }
      };
    }

    // Ensure initialEvents is fully serializable
    const serializedInitialEvents = JSON.parse(JSON.stringify(playerData.initialEvents));

    return { 
      props: {
        historicalIgn: decodedIgn,
        currentIgn: playerData.currentIgn,
        allUsernames: playerData.allUsernames,
        playerData: playerData.playerData,
        initialEvents: serializedInitialEvents
      }
    };

  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return { 
      props: {
        historicalIgn: params?.ign as string || '', // Use the original IGN or empty string
        currentIgn: null,
        allUsernames: [],
        playerData: null,
        initialEvents: []
      }
    };
  }
};

export default withAuth<PlayerPageProps>(PlayerPage);