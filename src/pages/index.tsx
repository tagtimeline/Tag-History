// pages/index.tsx
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import TimelineContainer from '../components/timeline/TimelineContainer';
import EventSearch from '../components/search/EventSearch';
import PlayerSearch from '../components/search/PlayerSearch'
import { AUTH_CONFIG } from '../config/auth';
import { useEffect, useState } from 'react';
import styles from '../styles/home.module.css';
import headerStyles from '../styles/header.module.css';
import controlStyles from '../styles/controls.module.css';
import { TimelineEvent } from '../data/events';
import { DEFAULT_YEAR_SPACING } from '../config/timelineControls';
import { ALL_EVENTS_OPTION } from '../config/dropdown';
import { getAllEvents } from '../../lib/eventUtils';

interface HomeProps {
  initialEvents: TimelineEvent[];
}

const Home: NextPage<HomeProps> = ({ initialEvents }) => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (AUTH_CONFIG.enablePasswordProtection) {
      const authStatus = localStorage.getItem('isAuthenticated') === 'true';
      setIsAuthenticated(authStatus);
      if (!authStatus) {
        router.replace('/password');
      }
    } else {
      setIsAuthenticated(false);
    }
  }, [router]);

  const handleTimelineClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push('/timeline');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Welcome - TNT Tag History</title>
        <meta name="description" content="An interactive journey through the TNT Tag History" />
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

      <main className={styles.mainContent}>
        <div className={styles.mainContainer}>
          <div>Welcome to the</div>
          <h1 className={styles.title}>Tag Timeline</h1>

          <div className={styles.searchContainer}>
            <div className={styles.searchWrapper}>
              <EventSearch />
            </div>
            <div className={styles.searchWrapper}>
              <PlayerSearch />
            </div>
          </div>

          <Link 
            href="/timeline" 
            className={styles.previewContainer}
            onClick={handleTimelineClick}
          >
            <TimelineContainer 
              events={initialEvents}
              selectedCategories={[ALL_EVENTS_OPTION.id]}
              isDraggingEnabled={false}
              yearSpacing={DEFAULT_YEAR_SPACING}
              onReset={0}
              showEventDates={true}
              isPreview={true}
            />
            <div className={styles.previewOverlay}>
              <span className={styles.previewText}>Click to explore the full timeline</span>
            </div>
          </Link>
        </div>
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

export default Home;