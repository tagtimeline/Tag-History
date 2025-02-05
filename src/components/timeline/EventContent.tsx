import React, { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { TimelineEvent } from '../../data/events';
import EventTable from './EventTable';
import styles from '../../styles/events.module.css';
import formatStyles from '../../styles/formatting.module.css';
import { 
  patterns, 
  formatText, 
  extractLinks, 
  isSubtext, 
  getSubtextContent, 
  isHeadertext, 
  getHeadertextContent, 
  getClass,
  extractImageDetails,
  isImage,
  shouldGroupLines
} from '../../config/formatting';


interface EventContentProps {
  event: TimelineEvent;
}

const renderTextWithLinks = (text: string) => {
  const links = extractLinks(text);
  const youtubeMatches = text.match(patterns.youtube) || [];
  const imageMatches = text.match(patterns.image) || [];
  
  const allElements = [
    ...links.map(link => ({ type: 'link' as const, ...link })),
    ...youtubeMatches.map(match => ({
      type: 'youtube' as const,
      index: text.indexOf(match),
      length: match.length,
      videoId: match.slice(match.indexOf(':') + 1, match.length - 1)
    })),
    ...imageMatches.map(match => {
      const imageDetails = extractImageDetails(match);
      return {
        type: 'image' as const,
        index: text.indexOf(match),
        length: match.length,
        url: imageDetails?.url || '',
        size: imageDetails?.size
      };
    })
  ].sort((a, b) => a.index - b.index);

  const parts = [];
  let lastIndex = 0;
  
  // Handle all special elements first
  allElements.forEach((element, index) => {
    if (element.index > lastIndex) {
      const beforeText = text.slice(lastIndex, element.index);
      const parts2 = processPlayerMentions(beforeText, `pre-${index}`);
      parts.push(...parts2);
    }

    switch (element.type) {
      case 'link':
        parts.push(
          <Link 
            key={`link-${index}`}
            href={element.url}
            target="_blank"
            className={formatStyles.inlineLink}
          >
            <ExternalLink size={12} />
            <span>{element.text}</span>
          </Link>
        );
        break;

      case 'youtube':
        parts.push(
          <div key={`youtube-${index}`} className={styles.videoWrapper}>
            <iframe
              width="100%"
              height="315"
              src={`https://www.youtube.com/embed/${element.videoId}`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
        break;

      case 'image':
        parts.push(
          <div 
            key={`image-${index}`} 
            className={styles.imageWrapper}
            style={{ width: element.size || '75%' }}
          >
            <Image 
              src={element.url}
              alt="Event content"
              width={800}
              height={600}
              className={styles.contentImage}
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = 'none';
                const errorText = document.createElement('span');
                errorText.textContent = 'Image failed to load';
                errorText.className = styles.imageError;
                img.parentNode?.appendChild(errorText);
              }}
            />
          </div>
        );
        break;
    }

    lastIndex = element.index + element.length;
  });


  // Handle remaining text
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    const parts2 = processPlayerMentions(remainingText, 'end');
    parts.push(...parts2);
  }

  return parts;
};

// Helper function to process player mentions
const processPlayerMentions = (text: string, keyPrefix: string) => {
  const parts = [];
  const playerPattern = /<([^>]+)>/g;
  let lastIndex = 0;
  let match;

  while ((match = playerPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index);
      parts.push(
        <span 
          key={`text-${keyPrefix}-${lastIndex}`} 
          dangerouslySetInnerHTML={{ __html: formatText(beforeText) }} 
        />
      );
    }

    parts.push(
      <Link
        key={`player-${keyPrefix}-${match.index}`}
        href={`/player/${match[1]}`}
        className={formatStyles.playerLink}
      >
        {match[1]}
      </Link>
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    const afterText = text.slice(lastIndex);
    parts.push(
      <span 
        key={`text-${keyPrefix}-${lastIndex}`} 
        dangerouslySetInnerHTML={{ __html: formatText(afterText) }} 
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
      <div key={index} className={formatStyles[getClass('headertext')]}>
        {renderTextWithLinks(content)}
      </div>
    );
  }

  // Check for subtext
  if (isSubtext(line)) {
    const content = getSubtextContent(line);
    return (
      <div key={index} className={formatStyles[getClass('subtext')]}>
        {renderTextWithLinks(content)}
      </div>
    );
  }

  // Regular line with formatting
  return (
    <div key={index} className={formatStyles.text}>
      {renderTextWithLinks(line)}
    </div>
  );
};


const parseContent = (text: string) => {
  const lines = text.split('\n');
  let currentGroup: React.ReactNode[] = [];
  const groups: React.ReactNode[] = [];
  let skipNext = false;

  lines.forEach((line, index) => {
    if (skipNext) {
      skipNext = false;
      return;
    }

    const nextLine = index < lines.length - 1 ? lines[index + 1] : '';
    
    if (isImage(line) && isSubtext(nextLine)) {
      // Handle image with subtext
      const imageElement = parseLine(line, index);
      const subtextElement = parseLine(nextLine, index + 1);
      
      const imageDetails = extractImageDetails(line);
      const width = imageDetails?.size || '75%';
      
      groups.push(
        <div 
          key={`image-group-${groups.length}`} 
          className={styles.imageSubtextGroup}
          style={{ width }}
        >
          {imageElement}
          {subtextElement}
        </div>
      );
      
      skipNext = true;
    } else if (line.trim() === '') {
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
    const sideEventMatches = event.description.match(/\[SIDE-\d+\]/g) || [];
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
  
    // Update the split pattern to match new format
    const parts = event.description.split(/\[(?:TABLE-\d+|SIDE-\d+)\]/);
    const markers = event.description.match(/\[(?:TABLE-\d+|SIDE-\d+)\]/g) || [];
    
    return parts.map((part, index) => {
      const content = parseContent(part);
      
      // If this is not the last part, add the corresponding table or side event
      if (index < markers.length) {
        const marker = markers[index];
        
        if (marker.startsWith('[TABLE-')) {
          const tableIndex = parseInt(marker.slice(7, -1));
          if (event.tables && tableIndex < event.tables.length) {
            return (
              <React.Fragment key={`section-${index}`}>
                {content}
                <div className={styles.tableWrapper}>
                  <EventTable table={event.tables[tableIndex]} />
                </div>
              </React.Fragment>
            );
          }
        } else if (marker.startsWith('[SIDE-')) {
          const sideEventIndex = parseInt(marker.slice(6, -1));
          if (event.sideEvents && sideEventIndex < event.sideEvents.length) {
            const sideEvent = event.sideEvents[sideEventIndex];
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