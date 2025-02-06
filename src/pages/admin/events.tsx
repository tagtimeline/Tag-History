// pages/admin/events.tsx
import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/../lib/firebaseConfig';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import EventsList from '@/components/admin/EventsList';
import { TimelineEvent } from '@/data/events';
import { handleAdminLogout } from '@/components/admin/AuthHandler';

import baseStyles from '@/styles/admin/base.module.css';
import controlStyles from '@/styles/controls.module.css';

export default function AdminEvents() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        router.replace('/admin/password');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'events'), (snapshot) => {
      try {
        const eventData = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as TimelineEvent))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setEvents(eventData);
      } catch (snapshotError) {
        console.error('Error in events listener:', snapshotError);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => handleAdminLogout(router);

  const handleEventSelect = (event: TimelineEvent) => {
    router.push(`/admin/event/${event.id}`);
  };

  if (isLoading) {
    return <div className={baseStyles.loading}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={baseStyles.pageWrapper}>
      <Head>
        <title>Event Management - TNT Tag History</title>
      </Head>
      <Header>
        <div className={controlStyles.headerControls}>
          <Link href="/admin">
            <button className={controlStyles.headerButton} style={{ width: 'auto' }}>
              Dashboard
            </button>
          </Link>
          <button onClick={handleLogout} className={controlStyles.headerButton}>
            Logout
          </button>
        </div>
      </Header>
      
      <main className={baseStyles.mainContent}>
        <EventsList 
          events={events}
          onEventSelect={handleEventSelect}
        />
      </main>

      <Footer />
    </div>
  );
}