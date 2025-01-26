import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styles from '../../styles/events.module.css';  
import { TimelineEvent } from '../../data/events';
import EventModal from './EventModal';
import { getEventStyles } from '../../config/categories';


interface EventBoxProps {
  event: TimelineEvent;
  position: number;
  column: number;
  isDraggingEnabled: boolean;
  onUpdateColumn: (eventId: string, newColumn: number, position: number) => void;
  getEventPosition?: (date: string) => number;
}

const EventBox: React.FC<EventBoxProps> = ({ 
  event, 
  position, 
  column, 
  isDraggingEnabled,
  onUpdateColumn,
  getEventPosition
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [eventBoxHeight, setEventBoxHeight] = useState(0);
  const eventBoxRef = useRef<HTMLDivElement>(null);
  const eventStyles = getEventStyles(event.category, event.isSpecial);
  
  // Calculate initial card position only once
  const initialCardPosition = useMemo(() => {
    if (event.endDate && getEventPosition) {
      return (getEventPosition(event.date) + getEventPosition(event.endDate)) / 2 - (eventBoxHeight / 2);
    }
    return position - (eventBoxHeight / 2);
  }, [event, position, getEventPosition, eventBoxHeight]);

  useEffect(() => {
    if (eventBoxRef.current) {
      setEventBoxHeight(eventBoxRef.current.offsetHeight);
    }
  }, []);

  const baseOffset = 210;
  const columnWidth = 220;
  const leftPosition = baseOffset + (column * columnWidth);
  
  const connectionLineWidth = leftPosition - 100;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (eventBoxRef.current && isDraggingEnabled) {
      const rect = eventBoxRef.current.getBoundingClientRect();
      setStartX(e.clientX - rect.left);
      setIsDragging(true);
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && eventBoxRef.current) {
      const deltaX = e.clientX - startX - leftPosition;
  
      if (eventBoxRef.current) {
        // Transform the event box
        eventBoxRef.current.style.transform = `translateX(${deltaX}px)`;

        // Different handling for multi-day and single-day events
        if (event.endDate && getEventPosition) {
          // Multi-day event connector logic
          const verticalLineLeft = (leftPosition - 100) / 2 + 100;
          const startPosition = getEventPosition(event.date);
          const endPosition = getEventPosition(event.endDate);

          const parentElement = eventBoxRef.current.parentElement;
          if (parentElement) {
            // Vertical Line
            const verticalLine = parentElement.querySelector(`.${styles.verticalLine}`);
            if (verticalLine instanceof HTMLElement) {
              const newLeft = verticalLineLeft + deltaX / 2;
              verticalLine.style.left = `${newLeft}px`;
              
              verticalLine.style.top = `${Math.min(startPosition, endPosition)}px`;
              verticalLine.style.height = `${Math.abs(endPosition - startPosition)}px`;
            }

            // Horizontal Start and End Lines
            const startLine = parentElement.querySelector(`.${styles.horizontalStartLine}`);
            const endLine = parentElement.querySelector(`.${styles.horizontalEndLine}`);
            if (startLine instanceof HTMLElement && endLine instanceof HTMLElement) {
              const newStartWidth = verticalLineLeft - 100 + deltaX / 2;
              const newEndWidth = verticalLineLeft - 100 + deltaX / 2;
              
              startLine.style.width = `${newStartWidth}px`;
              startLine.style.top = `${startPosition}px`;

              endLine.style.width = `${newEndWidth}px`;
              endLine.style.top = `${endPosition}px`;
            }

            // Event Connector
            const eventConnector = parentElement.querySelector(`.${styles.eventConnector}`);
            if (eventConnector instanceof HTMLElement) {
              const centerPosition = Math.min(startPosition, endPosition) + Math.abs(endPosition - startPosition) / 2;
              
              const newLeft = verticalLineLeft + deltaX / 2;
              const newWidth = leftPosition - verticalLineLeft + deltaX / 2;
              
              eventConnector.style.left = `${newLeft}px`;
              eventConnector.style.width = `${newWidth}px`;
              eventConnector.style.top = `${centerPosition}px`;
            }
          }
        } else {
          const connectorElement = eventBoxRef.current.nextElementSibling?.querySelector(`.${styles.connectionLine}`) as HTMLElement;
          
          if (connectorElement) {
            const newWidth = leftPosition + deltaX - 100;
            connectorElement.style.width = `${newWidth}px`;

            connectorElement.style.transition = 'none';
          }
        }
      }
    }
  }, [isDragging, startX, leftPosition, event, getEventPosition]);
  
  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setIsDragging(false);
      const finalX = e.clientX - startX;
      
      // Calculate new column based on final position
      const relativeX = finalX - baseOffset;
      const newColumn = Math.round(relativeX / columnWidth);
      const boundedColumn = Math.max(0, Math.min(newColumn, 19)); // Assuming 20 columns (0-19)
      
      if (boundedColumn !== column) {
        // Use the original position, not adjusted by eventBoxHeight
        onUpdateColumn(event.id, boundedColumn, position);
      }

      if (eventBoxRef.current) {
        // Reset transform
        eventBoxRef.current.style.transform = 'none';

        // Different handling for multi-day and single-day events
        if (event.endDate && getEventPosition) {
          const verticalLineLeft = (leftPosition - 100) / 2 + 100;
          const parentElement = eventBoxRef.current.parentElement;
          
          if (parentElement) {
            // Vertical Line
            const verticalLine = parentElement.querySelector(`.${styles.verticalLine}`);
            if (verticalLine instanceof HTMLElement) {
              verticalLine.style.left = `${verticalLineLeft}px`;
            }

            // Horizontal Lines and Event Connector reset
            const startLine = parentElement.querySelector(`.${styles.horizontalStartLine}`);
            const endLine = parentElement.querySelector(`.${styles.horizontalEndLine}`);
            const eventConnector = parentElement.querySelector(`.${styles.eventConnector}`);

            if (startLine instanceof HTMLElement) {
              startLine.style.width = `${verticalLineLeft - 100}px`;
            }
            if (endLine instanceof HTMLElement) {
              endLine.style.width = `${verticalLineLeft - 100}px`;
            }
            if (eventConnector instanceof HTMLElement) {
              eventConnector.style.width = `${leftPosition - verticalLineLeft}px`;
            }
          }
        } else {
          // Single-day event connector reset - EXACTLY like the original implementation
          const connectorElement = eventBoxRef.current.nextElementSibling?.querySelector(`.${styles.connectionLine}`) as HTMLElement;
          if (connectorElement) {
            connectorElement.style.width = `${connectionLineWidth}px`;
            connectorElement.style.transition = '';
          }
        }
      }
    }
  }, [isDragging, startX, baseOffset, columnWidth, column, event.id, event.endDate, getEventPosition, leftPosition, onUpdateColumn, connectionLineWidth]);

  
  const handleClick = () => {
    if (!isDraggingEnabled && !isDragging) {
      setIsModalOpen(true);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Declare isHovered state at component level
  const [isHovered, setIsHovered] = useState(false);

  // Render connections based on single or multi-day event
  const renderConnections = () => {
    if (!event.endDate) {
      return (
        <div className={styles.eventConnections}>
          <div
            className={styles.connectionLine}
            style={{
              width: `${connectionLineWidth}px`,
              top: `${position}px`
            }}
          />
        </div>
      );
    }

    // Multi-day event connections
    if (!getEventPosition) return null;
    const horizontalLineWidth = isHovered ? 3 : 2;

    const startPosition = getEventPosition(event.date);
    const endPosition = getEventPosition(event.endDate);
    const verticalLineHeight = Math.abs(endPosition - startPosition);
    const verticalLineTop = Math.min(startPosition, endPosition);
    const verticalLineLeft = (leftPosition - 100) / 2 + 100;
    const centerPosition = verticalLineTop + (verticalLineHeight / 2);

    return (
      <div className={styles.eventConnections}>
        <div 
          className={styles.horizontalStartLine} 
          style={{ 
            top: `${startPosition}px`,
            width: `${verticalLineLeft - 100 + horizontalLineWidth}px`,
            left: '100px'
          }} 
        />
        <div 
          className={styles.horizontalEndLine} 
          style={{ 
            top: `${endPosition}px`,
            width: `${verticalLineLeft - 100 + horizontalLineWidth}px`,
            left: '100px'
          }}
        />
        <div
          className={styles.verticalLine}
          style={{
            top: `${verticalLineTop}px`,
            height: `${verticalLineHeight}px`,
            left: `${verticalLineLeft}px`
          }}
        />
        <div
          className={styles.eventConnector}
          style={{
            width: `${leftPosition - verticalLineLeft}px`,
            top: `${centerPosition}px`,
            left: `${verticalLineLeft}px`
          }}
        />
      </div>
    );
  };

  return (
    <>
      <div 
        ref={eventBoxRef}
        className={`${styles.eventBox} ${isDragging ? styles.dragging : ''}`}
        style={{ 
          top: `${initialCardPosition}px`,
          left: `${leftPosition}px`,
          cursor: isDraggingEnabled ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
          ...eventStyles
        }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        data-event-id={event.id}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        >
        <div className={styles.eventContent}>
          <h3 className={styles.eventTitle}>{event.title}</h3>
          <div className={styles.eventDate}>
            {new Date(event.date).toLocaleDateString()}
            {event.endDate && ` - ${new Date(event.endDate).toLocaleDateString()}`}
            {event.isSpecial && <span className={styles.specialStar}>⭐</span>}
          </div>
        </div>
      </div>
     
      {renderConnections()}
      
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