import React, { useMemo, useState, useCallback, useEffect } from 'react';
import styles from '../../styles/timeline.module.css';
import { TimelineEvent, events } from '../../data/events';
import EventBox from './EventBox';
import { DEFAULT_YEAR_SPACING } from '../../config/timelineControls';

interface TimelineGridProps {
  visibleCategories: string[];
  isDraggingEnabled: boolean;
  yearSpacing: number;
  onReset: number; // Reset key that changes to trigger reset
}

interface EventPosition {
  event: TimelineEvent;
  position: number;
  column: number;
}

type MarkerType = {
  type: 'year' | 'month' | 'now';
  label: string | number;
  position: number;
};

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
] as const;

const TimelineGrid: React.FC<TimelineGridProps> = ({ 
  visibleCategories, 
  isDraggingEnabled,
  yearSpacing,
  onReset
}) => {
  const [customPositions, setCustomPositions] = useState<Record<string, number>>({});
  const [eventColumns, setEventColumns] = useState<Record<string, number>>({});
  
  // Reset effect
  useEffect(() => {
    setCustomPositions({});
    setEventColumns({});
  }, [onReset]);

  const columns = Array.from({ length: 20 }, (_, i) => i);
  const calculateRowCount = (height: number) => Math.ceil(height / 100);
  
  const monthSpacing = yearSpacing / 12;

  const filteredEvents = useMemo(() => {
    const hasAll = visibleCategories.includes('all');
    if (hasAll || !visibleCategories.length) return events;
    return events.filter(event => visibleCategories.includes(event.category));
  }, [visibleCategories]);

  const timelineMarkers = useMemo(() => {
    const endDate = new Date();
    const markers: MarkerType[] = [];
    let totalHeight = 10;

    // Start from October 2013
    const currentYear = 2013;
    markers.push({
      type: 'year',
      label: currentYear,
      position: totalHeight
    });

    for (let year = 2013; year <= endDate.getFullYear(); year++) {
      const startMonth = year === 2013 ? 9 : 0;
      const endMonth = year === endDate.getFullYear() ? endDate.getMonth() : 11;

      for (let month = startMonth; month <= endMonth; month++) {
        markers.push({
          type: 'month',
          label: MONTHS[month],
          position: totalHeight
        });

        if (month === 0 && year > 2013) {
          markers.push({
            type: 'year',
            label: year,
            position: totalHeight
          });
        }

        if (year === endDate.getFullYear() && month === endDate.getMonth()) {
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const dayProgress = endDate.getDate() / daysInMonth;
          markers.push({
            type: 'now',
            label: 'Today',
            position: totalHeight + (monthSpacing * dayProgress)
          });
        }

        totalHeight += monthSpacing;
      }
    }
    
    return markers;
  }, [monthSpacing]);

  const getEventPosition = useCallback((eventDate: string) => {
    const date = new Date(eventDate);
    const startDate = new Date(2013, 9, 1);
    
    const monthsDiff = 
      (date.getFullYear() - startDate.getFullYear()) * 12 + 
      (date.getMonth() - startDate.getMonth());
    
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const dayOffset = (date.getDate() / daysInMonth) * monthSpacing;
    
    return 10 + (monthsDiff * monthSpacing) + dayOffset;
  }, [monthSpacing]);

  const handleUpdateColumn = useCallback((eventId: string, newColumn: number, position: number) => {
    setEventColumns(prev => ({
      ...prev,
      [eventId]: newColumn
    }));
    
    // Store normalized position relative to default spacing
    const normalizedPosition = (position * DEFAULT_YEAR_SPACING) / yearSpacing;
    setCustomPositions(prev => ({
      ...prev,
      [eventId]: normalizedPosition
    }));
  }, [yearSpacing]);

  const assignEventPositions = useCallback((events: TimelineEvent[]) => {
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const positions: EventPosition[] = [];
    const occupiedSpaces: Record<number, number[]> = {};

    for (const event of sortedEvents) {
      // Scale custom positions relative to the yearSpacing
      const position = customPositions[event.id] 
        ? (customPositions[event.id] * yearSpacing) / DEFAULT_YEAR_SPACING
        : getEventPosition(event.date);
      
      const existingColumn = eventColumns[event.id];
      
      if (existingColumn !== undefined) {
        positions.push({
          event,
          position,
          column: existingColumn
        });
        
        if (!occupiedSpaces[existingColumn]) {
          occupiedSpaces[existingColumn] = [];
        }
        occupiedSpaces[existingColumn].push(position);
      } else {
        let colIndex = 0;
        let placed = false;

        while (!placed) {
          const hasOverlap = occupiedSpaces[colIndex]?.some(existingPos => 
            Math.abs(existingPos - position) < 60
          );
          
          if (!hasOverlap) {
            if (!occupiedSpaces[colIndex]) {
              occupiedSpaces[colIndex] = [];
            }
            occupiedSpaces[colIndex].push(position);
            
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
    }

    return positions;
  }, [customPositions, eventColumns, getEventPosition, yearSpacing]);

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
                    style={{ top: `${marker.position -10}px` }}
                  >
                    {marker.label}
                  </div>
                );
              } else if (marker.type === 'now') {
                return (
                  <div
                    key="now-marker"
                    className={styles.nowMarker}
                    style={{ top: `${marker.position -6}px` }}
                  >
                    {marker.label}
                  </div>
                );
              } else {
                return (
                  <div
                    key={`month-${marker.label}-${index}`}
                    className={styles.monthMarker}
                    style={{ top: `${marker.position -6}px` }}
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
                isDraggingEnabled={isDraggingEnabled}
                onUpdateColumn={handleUpdateColumn}
              />
            ))}
            
            <div className={styles.timelineEnd}>
              <div className={styles.timelineArrow} />
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