// src/pages/player/[ign].tsx
import type { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useRef, useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/../lib/firebaseConfig';
import { ChevronDown, ChevronRight } from 'lucide-react';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import withAuth from '@/components/auth/withAuth';
import PlayerEventsList from '@/components/player/PlayerEventsList';
import PlayerInfo from '@/components/player/PlayerInfo';
import PlayerSkinViewer from '@/components/player/PlayerSkinViewer';
import PlayerSearch from '@/components/search/PlayerSearch';
import EventSearch from '@/components/search/EventSearch';
import EventModal from '@/components/timeline/EventModal';

import { TimelineEvent } from '@/data/events';
import { PlayerProfile } from '@/config/players';
import { fetchCategories, Category } from '@/config/categories';
import { getPlayerData } from '@/components/player/PlayerAPI';
import { ALL_EVENTS_OPTION } from '@/config/dropdown';
import { searchEvents } from '@/config/search';

import styles from '@/styles/player.module.css';
import controlStyles from '@/styles/controls.module.css';

interface PlayerPageProps extends Record<string, unknown> {
  historicalIgn: string;
  currentIgn: string | null;
  playerData: PlayerProfile | null;
  initialEvents: TimelineEvent[];
}


const PlayerPage: NextPage<PlayerPageProps> = ({ 
  historicalIgn, 
  currentIgn,
  playerData,
  initialEvents
}) => {
  const [events, setEvents] = useState<TimelineEvent[]>(initialEvents);
  const [selectedCategories, setSelectedCategories] = useState([ALL_EVENTS_OPTION.id]);
  const [searchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [players, setPlayers] = useState<{currentIgn: string; uuid: string}[]>([]);
  
  const [isNameHistoryExpanded, setIsNameHistoryExpanded] = useState(false);
  const [isAltAccountsExpanded, setIsAltAccountsExpanded] = useState(false);
  const [isMainAccountExpanded, setIsMainAccountExpanded] = useState(false);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await fetchCategories();
        setCategories(cats);
      } catch (error) {
        console.error('Error loading categories:', error);
        setError('Failed to load categories');
      } finally {
        setIsLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  // Load players
  useEffect(() => {
    const playersRef = collection(db, 'players');
    const unsubscribe = onSnapshot(playersRef, (snapshot) => {
      const fetchedPlayers = snapshot.docs.map(doc => ({
        currentIgn: doc.data().currentIgn,
        uuid: doc.data().uuid
      }));
      setPlayers(fetchedPlayers);
    });
  
    return () => unsubscribe();
  }, []);

  // Get available categories based on player's events
  const availableCategories = useMemo(() => {
    if (!playerData || !events || !categories) return [ALL_EVENTS_OPTION];
    
    const playerEventIds = new Set(playerData.events || []);
    const usedCategories = new Set(
      events
        .filter(event => playerEventIds.has(event.id))
        .map(event => event.category)
    );
    
    return [
      ALL_EVENTS_OPTION,
      ...Object.values(categories).filter(category => usedCategories.has(category.id))
    ];
  }, [playerData, events, categories]);

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

  const playerEvents = useMemo(() => {
    if (!playerData || !events) return [];
    
    const playerEventIds = new Set(playerData.events || []);
    
    return events
      .filter(event => playerEventIds.has(event.id))
      .filter(event => 
        selectedCategories.includes(ALL_EVENTS_OPTION.id) || 
        selectedCategories.includes(event.category)
      )
      .filter(event => 
        searchTerm === '' || 
        searchEvents([event], searchTerm).length > 0  
      )
      .sort((a, b) => {
        const comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        return sortDirection === 'asc' ? comparison : -comparison;
      });
  }, [playerData, selectedCategories, searchTerm, events, sortDirection]);

  if (isLoadingCategories) {
    return <div>Loading...</div>;
  }

  if (!currentIgn || !playerData) {
    return (
      <>
        <Header>
          <div className={controlStyles.headerControls}>
            <Link href="/timeline">
              <button className={controlStyles.headerButton}>Timeline</button>
            </Link>
            <Link href="/events">
              <button className={controlStyles.headerButton}>Events</button>
            </Link>
            <Link href="/info">
              <button className={controlStyles.headerButton}>Info</button>
            </Link>
          </div>
        </Header>
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

  // Format dates on the client side only
  const formatDate = (date: string) => {
    if (typeof window === 'undefined') return '';
    return new Date(date).toLocaleDateString();
  };

  return (
    <>
      <Head>
        <title>{currentIgn} - TNT Tag History</title>
        <meta name="description" content={`Player profile and event history for ${currentIgn}`} />
      </Head>
      
      <Header>
        <div className={controlStyles.headerControls}>
          <div className={styles.searchWrapper}>
            <PlayerSearch />
          </div>
          <Link href="/timeline">
            <button className={controlStyles.headerButton}>Timeline</button>
          </Link>
          <Link href="/events">
            <button className={controlStyles.headerButton}>Events</button>
          </Link>
          <Link href="/info">
            <button className={controlStyles.headerButton}>Info</button>
          </Link>
        </div>
      </Header>

      {error && (
        <div className="error-message" style={{ 
          color: 'red', 
          textAlign: 'center', 
          padding: '10px' 
        }}>
          {error}
        </div>
      )}
      
      <main className={styles.mainContent}>
        <div className={styles.playerPageContent}>

          {/* Player Info Section */}
          <div className={styles.gridContainer}>
            <PlayerSkinViewer playerData={playerData} />
            <PlayerInfo 
              currentIgn={currentIgn}
              playerData={playerData}
            />

            {/* Name History Section */}
            <div className={styles.nameHistorySection}>
              <div className={styles.accountGroup}>
                <button
                  className={styles.accountHeader}
                  onClick={() => setIsNameHistoryExpanded(!isNameHistoryExpanded)}
                >
                  {isNameHistoryExpanded ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                  <span>Name History</span>
                </button>
                {isNameHistoryExpanded && (
                  <div className={styles.accountList}>
                    {playerData.pastIgns && playerData.pastIgns.length > 0 ? (
                      <>
                        <div className={styles.accountItem}>
                          <span className={styles.nameHistoryNumber}>{playerData.pastIgns.length + 1}</span>
                          <span className={styles.accountName}>{currentIgn}</span>
                        </div>
                        {playerData.pastIgns.map((ign, index) => {
                          const isHidden = typeof ign === 'object' && ign.hidden;
                          const name = typeof ign === 'object' ? ign.name : ign;

                          return (
                            <div key={index} className={styles.accountItem}>
                              <span className={styles.nameHistoryNumber}>
                                {playerData.pastIgns!.length - index}
                              </span>
                              <span
                                className={styles.accountName}
                                style={{
                                  color: isHidden ? '#666' : 'white',
                                }}
                              >
                                {isHidden ? 'Hidden' : name}
                              </span>
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      <div className={styles.accountItem}>
                        <span className={styles.nameHistoryNumber}>1</span>
                        <span className={styles.accountName}>{currentIgn}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Alt/Main Accounts Section */}
            {((playerData.altAccounts && playerData.altAccounts.length > 0) || playerData.mainAccount) && (
              <div className={styles.altAccountsSection}>
                {(playerData?.altAccounts ?? []).length > 0 && (
                  <div className={styles.accountGroup}>
                    <button 
                      className={styles.accountHeader}
                      onClick={() => setIsAltAccountsExpanded(!isAltAccountsExpanded)}
                    >
                      {isAltAccountsExpanded ? 
                        <ChevronDown size={16} /> : 
                        <ChevronRight size={16} />
                      }
                      <span>Alt Accounts</span>
                    </button>
                    {isAltAccountsExpanded && (
                      <div className={styles.accountList}>
                        {(playerData?.altAccounts ?? []).map((uuid) => {
                          const altPlayer = players.find(p => p.uuid === uuid);
                          if (!altPlayer) return null;
                          
                          return (
                            <Link 
                              key={uuid} 
                              href={`/player/${encodeURIComponent(altPlayer.currentIgn)}`}
                              className={styles.accountItem}
                            >
                              <div className={styles.accountAvatar}>
                              <Image
                                src={`https://crafthead.net/avatar/${uuid}`}
                                alt="Player avatar"
                                width={16}
                                height={16}
                              />
                              </div>
                              <span className={styles.accountName}>
                                {altPlayer.currentIgn}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                
                {playerData.mainAccount && (
                  <div className={styles.accountGroup}>
                    <button 
                      className={styles.accountHeader}
                      onClick={() => setIsMainAccountExpanded(!isMainAccountExpanded)}
                    >
                      {isMainAccountExpanded ? 
                        <ChevronDown size={16} /> : 
                        <ChevronRight size={16} />
                      }
                      <span>Main Account</span>
                    </button>
                    {isMainAccountExpanded && (
                      <div className={styles.accountList}>
                        {(() => {
                          const mainPlayer = players.find(p => p.uuid === playerData.mainAccount);
                          if (!mainPlayer) return null;
                          
                          return (
                            <Link 
                              href={`/player/${encodeURIComponent(mainPlayer.currentIgn)}`}
                              className={styles.accountItem}
                            >
                              <div className={styles.accountAvatar}>
                                <Image 
                                  src={`https://crafthead.net/avatar/${playerData.mainAccount}`}
                                  alt="Player avatar"
                                  width={16}
                                  height={16}
                                />
                              </div>
                              <span className={styles.accountName}>
                                {mainPlayer.currentIgn}
                              </span>
                            </Link>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Events Section */}
            <div className={styles.eventsSection}>
              <div className={styles.eventsTitle}>Player History</div>
              
              <div className={styles.eventsControls}>
                <div className={controlStyles.dropdown} ref={dropdownRef}>
                  <div 
                    className={controlStyles.dropdownHeader}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <span className={controlStyles.label}>
                      {isLoadingCategories ? 'Loading categories...' : 'Categories...'}
                    </span>
                  </div>
                  {isDropdownOpen && !isLoadingCategories && (
                    <ul className={controlStyles.dropdownMenu}>
                      {availableCategories.map((category) => (
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

                <EventSearch 
                  onEventSelect={setSelectedEvent}
                  filterEvents={(event) => {
                    const playerEventIds = new Set(playerData.events || []);
                    return playerEventIds.has(event.id);
                  }}
                />

                <button
                  className={styles.sortButton}
                  onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                >
                  {sortDirection === 'asc' ? '↑' : '↓'} Date
                </button>
              </div>

              {playerEvents.length > 0 ? (
                <PlayerEventsList 
                  events={playerEvents}
                  onEventSelect={setSelectedEvent}
                  categories={categories}
                  formatDate={formatDate}
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
          historicalIgn: params?.ign as string || '',
          currentIgn: null,
          playerData: null,
          initialEvents: []
        }
      };
    }

    // Decode the IGN from the URL
    const decodedIgn = decodeURIComponent(ign);
    const playerData = await getPlayerData(decodedIgn);
    
    // Handle redirect for old IGNs
    if (playerData.currentIgn && playerData.currentIgn.toLowerCase() !== decodedIgn.toLowerCase()) {
      return {
        redirect: {
          destination: `/player/${encodeURIComponent(playerData.currentIgn)}`,
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
        playerData: playerData.playerData,
        initialEvents: serializedInitialEvents
      }
    };

  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return { 
      props: {
        historicalIgn: params?.ign as string || '',
        currentIgn: null,
        playerData: null,
        initialEvents: []
      }
    };
  }
};

export default withAuth<PlayerPageProps>(PlayerPage);