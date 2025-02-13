// pages/event/[id].tsx
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import { TimelineEvent } from "../../data/events";
import controlStyles from "../../styles/controls.module.css";
import withAuth from "../../components/auth/withAuth";
import { fetchCategories, Category } from "../../config/categories";
import EventContent from "../../components/timeline/EventContent";
import { getEventById, getAllEvents } from "../../../lib/eventUtils";
import { db } from "../../../lib/firebaseConfig";

import styles from "../../styles/eventPage.module.css";
import eventStyles from "../../styles/events.module.css";

interface EventPageProps extends Record<string, unknown> {
  initialEvent: TimelineEvent;
  allEvents: TimelineEvent[];
}

const EventPage: NextPage<EventPageProps> = ({ initialEvent, allEvents }) => {
  const router = useRouter();
  const { id } = router.query;
  const [event, setEvent] = useState<TimelineEvent>(initialEvent);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await fetchCategories();
        setCategories(cats);
      } catch (error) {
        console.error("Error loading categories:", error);
        setError("Failed to load categories");
      } finally {
        setIsLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  // Listen for event updates
  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(
      doc(db, "events", id as string),
      (doc) => {
        if (doc.exists()) {
          setEvent({ id: doc.id, ...doc.data() } as TimelineEvent);
        } else {
          setError("Event not found");
          router.push("/timeline");
        }
      },
      (error) => {
        console.error("Error listening to event:", error);
        setError("Failed to load event updates");
      }
    );

    return () => unsubscribe();
  }, [id, router]);

  const getEventTitle = useCallback(
    (eventId: string) => {
      return allEvents.find((e) => e.id === eventId)?.title;
    },
    [allEvents]
  );

  const sortedEvents = [...allEvents].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const currentIndex = sortedEvents.findIndex((e) => e.id === id);
  const prevEvent = currentIndex > 0 ? sortedEvents[currentIndex - 1] : null;
  const nextEvent =
    currentIndex < sortedEvents.length - 1
      ? sortedEvents[currentIndex + 1]
      : null;

  if (!event || isLoadingCategories) return <div>Loading...</div>;

  return (
    <>
      <Head>
        <title>{event.title} - TNT Tag History</title>
        <meta name="description" content={event.description.slice(0, 160)} />
      </Head>

      <Header>
        <div className={controlStyles.headerControls}>
          <Link href="/timeline">
            <button className={controlStyles.headerButton}>Timeline</button>
          </Link>
          <Link href="/events">
            <button className={controlStyles.headerButton}>Events</button>
          </Link>
          <Link href="/info">
            <button className={controlStyles.headerButton}>Info</button>
          </Link>
        </div>
      </Header>

      {error && (
        <div
          className="error-message"
          style={{
            color: "red",
            textAlign: "center",
            padding: "10px",
          }}
        >
          {error}
        </div>
      )}

      <main className={styles.wrapper}>
        <div className={styles.navigation}>
          <Link
            href={prevEvent ? `/event/${prevEvent.id}` : "#"}
            className={`${styles.navButton} ${
              !prevEvent ? styles.navButtonDisabled : ""
            }`}
          >
            <ChevronLeft size={14} />
            <span>Back</span>
          </Link>
          <Link
            href={nextEvent ? `/event/${nextEvent.id}` : "#"}
            className={`${styles.navButton} ${
              !nextEvent ? styles.navButtonDisabled : ""
            }`}
          >
            <span>Next</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.headerTags}>
              {categories[event.category] && (
                <div
                  className={eventStyles.eventType}
                  style={{ color: categories[event.category].color }}
                >
                  {categories[event.category].name}
                </div>
              )}
              {event.category === "feuds" && (
                <Link
                  href="https://discord.gg/pvhW64Jhbu"
                  target="_blank"
                  className={eventStyles.discordLink}
                >
                  <ExternalLink size={12} />
                  <span>Tag Feuds Discord</span>
                </Link>
              )}
            </div>
          </div>

          <h2 className={styles.title}>
            {event.isSpecial && (
              <span className={eventStyles.specialStar}>⭐</span>
            )}
            {event.title}
          </h2>

          <div className={styles.date}>
            {new Date(event.date).toLocaleDateString("en-GB", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })}
            {event.endDate &&
              ` - ${new Date(event.endDate).toLocaleDateString("en-GB", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })}`}
          </div>

          <hr className={eventStyles.divider} />

          <EventContent event={event} getEventTitle={getEventTitle} />

          <div className={eventStyles.modalFooter}>
            <hr className={eventStyles.divider} />
            <div className={eventStyles.tagLabel}>Tags:</div>
            <div className={eventStyles.modalTags}>
              {event.tags.map((tag) => (
                <span key={tag} className={eventStyles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export async function getServerSideProps({
  params,
}: {
  params: { id: string };
}) {
  try {
    const event = await getEventById(params.id);

    if (!event) {
      return { notFound: true };
    }

    const allEvents = await getAllEvents();

    const serializedEvent = {
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      endDate: event.endDate || null,
      category: event.category,
      tags: event.tags,
      isSpecial: event.isSpecial,
      tables: event.tables,
      sideEvents: event.sideEvents,
    };

    const serializedAllEvents = allEvents.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      endDate: event.endDate || null,
      category: event.category,
      tags: event.tags,
      isSpecial: event.isSpecial,
      tables: event.tables,
      sideEvents: event.sideEvents,
    }));

    return {
      props: {
        initialEvent: serializedEvent,
        allEvents: serializedAllEvents,
      },
    };
  } catch (error) {
    console.error("Error fetching event:", error);
    return { notFound: true };
  }
}

export default withAuth<EventPageProps>(EventPage);
