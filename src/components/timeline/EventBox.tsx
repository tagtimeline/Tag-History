import React, { useState, useEffect, useRef } from 'react';
import styles from '../../styles/events.module.css';
import modalStyles from '../../styles/modal.module.css';
import { TimelineEvent } from '../../data/events';
import EventModal from './EventModal';
import { getEventStyles } from '../../config/categories';

interface EventBoxProps {
 event: TimelineEvent;
 position: number;
 column: number;
 timelinePosition: number;
}

const EventBox: React.FC<EventBoxProps> = ({ event, position, column, timelinePosition }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventBoxHeight, setEventBoxHeight] = useState(0);
  const eventBoxRef = useRef<HTMLDivElement>(null);
  const eventStyles = getEventStyles(event.category);
  
  useEffect(() => {
    if (eventBoxRef.current) {
      setEventBoxHeight(eventBoxRef.current.offsetHeight);
    }
  }, []);

  const baseOffset = 210;
  const columnWidth = 220;
  const leftPosition = baseOffset + (column * columnWidth);
  
  const connectionLineWidth = leftPosition - 100;
  const cardPosition = position - (eventBoxHeight / 2); // Center the card vertically

  return (
    <>
      <div
        className={styles.connectionLine}
        style={{
          width: `${connectionLineWidth}px`,
          top: `${position}px`
        }}
      />
      <div 
        ref={eventBoxRef}
        className={styles.eventBox}
        style={{ 
          top: `${cardPosition}px`,
          left: `${leftPosition}px`,
          ...eventStyles
        }}
        onClick={() => setIsModalOpen(true)}
        data-event-id={event.id}
      >
       <div className={styles.eventContent}>
         <h3 className={styles.eventTitle}>{event.title}</h3>
         <div className={styles.eventDate}>
           {new Date(event.date).toLocaleDateString()}
         </div>
       </div>
     </div>
     
     {isModalOpen && (
       <EventModal 
         event={event} 
         onClose={() => setIsModalOpen(false)} 
       />
     )}
   </>
 );
};

export default EventBox;