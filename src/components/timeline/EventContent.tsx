import React, { useState } from 'react';
import { TimelineEvent } from '../../data/events';
import EventTable from './EventTable';
import styles from '../../styles/events.module.css';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface EventContentProps {
  event: TimelineEvent;
}

const EventContent: React.FC<EventContentProps> = ({ event }) => {
  const [expandedSideEvents, setExpandedSideEvents] = useState<Record<string, boolean>>({});

  const toggleSideEvent = (id: string) => {
    setExpandedSideEvents(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderContent = () => {
    if (!event.tables) {
      return event.description.split('\n\n').map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ));
    }

    let tableIndex = 0;
    return event.description.split('\n\n').map((paragraph, index) => {
      if (paragraph === '[TABLE]') {
        const table = event.tables![tableIndex];
        tableIndex++;
        return <EventTable key={`table-${index}`} table={table} />;
      }
      return <p key={index}>{paragraph}</p>;
    });
  };

  return (
    <div className={styles.modalText}>
      {renderContent()}
      
      {event.sideEvents && event.sideEvents.length > 0 && (
        <>
          <br />
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
    </div>
  );
};

export default EventContent;