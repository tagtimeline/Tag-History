import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { events } from '../../data/events';
import styles from '../../styles/events.module.css';
import controlStyles from '../../styles/controls.module.css';
import headerStyles from '../../styles/header.module.css';
import withAuth from '../../components/auth/withAuth';
import { getCategoryName, getCategoryColor } from '../../config/categories';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import EventContent from '../../components/timeline/EventContent';



const EventPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;

  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  const currentIndex = sortedEvents.findIndex(e => e.id === id);
  const event = sortedEvents[currentIndex];
  
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
        <div className={styles.eventPageContent}>
          <div className={styles.modalHeader}>
          <div className={styles.headerTags}>
            <div 
              className={styles.eventType}
              style={{ color: getCategoryColor(event.category) }}
            >
              {getCategoryName(event.category)}
            </div>
            {event.isSpecial && (
              <div className={styles.specialTag}>
                <span className={styles.specialStar}>⭐</span>
                <span className={styles.specialText}>Special</span>
              </div>
            )}
          </div>
          </div>
          <h2 className={styles.modalTitle}>{event.title}</h2>
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

export default withAuth(EventPage);