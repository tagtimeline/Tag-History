// pages/admin.tsx
import { useState, useEffect } from 'react';
import { db } from '@/../lib/firebaseConfig';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AdminAuth from '@/components/auth/AdminAuth';
import EventForm from '@/components/admin/EventForm';
import EventsList from '@/components/admin/EventsList';
import { TimelineEvent } from '@/data/events';
import styles from '@/styles/admin.module.css';
import controlStyles from '@/styles/controls.module.css';
import headerStyles from '@/styles/header.module.css';

export default function Admin() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        await fetchEvents();
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchEvents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'events'));
      const eventData = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as TimelineEvent))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEvents(eventData);
    } catch (err) {
      setError('Failed to fetch events');
    }
  };

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      router.push('/');
    } catch (err) {
      setError('Failed to logout. Please try again.');
    }
  };

  const handleSuccess = async (message: string) => {
    setSuccess(message);
    setSelectedEvent(null);
    await fetchEvents();
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Admin Login - TNT Tag History</title>
        </Head>
        <Header />
        <div className={headerStyles['info-box']}>Version: Beta 1.0</div>
        <main className="centered">
          <AdminAuth />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <Head>
        <title>Admin Dashboard - TNT Tag History</title>
      </Head>
      <Header>
        <button onClick={handleLogout} className={controlStyles.logoutButton}>
          Logout
        </button>
      </Header>
      <div className={headerStyles['info-box']}>Version: Beta 1.0</div>
      
      <main className={styles.mainContent}>
        <div className={styles.header}>
          <div className={styles.title}>Event Management</div>
          <button 
            onClick={() => setSelectedEvent(null)} 
            className={styles.addEventButton}
          >
            Create New Event
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <EventForm 
          key={selectedEvent?.id || 'new'} 
          selectedEvent={selectedEvent}
          onSuccess={handleSuccess}
          onError={setError}
        />

        <EventsList 
          events={events}
          onEventSelect={setSelectedEvent}
        />
      </main>

      <Footer />
    </div>
  );
}