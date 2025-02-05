// pages/admin/event-edit/[id].tsx
import { useState, useEffect, useMemo } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/../lib/firebaseConfig';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { EventForm } from '@/components/admin/EventForm';
import EventContent from '@/components/timeline/EventContent';
import { TimelineEvent } from '@/data/events';
import { handleAdminLogout } from '@/components/admin/AuthHandler';
import { getCategoryName, getCategoryColor } from '@/config/categories';

import baseStyles from '@/styles/admin/base.module.css';
import eventStyles from '@/styles/events.module.css';
import controlStyles from '@/styles/controls.module.css';
import headerStyles from '@/styles/header.module.css';

interface EventFormData {
  title: string;
  date: string;
  endDate?: string;
  category: string;
  description: string;
  isSpecial: boolean;
  tags: string[];
  sideEvents: Array<{
    id: string;
    title: string;
    description: string;
  }>;
  tables: Array<{
    headers: string[];
    rows: Array<{ cells: Array<{ content: string }> }>;
    align?: 'left' | 'center' | 'right';
    columnWidths?: string[];
  }>;
}

const initialFormData: EventFormData = {
  title: '',
  date: '',
  endDate: '',
  category: '',
  description: '',
  isSpecial: false,
  tags: [],
  sideEvents: [],
  tables: []
};

export default function AdminEventEdit() {
  const isBrowser = typeof window !== 'undefined';
  const router = useRouter();
  const { id } = router.query;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [event, setEvent] = useState<TimelineEvent | null>(null);
  const [success, setSuccess] = useState<string>('');
  const [formData, setFormData] = useState<EventFormData>(initialFormData);

  // Authentication check
  useEffect(() => {
    if (!isBrowser) return;
    
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
  }, [router, isBrowser]);

  // Event listener
  useEffect(() => {
    if (typeof window !== 'undefined' && id && id !== 'new') {
      const unsubscribe = onSnapshot(
        doc(db, 'events', id as string),
        (doc) => {
          if (doc.exists()) {
            const eventData = { id: doc.id, ...doc.data() } as TimelineEvent;
            setEvent(eventData);
            setFormData({
              title: eventData.title || '',
              date: eventData.date || '',
              endDate: eventData.endDate || '',
              category: eventData.category || '',
              description: eventData.description || '',
              isSpecial: eventData.isSpecial || false,
              tags: eventData.tags || [],
              sideEvents: eventData.sideEvents || [],
              tables: (eventData.tables || []).map(table => ({
                ...table,
                align: table.align ?? 'left'
              }))
            });
          }
        },
        (error) => {
          console.error('Error listening to event:', error);
        }
      );

      return () => unsubscribe();
    }
  }, [id]);

  // Create preview event object
  const previewEvent: TimelineEvent = useMemo(() => ({
    id: event?.id || 'preview',
    title: formData.title || 'Untitled Event',
    description: formData.description || '',
    date: formData.date || new Date().toISOString().split('T')[0],
    endDate: formData.endDate,
    category: formData.category || 'miscellaneous',
    tags: formData.tags || [],
    isSpecial: formData.isSpecial || false,
    tables: formData.tables || [],
    sideEvents: formData.sideEvents || []
  }), [formData, event?.id]);

  const handleLogout = () => handleAdminLogout(router);

  const handleSuccess = (message: string) => {
    setSuccess(message);
    router.push('/admin/events');
  };

  const handleChange = (data: EventFormData) => {
    setFormData(data);
  };

  const handleDelete = (id: string) => {
    router.push('/admin/events');
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
        <title>{id === 'new' ? 'Create Event' : 'Edit Event'} - TNT Tag History</title>
      </Head>
      <Header>
        <div className={controlStyles.headerControls}>
          <Link href="/admin/events">
            <button className={controlStyles.headerButton} style={{ width: 'auto' }}>
              Back to Events
            </button>
          </Link>
          <button onClick={handleLogout} className={controlStyles.headerButton}>
            Logout
          </button>
        </div>
      </Header>
      <div className={headerStyles['info-box']}>Version: Beta 1.0</div>
      
      <main className={baseStyles.mainContent}>
        {success && <div className={baseStyles.successMessage}><span className={baseStyles.successText}>{success}</span></div>}

        <div className={baseStyles.editLayout}>
          {/* Form Section */}
          <div className={baseStyles.formSection}>
            <div className={baseStyles.header}>
              <div className={baseStyles.title}>
                {id === 'new' ? 'Create New Event' : 'Edit Event'}
              </div>
            </div>
          <EventForm 
            key={event?.id || 'new'} 
            selectedEvent={event}
            onSuccess={handleSuccess}
            onError={(errorMsg: string) => console.error(errorMsg)}
            onDelete={handleDelete}
            onChange={handleChange}
            formData={formData}
          />
          </div>

          {/* Preview Section */}
          <div className={baseStyles.previewSection}>
            <div className={baseStyles.title}>Live Preview</div>
            <div className={eventStyles.eventPageContent}>
              <div className={eventStyles.modalHeader}>
                <div className={eventStyles.headerTags}>
                  <div className={eventStyles.eventTypeWrapper}>
                    <div 
                      className={eventStyles.eventType}
                      style={{ color: getCategoryColor(previewEvent.category) }}
                    >
                      {getCategoryName(previewEvent.category)}
                    </div>
                  </div>
                </div>
              </div>
              <h2 className={eventStyles.modalTitle}>
                {previewEvent.isSpecial && <span className={eventStyles.specialStar}>⭐</span>}
                {previewEvent.title}
              </h2>
              <div className={eventStyles.modalDate}>
                {previewEvent.date && new Date(previewEvent.date).toLocaleDateString()}
                {previewEvent.endDate && (
                  <span> - {new Date(previewEvent.endDate).toLocaleDateString()}</span>
                )}
              </div>
              <hr className={eventStyles.divider} />
              <EventContent event={previewEvent} />
              
              <div className={eventStyles.modalFooter}>
                <hr className={eventStyles.divider} />
                <div className={eventStyles.tagLabel}>Tags:</div>
                <div className={eventStyles.modalTags}>
                  {previewEvent.tags.map(tag => (
                    <span key={tag} className={eventStyles.tag}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}