import type { NextPage } from 'next';
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

const EventPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const event = events.find(e => e.id === id);

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
            <div 
              className={styles.eventType}
              style={{ color: getCategoryColor(event.category) }}
            >
              {getCategoryName(event.category)}
            </div>
          </div>
          <h2 className={styles.modalTitle}>{event.title}</h2>
          <div className={styles.modalDate}>
            {new Date(event.date).toLocaleDateString()}
          </div>
          <hr className={styles.divider} />
          <div className={styles.modalText}>
            {event.description.split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          <hr className={styles.divider} />
          <div className={styles.tagLabel}>Tags:</div>
          <div className={styles.modalTags}>
            {event.tags.map(tag => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default withAuth(EventPage);