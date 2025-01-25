import React, { useState } from 'react';
import Link from 'next/link'
import styles from '../../styles/events.module.css';
import controlStyles from '../../styles/controls.module.css'
import { TimelineEvent } from '../../data/events';
import { getCategoryName, getCategoryColor } from '../../config/categories';
import { ChevronDown, ChevronRight } from 'lucide-react';
import EventContent from './EventContent';

interface EventModalProps {
  event: TimelineEvent;
  onClose: () => void;
}

const EventModal: React.FC<EventModalProps> = ({ event, onClose }) => {
  const [expandedSideEvents, setExpandedSideEvents] = useState<Record<string, boolean>>({});

  const toggleSideEvent = (id: string) => {
    setExpandedSideEvents(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
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
          <div className={styles.modalControls}>
            <Link href={`/event/${event.id}`} target="_blank">
              <button className={styles.openButton}>↗</button>
            </Link>
            <button className={controlStyles.closeButton} onClick={onClose}>×</button>
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
        
        <hr className={styles.divider} />
        <div className={styles.tagLabel}>Tags:</div>
        <div className={styles.modalTags}>
          {event.tags.map(tag => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventModal;