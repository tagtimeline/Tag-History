import React, { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { TimelineEvent } from '../../data/events';
import EventTable from './EventTable';
import styles from '../../styles/events.module.css';

interface EventContentProps {
  event: TimelineEvent;
}

const formatText = (text: string) => {
  // Text formatting
  return text
    // Bold italics (must come before bold and italics)
    .replace(/\*\*\*(.*?)\*\*\*/g, '<span class="bold-italic">$1</span>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<span class="bold">$1</span>')
    // Italics
    .replace(/\*(.*?)\*/g, '<span class="italic">$1</span>')
    .replace(/_(.*?)_/g, '<span class="italic">$1</span>')
    // Underline
    .replace(/__(.*?)__/g, '<span class="underline">$1</span>')
    // Strikethrough
    .replace(/~~(.*?)~~/g, '<span class="strikethrough">$1</span>');
};

const renderTextWithLinks = (text: string) => {
  const parts = [];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    // Add formatted text before the link
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index);
      parts.push(<span key={`text-${match.index}`} dangerouslySetInnerHTML={{ __html: formatText(beforeText) }} />);
    }

    // Add the link
    parts.push(
      <Link 
        key={`link-${match.index}`} 
        href={match[2]} 
        target="_blank" 
        className="inline-link"
      >
        <ExternalLink size={12} />
        <span>{match[1]}</span>
      </Link>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining formatted text
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    parts.push(<span key="text-end" dangerouslySetInnerHTML={{ __html: formatText(remainingText) }} />);
  }

  return parts;
};

const parseContent = (paragraph: string) => {
  // Check for subtext first
  const isSubtext = paragraph.startsWith('-# ');
  if (isSubtext) {
    const content = paragraph.substring(3);
    return (
      <p className="subtext">
        {renderTextWithLinks(content)}
      </p>
    );
  }

  // Regular paragraph with formatting
  return (
    <p>{renderTextWithLinks(paragraph)}</p>
  );
};

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
        <React.Fragment key={index}>
          {paragraph === '[TABLE]' ? null : parseContent(paragraph)}
        </React.Fragment>
      ));
    }

    let tableIndex = 0;
    return event.description.split('\n\n').map((paragraph, index) => {
      if (paragraph === '[TABLE]') {
        const table = event.tables![tableIndex];
        tableIndex++;
        return <EventTable key={`table-${index}`} table={table} />;
      }
      return <React.Fragment key={index}>{parseContent(paragraph)}</React.Fragment>;
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
                      <React.Fragment key={index}>{parseContent(paragraph)}</React.Fragment>
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