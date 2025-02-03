// src/pages/events.tsx
import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import EventModal from '../components/timeline/EventModal';
import EventSearch from '../components/search/EventSearch';
import { TimelineEvent } from '../data/events';
import styles from '../styles/eventsList.module.css';
import eventStyles from '../styles/events.module.css';
import controlStyles from '../styles/controls.module.css';
import headerStyles from '../styles/header.module.css';
import withAuth from '../components/auth/withAuth';
import { getAllCategories, getEventStyles } from '../config/categories';
import { ALL_EVENTS_OPTION } from '../config/dropdown';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import { getAllEvents } from '../../lib/eventUtils';

interface EventsPageProps extends Record<string, unknown> {
  initialEvents: TimelineEvent[];
}

const EventsPage: NextPage<EventsPageProps> = ({ initialEvents }) => {
  const [events, setEvents] = useState<TimelineEvent[]>(initialEvents);
  const [selectedCategories, setSelectedCategories] = useState([ALL_EVENTS_OPTION.id]);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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

  const filteredEvents = events ? events
    .filter(event => 
      selectedCategories.includes(ALL_EVENTS_OPTION.id) || 
      selectedCategories.includes(event.category)
    )
    .sort((a, b) => {
      const comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      return sortDirection === 'asc' ? comparison : -comparison;
    })
    : [];

  return (
    <>
      <Head>
        <title>Events - TNT Tag History</title>
        <meta name="description" content="Browse all TNT Tag events" />
      </Head>

      <Header>
        <div className={controlStyles.headerControls}>
          <Link href="/timeline">
            <button className={controlStyles.timelineButton}>Timeline</button>
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

      <main className={styles.mainContent}>
        <div className={styles.eventsTitle}>Events List</div>
        
        <div className={styles.eventsControls}>
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

          <EventSearch 
            onEventSelect={setSelectedEvent}
          />

          <button
            className={styles.sortButton}
            onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
          >
            {sortDirection === 'asc' ? '↑' : '↓'} Date
          </button>
        </div>

        <div className={styles.eventsList}>
          {filteredEvents.map(event => {
            const eventStyle = getEventStyles(event.category, event.isSpecial);
            return (
              <div 
                key={event.id}
                data-event-id={event.id}
                className={`${styles.eventBox} ${eventStyles.eventBox}`}
                onClick={() => setSelectedEvent(event)}
                style={{
                  ...eventStyle,
                  position: 'relative',
                  left: 0,
                  top: 0,
                  width: '100%',
                  cursor: 'pointer',
                }}
              >
                <div className={eventStyles.eventContent}>
                  <h3 className={eventStyles.eventTitle} style={{ fontSize: '14px', marginBottom: '4px' }}>
                    {event.isSpecial && <span className={eventStyles.specialStar} style={{ fontSize: '14px' }}>⭐</span>}
                    <span className={eventStyles.eventTitleText}>{event.title}</span>
                  </h3>
                  <div className={eventStyles.eventDate} style={{ fontSize: '12px' }}>
                    {new Date(event.date).toLocaleDateString()}
                    {event.endDate && ` - ${new Date(event.endDate).toLocaleDateString()}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedEvent && (
          <EventModal 
            event={selectedEvent} 
            onClose={() => setSelectedEvent(null)} 
          />
        )}
      </main>

      <Footer />
    </>
  );
};

export async function getServerSideProps() {
  try {
    const events = await getAllEvents();
    
    return {
      props: {
        initialEvents: JSON.parse(JSON.stringify(events))
      }
    };
  } catch (error) {
    console.error('Error fetching initial events:', error);
    return {
      props: {
        initialEvents: []
      }
    };
  }
}

export default withAuth<EventsPageProps>(EventsPage);