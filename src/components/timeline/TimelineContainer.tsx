// components/timeline/TimelineContainer.tsx
import React from 'react';
import styles from '../../styles/timeline.module.css';
import TimelineGrid from './TimelineGrid';
import { TimelineEvent } from '../../data/events';

interface TimelineContainerProps {
  events: TimelineEvent[];
  selectedCategories: string[];
  isDraggingEnabled: boolean;
  yearSpacing: number;
  onReset: number;
  showEventDates: boolean;
}

const TimelineContainer: React.FC<TimelineContainerProps> = ({ 
  events,
  selectedCategories, 
  isDraggingEnabled,
  yearSpacing,
  onReset,
  showEventDates
}) => {
  return (
    <div className={styles.container}>
      <TimelineGrid 
        events={events}
        visibleCategories={selectedCategories} 
        isDraggingEnabled={isDraggingEnabled}
        yearSpacing={yearSpacing}
        onReset={onReset}
        showEventDates={showEventDates}
      />
    </div>
  );
};

export default TimelineContainer;