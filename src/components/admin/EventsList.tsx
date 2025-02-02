// components/admin/EventsList.tsx
import { TimelineEvent } from '@/data/events';
import { categories, getEventStyles } from '@/config/categories';
import styles from '@/styles/admin.module.css';
import eventStyles from '@/styles/events.module.css';

interface EventsListProps {
  events: TimelineEvent[];
  onEventSelect: (event: TimelineEvent) => void;
}

export default function EventsList({ events, onEventSelect }: EventsListProps) {
  return (
    <div className={styles.eventsList}>
      <div className={styles.title}>Existing Events</div>
      <div className={styles.eventsGrid}>
        {events.map((event) => {
          const eventStyle = {
            ...getEventStyles(event.category),
            borderLeft: `3px solid ${categories[event.category].color}`
          };
          
          return (
            <div 
              key={event.id} 
              className={styles.eventItem}
              onClick={() => {
                onEventSelect(event);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={eventStyle}
            >
              <div className={eventStyles.eventContent}>
                <h3 className={eventStyles.eventTitle}>
                  {event.isSpecial && <span className={eventStyles.specialStar}>⭐</span>}
                  {event.title}
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
}