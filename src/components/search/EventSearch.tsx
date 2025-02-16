// src/components/events/EventSearch.tsx
import React, { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/router";
import { db } from "../../../lib/firebaseConfig";
import { searchEvents } from "../../config/search";
import { TimelineEvent } from "../../data/events";
import { getCategoryColor } from "../../config/categories";
import searchStyles from "../../styles/search.module.css";

interface EventSearchProps {
  onEventSelect?: (event: TimelineEvent) => void;
  filterEvents?: (event: TimelineEvent) => boolean;
}

const EventSearch: React.FC<EventSearchProps> = ({
  onEventSelect,
  filterEvents,
}) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [searchResults, setSearchResults] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const handleRouteChange = () => {
      setSearchTerm("");
      setSearchResults([]);
      setIsFocused(false);
    };

    router.events.on("routeChangeStart", handleRouteChange);
    return () => router.events.off("routeChangeStart", handleRouteChange);
  }, [router]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "events"),
      (snapshot) => {
        let eventData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as TimelineEvent[];

        // Sort events by date (most recent first)
        eventData.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // Apply filter if provided
        if (filterEvents) {
          eventData = eventData.filter(filterEvents);
        }

        setEvents(eventData);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching events:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [filterEvents]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim()) {
      let filtered = searchEvents(events, value);
      if (filterEvents) {
        filtered = filtered.filter(filterEvents);
      }
      setSearchResults(filtered);
    } else {
      setSearchResults(events);
    }
  };

  const handleResultClick = async (event: TimelineEvent) => {
    setSearchTerm("");
    setSearchResults([]);
    setIsFocused(false);

    if (onEventSelect) {
      onEventSelect(event);
      return;
    }

    const currentPage = router.pathname;

    switch (currentPage) {
      case "/":
      case "/timeline":
        await router.push(`/timeline#${event.id}`);
        const eventElement = document.querySelector(
          `[data-event-id="${event.id}"]`
        );
        if (eventElement) {
          eventElement.scrollIntoView({ behavior: "smooth", block: "center" });
          (eventElement as HTMLElement).click();
        }
        break;

      case "/events":
      case "/events/[id]":
        const eventCard = document.querySelector(
          `[data-event-id="${event.id}"]`
        );
        if (eventCard) {
          (eventCard as HTMLElement).click();
        }
        break;

      case "/admin":
        const adminEventCard = document.querySelector(
          `[data-event-id="${event.id}"]`
        );
        if (adminEventCard) {
          adminEventCard.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          adminEventCard.classList.add(searchStyles.hoverEffect);
          setTimeout(() => {
            adminEventCard.classList.remove(searchStyles.hoverEffect);
          }, 2000);
        }
        break;

      default:
        console.warn("Unknown page for event search handling");
    }
  };

  return (
    <div className={searchStyles.searchContainer}>
      <input
        type="text"
        className={searchStyles.eventSearchInput}
        placeholder="Search events..."
        value={searchTerm}
        onChange={handleSearchChange}
        onFocus={() => {
          setIsFocused(true);
          setSearchResults(events);
        }}
        onBlur={() => {
          setTimeout(() => setIsFocused(false), 200);
        }}
      />
      {isLoading ? (
        <div className={searchStyles.eventSearchResults}>
          <div className={searchStyles.loadingText}>Loading...</div>
        </div>
      ) : (
        (isFocused || searchTerm) && (
          <div className={searchStyles.eventSearchResults}>
            {searchResults.length > 0 ? (
              searchResults.map((event) => (
                <div
                  key={event.id}
                  className={searchStyles.eventResultItem}
                  onClick={() => handleResultClick(event)}
                >
                  <span
                    className={searchStyles.categoryColor}
                    style={{
                      backgroundColor: getCategoryColor(event.category),
                    }}
                  />
                  <div>
                    <div className={searchStyles.eventResultTitle}>
                      {event.title}
                    </div>
                    <div className={searchStyles.eventDate}>
                      {new Date(event.date).toLocaleDateString()}
                      {event.endDate && typeof event.endDate === 'string' &&
                        ` - ${new Date(event.endDate).toLocaleDateString()}`}
                      {event.isSpecial && (
                        <span className={searchStyles.specialStar}>⭐</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={searchStyles.noResults}>No events found</div>
            )}
          </div>
        )
      )}
    </div>
  );
};

export default EventSearch;
