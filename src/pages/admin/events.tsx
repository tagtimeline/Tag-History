// pages/admin/events.tsx
import { useState, useEffect } from 'react';
import { db } from '@/../lib/firebaseConfig';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';

import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { EventForm } from '@/components/admin/EventForm';
import EventsList from '@/components/admin/EventsList';
import { TimelineEvent } from '@/data/events';

import baseStyles from '@/styles/admin/base.module.css';
import buttonStyles from '@/styles/admin/buttons.module.css';
import controlStyles from '@/styles/controls.module.css';
import headerStyles from '@/styles/header.module.css';


export default function AdminEvents() {
const router = useRouter();
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [isLoading, setIsLoading] = useState(true);
const [events, setEvents] = useState<TimelineEvent[]>([]);
const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
const [error, setError] = useState<string>('');
const [success, setSuccess] = useState<string>('');

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
    } catch (error) {
      console.error('Error in events listener:', error);
      setError('Failed to listen to event changes');
    }
  });

  return () => unsubscribe();
}, []);

const handleLogout = async () => {
  const auth = getAuth();
  try {
    await signOut(auth);
    router.push('/');
  } catch (error) {
    setError('Failed to logout. Please try again.');
  }
};

const handleSuccess = (message: string) => {
  setSuccess(message);
  setSelectedEvent(null);
};

const handleDelete = () => {
  setSelectedEvent(null);
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
    <div className={headerStyles['info-box']}>Version: Beta 1.0</div>
    
    <main className={baseStyles.mainContent}>
      <div className={baseStyles.header}>
        <div className={baseStyles.title}>Event Management</div>
        <button 
          onClick={() => setSelectedEvent(null)} 
          className={buttonStyles.addButton}
        >
          Create New Event
        </button>
      </div>

      {error && <div className={baseStyles.errorMessage}><span className={baseStyles.errorText}>{error}</span></div>}
      {success && <div className={baseStyles.successMessage}><span className={baseStyles.successText}>{success}</span></div>}

      <EventForm 
        key={selectedEvent?.id || 'new'} 
        selectedEvent={selectedEvent}
        onSuccess={handleSuccess}
        onError={setError}
        onDelete={handleDelete}
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