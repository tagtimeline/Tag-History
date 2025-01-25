import type { NextPage } from 'next';
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { events } from '../../data/events';
import styles from '../../styles/events.module.css';
import headerStyles from '../../styles/header.module.css';
import withAuth from '../../components/auth/withAuth';
import { getCategoryName, getCategoryColor } from '../../config/categories';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';


const EventPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [expandedSideEvents, setExpandedSideEvents] = useState<Record<string, boolean>>({});
  
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  const currentIndex = sortedEvents.findIndex(e => e.id === id);
  const event = sortedEvents[currentIndex];
  
  const prevEvent = currentIndex > 0 ? sortedEvents[currentIndex - 1] : null;
  const nextEvent = currentIndex < sortedEvents.length - 1 ? sortedEvents[currentIndex + 1] : null;

  const toggleSideEvent = (id: string) => {
    setExpandedSideEvents(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (!event) return null;

  return (
    <>
      <Head>
        <title>{event.title} - TNT Tag History</title>
        <meta name="description" content={event.description.slice(0, 160)} />
      </Head>
      
      <Header>
        <Link href="/timeline">
          <button className={styles.timelineButton}>Timeline</button>
        </Link>
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
          <div className={styles.modalText}>
            {event.description.split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
            <br></br><br></br>
            {event.sideEvents && event.sideEvents.length > 0 && (
              <div className={styles.sideEventsContainer}>
                {event.sideEvents.map(sideEvent => (
                  <div key={sideEvent.id} className={styles.sideEvent}>
                    <button 
                      className={styles.sideEventHeader}
                      onClick={() => toggleSideEvent(sideEvent.id)}
                    >
                      {expandedSideEvents[sideEvent.id] ? 
                        <ChevronDown size={16} /> : 
                        <ChevronRight size={16} />
                      }
                      <span>{sideEvent.title}</span>
                    </button>
                    {expandedSideEvents[sideEvent.id] && (
                      <div className={styles.sideEventContent}>
                        {sideEvent.description.split('\n\n').map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
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