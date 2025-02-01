import React, { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { TimelineEvent } from '../../data/events';
import EventTable from './EventTable';
import styles from '../../styles/events.module.css';
import formatStyles from '../../styles/formatting.module.css';
import { formatText, extractLinks, isSubtext, getSubtextContent,isHeadertext,getHeadertextContent,getClass} from '../../config/formatting';

interface EventContentProps {
  event: TimelineEvent;
}

const renderTextWithLinks = (text: string) => {
  const links = extractLinks(text);
  const parts = [];
  let lastIndex = 0;

  links.forEach((link, index) => {
    if (link.index > lastIndex) {
      const beforeText = text.slice(lastIndex, link.index);
      parts.push(
        <span 
          key={`text-${index}`} 
          dangerouslySetInnerHTML={{ __html: formatText(beforeText) }} 
        />
      );
    }

    parts.push(
      <Link 
        key={`link-${index}`} 
        href={link.url} 
        target="_blank" 
        className={formatStyles.inlineLink}
      >
        <ExternalLink size={12} />
        <span>{link.text}</span>
      </Link>
    );

    lastIndex = link.index + link.length;
  });

  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    parts.push(
      <span 
        key="text-end" 
        dangerouslySetInnerHTML={{ __html: formatText(remainingText) }} 
      />
    );
  }

  return parts;
};

const parseLine = (line: string, index: number) => {
  // Check for headertext
  if (isHeadertext(line)) {
    const content = getHeadertextContent(line);
    return (
      <p key={index} className={formatStyles[getClass('headertext')]}>
        {renderTextWithLinks(content)}
      </p>
    );
  }

  // Check for subtext
  if (isSubtext(line)) {
    const content = getSubtextContent(line);
    return (
      <p key={index} className={formatStyles[getClass('subtext')]}>
        {renderTextWithLinks(content)}
      </p>
    );
  }

  // Regular line with formatting
  return (
    <p key={index} className={formatStyles.text}>
      {renderTextWithLinks(line)}
    </p>
  );
};

const parseContent = (text: string) => {
  const lines = text.split('\n');
  let currentGroup: React.ReactNode[] = [];
  const groups: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    if (line.trim() === '') {
      if (currentGroup.length > 0) {
        groups.push(
          <div key={`group-${groups.length}`} className={formatStyles.paragraph}>
            {currentGroup}
          </div>
        );
        currentGroup = [];
      }
      if (index > 0 && lines[index - 1].trim() === '') {
        groups.push(<br key={`br-${groups.length}`} />);
      }
    } else {
      currentGroup.push(parseLine(line, index));
    }
  });

  if (currentGroup.length > 0) {
    groups.push(
      <div key={`group-${groups.length}`} className={formatStyles.paragraph}>
        {currentGroup}
      </div>
    );
  }

  return groups;
};

const EventContent: React.FC<EventContentProps> = ({ event }) => {
  const [expandedSideEvents, setExpandedSideEvents] = useState<Record<string, boolean>>({});

  const toggleSideEvent = (id: string) => {
    setExpandedSideEvents(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Track which side events have been used inline
  const usedSideEvents = useMemo(() => {
    const sideEventMatches = event.description.match(/\[SIDE:\w+\]/g) || [];
    return new Set(sideEventMatches.map(match => match.slice(6, -1)));
  }, [event.description]);

  const renderSideEvent = useCallback((sideEvent: NonNullable<TimelineEvent['sideEvents']>[number]) => {
    return (
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
            {parseContent(sideEvent.description)}
          </div>
        )}
      </div>
    );
  }, [expandedSideEvents]);

  const renderContent = () => {
    if (!event.description) return null;

    // Split content by table and side event markers
    const parts = event.description.split(/\[(?:TABLE|SIDE:\w+)\]/);
    const markers = event.description.match(/\[(?:TABLE|SIDE:\w+)\]/g) || [];
    
    let tableIndex = 0;
    
    return parts.map((part, index) => {
      const content = parseContent(part);
      
      // If this is not the last part, add the corresponding table or side event
      if (index < markers.length) {
        const marker = markers[index];
        
        if (marker === '[TABLE]' && event.tables) {
          return (
            <React.Fragment key={`section-${index}`}>
              {content}
              <div className={styles.tableWrapper}>
                <EventTable table={event.tables[tableIndex++]} />
              </div>
            </React.Fragment>
          );
        } else if (marker.startsWith('[SIDE:') && event.sideEvents) {
          const sideEventId = marker.slice(6, -1);
          const sideEvent = event.sideEvents.find(event => event.id === sideEventId);
          
          if (sideEvent) {
            return (
              <React.Fragment key={`section-${index}`}>
                {content}
                <div className={styles.inlineSideEventContainer}>
                  {renderSideEvent(sideEvent)}
                </div>
              </React.Fragment>
            );
          }
        }
      }
      
      return content;
    });
  };

  // Filter out side events that were already used inline
  const unusedSideEvents = useMemo(() => {
    if (!event.sideEvents) return [];
    return event.sideEvents.filter(sideEvent => !usedSideEvents.has(sideEvent.id));
  }, [event.sideEvents, usedSideEvents]);

  return (
    <div className={styles.modalText}>
      {renderContent()}
      
      {/* Only show unused side events at the bottom */}
      {unusedSideEvents.length > 0 && (
        <div className={styles.sideEventsContainer}>
          {unusedSideEvents.map(sideEvent => renderSideEvent(sideEvent))}
        </div>
      )}
    </div>
  );
};

export default EventContent;