import React from 'react';
import Link from 'next/link'
import styles from '../../styles/events.module.css';
import { TimelineEvent } from '../../data/events';
import { getCategoryName, getCategoryColor } from '../../config/categories';

interface EventModalProps {
  event: TimelineEvent;
  onClose: () => void;
}

const EventModal: React.FC<EventModalProps> = ({ event, onClose }) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div 
            className={styles.eventType}
            style={{ color: getCategoryColor(event.category) }}
          >
            {getCategoryName(event.category)}
          </div>
          <div className={styles.modalControls}>
            <Link href={`/event/${event.id}`} target="_blank">
              <button className={styles.openButton}>↗</button>
            </Link>
            <button className={styles.closeButton} onClick={onClose}>×</button>
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
    </div>
  );
};

export default EventModal;