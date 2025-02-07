// src/components/player/PlayerEventsList.tsx
import { TimelineEvent } from '../../data/events';
import styles from '../../styles/eventsList.module.css';
import eventStyles from '../../styles/events.module.css';
import { Category, getEventStyles } from '../../config/categories';

interface PlayerEventsListProps {
  events: TimelineEvent[];
  onEventSelect?: (event: TimelineEvent) => void;
  categories: Record<string, Category>;
  formatDate: (date: string) => string;
}

const PlayerEventsList: React.FC<PlayerEventsListProps> = ({ events, onEventSelect }) => {
  return (
    <div className={styles.playerEventsSection}>
      <div className={styles.eventsList}>
        {events.map(event => {
          const eventStyle = getEventStyles(event.category, event.isSpecial);
          return (
            <div 
              key={event.id}
              className={`${styles.eventBox} ${eventStyles.eventBox}`}
              onClick={() => onEventSelect?.(event)}
              style={{
                ...eventStyle,
                position: 'relative',
                left: 0,
                top: 0,
                width: '100%',
                cursor: 'pointer',
              }}
            >
              <div className={eventStyles.eventContent}>
                <h3 className={eventStyles.eventTitle}>
                  {event.isSpecial && <span className={eventStyles.specialStar}>⭐</span>}
                  <span className={eventStyles.eventTitleText}>{event.title}</span>
                </h3>
                <div className={eventStyles.eventDate}>
                  {new Date(event.date).toLocaleDateString()}
                  {event.endDate && ` - ${new Date(event.endDate).toLocaleDateString()}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlayerEventsList;