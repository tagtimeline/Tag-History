import React, { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { TimelineEvent } from '../../data/events';
import EventTable from './EventTable';
import styles from '../../styles/events.module.css';
import formatStyles from '../../styles/formatting.module.css';

import { 
 patterns, 
 formatText, 
 extractLinks,
 extractEventLinks, 
 isSubtext, 
 getSubtextContent, 
 isHeadertext, 
 getHeadertextContent, 
 getClass,
 extractImageDetails,
 isImage,
 extractVideoDetails,
} from '../../config/formatting';

interface EventContentProps {
 event: TimelineEvent;
 getEventTitle?: (id: string) => string | undefined;
}

const ReactPlayer = dynamic(() => import('react-player/lazy'), {
  ssr: false
});

const VideoPlayer: React.FC<{ platform: string; id: string }> = ({ platform, id }) => {
  const getUrl = () => {
    switch (platform) {
      case 'youtube': return `https://www.youtube.com/watch?v=${id}`;
      case 'vimeo': return `https://vimeo.com/${id}`;
      case 'twitch': return `https://www.twitch.tv/${id}`;
      default: return id;
    }
  };

  return (
    <div className={styles.videoWrapper}>
      <ReactPlayer
        url={getUrl()}
        width="100%"
        height="100%"
        controls
        config={{
          youtube: {
            playerVars: { modestbranding: 1 }
          }
        }}
      />
    </div>
  );
};

const renderTextWithLinks = (text: string, getEventTitle?: (id: string) => string | undefined) => {
  const links = extractLinks(text);
  const eventLinks = extractEventLinks(text);
  const youtubeMatches = text.match(patterns.youtube) || [];
  const imageMatches = text.match(patterns.image) || [];
  const videoMatches = text.match(patterns.video) || [];
  
  const allElements = [
    ...links.map(link => ({ type: 'link' as const, ...link })),
    ...eventLinks.map(link => ({ 
      type: 'eventLink' as const, 
      ...link,
      title: getEventTitle?.(link.id) || 'Unknown Event'  
    })),
    ...youtubeMatches.map(match => ({
      type: 'video' as const,
      index: text.indexOf(match),
      length: match.length,
      platform: 'youtube',
      id: match.slice(match.indexOf(':') + 1, match.length - 1)
    })),
    ...videoMatches.map(match => {
      const videoDetails = extractVideoDetails(match);
      return {
        type: 'video' as const,
        index: text.indexOf(match),
        length: match.length,
        platform: videoDetails?.platform || '',
        id: videoDetails?.id || ''
      };
    }),
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
      
      case 'eventLink':
        parts.push(
          <Link 
            key={`event-link-${index}`}
            href={`/event/${element.id}`}
            className={formatStyles.eventLink}
          >
            <ExternalLink size={12} />
            <span>{element.title}</span>
          </Link>
        );
        break;
  
      case 'video':
        parts.push(
          <VideoPlayer
            key={`video-${index}`}
            platform={element.platform}
            id={element.id}
          />
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
  
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    const parts2 = processPlayerMentions(remainingText, 'end');
    parts.push(...parts2);
  }
  
  return parts;
  };

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

const parseLine = (line: string, index: number, getEventTitle?: (id: string) => string | undefined) => {
  if (isHeadertext(line)) {
    const content = getHeadertextContent(line);
    return (
      <div key={index} className={formatStyles[getClass('headertext')]}>
        {renderTextWithLinks(content, getEventTitle)}
      </div>
    );
  }
  
  if (isSubtext(line)) {
    const content = getSubtextContent(line);
    return (
      <div key={index} className={formatStyles[getClass('subtext')]}>
        {renderTextWithLinks(content, getEventTitle)}
      </div>
    );
  }
  
  return (
    <div key={index} className={formatStyles.text}>
      {renderTextWithLinks(line, getEventTitle)}
    </div>
  );
  };


const parseContent = (text: string, getEventTitle?: (id: string) => string | undefined) => {
 const lines = text.split('\n');
 let currentGroup: React.ReactNode[] = [];
 const groups: React.ReactNode[] = [];
 let skipNext = false;

 for (let i = 0; i < lines.length; i++) {
   if (skipNext) {
     skipNext = false;
     continue;
   }

   const line = lines[i];
   const nextLine = i < lines.length - 1 ? lines[i + 1] : '';
   
   const isYoutube = patterns.youtube.test(line);
   const isGenericVideo = patterns.video.test(line);
   const isMedia = isImage(line) || isYoutube || isGenericVideo;
   const hasDirectSubtext = isSubtext(nextLine);

   if (isMedia && hasDirectSubtext) {
     const mediaElement = parseLine(line, i, getEventTitle);
     const subtextElement = parseLine(nextLine, i + 1, getEventTitle);
     const isVideoContent = isYoutube || isGenericVideo;
     
     groups.push(
       <div 
         key={`media-group-${groups.length}`} 
         className={isVideoContent ? styles.videoSubtextGroup : styles.imageSubtextGroup}
         style={{ width: isImage(line) ? extractImageDetails(line)?.size || '75%' : '75%' }}
       >
         {mediaElement}
         {subtextElement}
       </div>
     );
     
     skipNext = true;
     continue;
   }

   if (line.trim() === '') {
     if (currentGroup.length > 0) {
       groups.push(
         <div key={`group-${groups.length}`} className={formatStyles.paragraph}>
           {currentGroup}
         </div>
       );
       currentGroup = [];
     }
     if (i > 0 && lines[i - 1].trim() === '') {
       groups.push(<br key={`br-${groups.length}`} />);
     }
   } else {
     currentGroup.push(parseLine(line, i, getEventTitle));
   }
 }

 if (currentGroup.length > 0) {
   groups.push(
     <div key={`group-${groups.length}`} className={formatStyles.paragraph}>
       {currentGroup}
     </div>
   );
 }

 return groups;
};

const EventContent: React.FC<EventContentProps> = ({ event, getEventTitle }) => {
  const [expandedSideEvents, setExpandedSideEvents] = useState<Record<string, boolean>>({});

 const toggleSideEvent = (id: string) => {
   setExpandedSideEvents(prev => ({
     ...prev,
     [id]: !prev[id]
   }));
 };

 const usedSideEvents = useMemo(() => {
   const sideEventMatches = event.description.match(/\[SIDE-\d+\]/g) || [];
   return new Set(sideEventMatches.map(match => 
     parseInt(match.slice(6, -1))
   ));
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

  const parts = event.description.split(/\[(?:TABLE-\d+|SIDE-\d+)\]/);
  const markers = event.description.match(/\[(?:TABLE-\d+|SIDE-\d+)\]/g) || [];
  
  return parts.map((part, index) => {
    const content = parseContent(part, getEventTitle);
     
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

 const unusedSideEvents = useMemo(() => {
   if (!event.sideEvents) return [];
   return event.sideEvents.filter((_, index) => !usedSideEvents.has(index));
 }, [event.sideEvents, usedSideEvents]);

 return (
   <div className={styles.modalText}>
     {renderContent()}
     {unusedSideEvents.length > 0 && (
       <div className={styles.sideEventsContainer}>
         {unusedSideEvents.map(sideEvent => renderSideEvent(sideEvent))}
       </div>
     )}
   </div>
 );
};

export default EventContent;