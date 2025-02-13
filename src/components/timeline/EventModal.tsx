import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import styles from "../../styles/events.module.css";
import controlStyles from "../../styles/controls.module.css";
import { TimelineEvent } from "../../data/events";
import {
  getCategoryName,
  getCategoryColor,
  Category,
  fetchCategories,
} from "../../config/categories";
import EventContent from "./EventContent";
import { getAllEvents } from "../../../lib/eventUtils";

interface EventModalProps {
  event: TimelineEvent;
  onClose: () => void;
}

const EventModal: React.FC<EventModalProps> = ({ event, onClose }) => {
  // Get all events as an array
  const [allEvents, setAllEvents] = React.useState<TimelineEvent[]>([]);
  const [, setCategories] = useState<Record<string, Category>>({});

  useEffect(() => {
    getAllEvents().then((events) => setAllEvents(events));
  }, []);

  const getEventTitle = useCallback(
    (eventId: string) => {
      return allEvents.find((e: TimelineEvent) => e.id === eventId)?.title;
    },
    [allEvents]
  );

  useEffect(() => {
    const loadCategories = async () => {
      const cats = await fetchCategories();
      setCategories(cats);
    };
    loadCategories();
  }, []);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.eventTypeWrapper}>
            <div
              className={styles.eventType}
              style={{ color: getCategoryColor(event.category) }}
            >
              {getCategoryName(event.category)}
            </div>
            {event.category === "feuds" && (
              <Link
                href="https://discord.gg/pvhW64Jhbu"
                target="_blank"
                className={styles.discordLink}
              >
                <ExternalLink size={12} />
                <span>Tag Feuds Discord</span>
              </Link>
            )}
          </div>
          <div className={styles.modalControls}>
            <Link href={`/event/${event.id}`} target="_blank">
              <ExternalLink className={styles.openButton} size={12} />
            </Link>
            <button className={controlStyles.closeButton} onClick={onClose}>
              ×
            </button>
          </div>
        </div>
        <h2 className={styles.modalTitle}>
          {event.isSpecial && <span className={styles.specialStar}>⭐</span>}
          {event.title}
        </h2>
        <div className={styles.modalDate}>
          {new Date(event.date).toLocaleDateString()}
          {event.endDate && (
            <span> - {new Date(event.endDate).toLocaleDateString()}</span>
          )}
        </div>
        <hr className={styles.divider} />
        <EventContent event={event} getEventTitle={getEventTitle} />

        <hr className={styles.divider} />
        <div className={styles.tagLabel}>Tags:</div>
        <div className={styles.modalTags}>
          {event.tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventModal;
