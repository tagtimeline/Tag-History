import React, { useState } from 'react';
import Link from 'next/link'
import styles from '../../styles/events.module.css';
import controlStyles from '../../styles/controls.module.css'
import { TimelineEvent } from '../../data/events';
import { getCategoryName, getCategoryColor } from '../../config/categories';
import { ChevronDown, ChevronRight } from 'lucide-react';

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
            <button className={controlStyles.closeButton} onClick={onClose}>×</button>
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
        
        {event.sideEvents && event.sideEvents.length > 0 && (
          <>
            <br></br><br></br>
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
          </>
        )}
        
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