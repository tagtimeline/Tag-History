// pages/event/[id].tsx
import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/router';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { TimelineEvent } from '../../data/events';
import styles from '../../styles/events.module.css';
import controlStyles from '../../styles/controls.module.css';
import headerStyles from '../../styles/header.module.css';
import withAuth from '../../components/auth/withAuth';
import { getCategoryName, getCategoryColor } from '../../config/categories';
import EventContent from '../../components/timeline/EventContent';

import { getEventById, getAllEvents } from '../../../lib/eventUtils';
import { db } from '../../../lib/firebaseConfig';

import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

interface EventPageProps extends Record<string, unknown> {
  initialEvent: TimelineEvent;
  allEvents: TimelineEvent[];
}

export async function getServerSideProps({ params }: { params: { id: string } }) {
  try {
    const event = await getEventById(params.id);
    
    if (!event) {
      return {
        notFound: true
      };
    }

    // Get all events for navigation
    const allEvents = await getAllEvents();
    
    // Create a new object without createdAt and updatedAt fields
    const serializedEvent = {
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      endDate: event.endDate,
      category: event.category,
      tags: event.tags,
      isSpecial: event.isSpecial,
      tables: event.tables,
      sideEvents: event.sideEvents
    };

    // Similarly serialize all events
    const serializedAllEvents = allEvents.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      endDate: event.endDate,
      category: event.category,
      tags: event.tags,
      isSpecial: event.isSpecial,
      tables: event.tables,
      sideEvents: event.sideEvents
    }));
    
    return {
      props: {
        initialEvent: serializedEvent,
        allEvents: serializedAllEvents
      }
    };
  } catch (error) {
    console.error('Error fetching event:', error);
    return {
      notFound: true
    };
  }
}


const EventPage: NextPage<EventPageProps> = ({ initialEvent, allEvents }) => {
  const router = useRouter();
  const { id } = router.query;
  const [event, setEvent] = useState<TimelineEvent>(initialEvent);
  const [error, setError] = useState<string | null>(null);

  // Set up real-time listener for the current event
  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(
      doc(db, 'events', id as string),
      (doc) => {
        if (doc.exists()) {
          setEvent({ id: doc.id, ...doc.data() } as TimelineEvent);
        } else {
          setError('Event not found');
          router.push('/timeline');
        }
      },
      (error) => {
        console.error('Error listening to event:', error);
        setError('Failed to load event updates');
      }
    );

    return () => unsubscribe();
  }, [id, router]);

  const sortedEvents = [...allEvents].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  const currentIndex = sortedEvents.findIndex(e => e.id === id);
  const prevEvent = currentIndex > 0 ? sortedEvents[currentIndex - 1] : null;
  const nextEvent = currentIndex < sortedEvents.length - 1 ? sortedEvents[currentIndex + 1] : null;

  if (!event) return null;

  return (
    <>
      <Head>
        <title>{event.title} - TNT Tag History</title>
        <meta name="description" content={event.description.slice(0, 160)} />
      </Head>
      
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
        <div className={styles.eventPageContent}>
          <div className={styles.modalHeader}>
            <div className={styles.headerTags}>
              <div className={styles.eventTypeWrapper}>
                <div 
                  className={styles.eventType}
                  style={{ color: getCategoryColor(event.category) }}
                >
                  {getCategoryName(event.category)}
                </div>
                {event.category === 'feuds' && (
                  <Link 
                    href="https://discord.gg/pvhW64Jhbu" 
                    target="_blank" 
                    className={styles.discordLink}
                  >
                    <ExternalLink size={12} />
                    <span>Tag Feuds Discord</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
          <h2 className={styles.modalTitle}>
            {event.isSpecial && <span className={styles.specialStar}>⭐</span>}
            {event.title}
          </h2>
          <div className={styles.modalDate}>
            {new Date(event.date).toLocaleDateString()}
            {event.endDate && (
              <span> - {new Date(event.endDate).toLocaleDateString()}</span>
            )}
          </div>
          <hr className={styles.divider} />
          <EventContent event={event} />
          
          <div className={styles.modalFooter}>
            <hr className={styles.divider} />
            <div className={styles.tagLabel}>Tags:</div>
            <div className={styles.modalTags}>
              {event.tags.map(tag => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
        
        <div className={styles.eventNavigation}>
          <Link 
            href={prevEvent ? `/event/${prevEvent.id}` : '#'}
            className={`${styles.navButton} ${!prevEvent ? styles.navButtonDisabled : ''}`}
          >
            <ChevronLeft size={22} />
          </Link>
          <Link 
            href={nextEvent ? `/event/${nextEvent.id}` : '#'}
            className={`${styles.navButton} ${!nextEvent ? styles.navButtonDisabled : ''}`}
          >
            <ChevronRight size={22} />
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
};


export default withAuth<EventPageProps>(EventPage);