// TimelineGrid.tsx
import React, { useMemo } from 'react';
import styles from '../../styles/timeline.module.css';
import { TimelineEvent, events } from '../../data/events';
import EventBox from './EventBox';

interface TimelineGridProps {
 visibleCategories: string[];
}

type MarkerType = {
 type: 'year' | 'month' | 'now';
 label: string | number;
 position: number;
};

const TimelineGrid: React.FC<TimelineGridProps> = ({ visibleCategories }) => {
 const columns = Array.from({ length: 20 }, (_, i) => i);
 const calculateRowCount = (height: number) => Math.ceil(height / 100);
 
 const yearSpacing = 400;
 const monthSpacing = yearSpacing / 12;
 
 const months = [
   'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
 ];

 const filteredEvents = useMemo(() => {
   const hasAll = visibleCategories.includes('all');
   if (hasAll || !visibleCategories.length) return events;
   return events.filter(event => visibleCategories.includes(event.category));
 }, [visibleCategories]);

 const timelineMarkers = useMemo(() => {
   const endDate = new Date();
   const markers: MarkerType[] = [];
   let totalHeight = 5;

   markers.push({
     type: 'year',
     label: 2013,
     position: totalHeight - 5
   });
   
   const currentDate = new Date(2013, 9, 30);
   
   while (currentDate <= endDate) {
     const year = currentDate.getFullYear();
     const month = currentDate.getMonth();
     
     if (month === 0) {
       markers.push({
         type: 'year',
         label: year,
         position: totalHeight - 5
       });
     }
     
     markers.push({
       type: 'month',
       label: months[month],
       position: totalHeight
     });

     const isCurrentMonth = 
       currentDate.getFullYear() === endDate.getFullYear() &&
       currentDate.getMonth() === endDate.getMonth();
       
     if (isCurrentMonth) {
       const daysInMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate();
       const dayProgress = endDate.getDate() / daysInMonth;
       const nowPosition = totalHeight + (monthSpacing * dayProgress);
       
       markers.push({
         type: 'now',
         label: 'Today',
         position: nowPosition
       });
     }
     
     totalHeight += monthSpacing;
     currentDate.setMonth(currentDate.getMonth() + 1);
   }
   
   return markers;
  }, [monthSpacing, months]); 

 const getEventPosition = (eventDate: string) => {
   const date = new Date(eventDate);
   const startDate = new Date(2013, 9, 30);
   const monthsDiff = 
     (date.getFullYear() - startDate.getFullYear()) * 12 + 
     (date.getMonth() - startDate.getMonth());
   
   const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
   const dayOffset = (date.getDate() / daysInMonth) * monthSpacing;
   
   return (monthsDiff * monthSpacing) + dayOffset;
 };

 const assignEventPositions = (events: TimelineEvent[]) => {
   const sortedEvents = [...events].sort((a, b) => 
     new Date(a.date).getTime() - new Date(b.date).getTime()
   );

   const columns: { date: number, position: number }[][] = [];
   const spacingBuffer = 100; // Minimum space between events
   const positions = [];

   for (const event of sortedEvents) {
     const position = getEventPosition(event.date);
     let colIndex = 0;
     let placed = false;

     while (!placed) {
       if (!columns[colIndex]) {
         columns[colIndex] = [];
       }

       const hasOverlap = columns[colIndex].some(existing => 
         Math.abs(existing.position - position) < spacingBuffer
       );
       
       if (!hasOverlap) {
         columns[colIndex].push({ 
           date: new Date(event.date).getTime(), 
           position 
         });
         positions.push({ 
           event,
           position,
           column: colIndex 
         });
         placed = true;
       } else {
         colIndex++;
       }
     }
   }

   return positions;
 };

 const totalHeight = Math.max(
   timelineMarkers[timelineMarkers.length - 1]?.position + monthSpacing + 60 || 0,
   800
 );
 
 const rowCount = calculateRowCount(totalHeight);
 const rows = Array.from({ length: rowCount }, (_, i) => i);

 return (
   <div className={styles.gridWrapper}>
     <div 
       className={styles.grid}
       style={{ minHeight: `${totalHeight}px` }}
     >
       <div className={styles.timeline}>
         <div className={styles.timelineBar} />
         <div className={styles.timelineContent}>
           {timelineMarkers.map((marker, index) => {
             if (marker.type === 'year') {
               return (
                 <div
                   key={`year-${marker.label}-${index}`}
                   className={styles.yearMarker}
                   style={{ top: `${marker.position}px` }}
                 >
                   {marker.label}
                 </div>
               );
             } else if (marker.type === 'now') {
               return (
                 <div
                   key="now-marker"
                   className={styles.nowMarker}
                   style={{ top: `${marker.position}px` }}
                 >
                   {marker.label}
                 </div>
               );
             } else {
               return (
                 <div
                   key={`month-${marker.label}-${index}`}
                   className={styles.monthMarker}
                   style={{ top: `${marker.position}px` }}
                 >
                   {marker.label}
                 </div>
               );
             }
           })}
           
           {assignEventPositions(filteredEvents).map(({ event, position, column }) => (
             <EventBox
               key={event.id}
               event={event}
               position={position}
               column={column}
               timelinePosition={position}
             />
           ))}
           
           <div className={styles.timelineEnd}>
             <div className={styles.timelineArrow}></div>
             <div className={styles.timelineEndText}>
               <em>Time continues...</em>
             </div>
           </div>
         </div>
       </div>
       
       {rows.map((row) => (
         <div key={`row-${row}`} className={styles.row}>
           {columns.map((col) => (
             <div key={`cell-${row}-${col}`} className={styles.cell} />
           ))}
         </div>
       ))}
     </div>
   </div>
 );
};

export default TimelineGrid;