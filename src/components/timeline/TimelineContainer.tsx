import React from 'react';
import styles from '../../styles/timeline.module.css';
import TimelineGrid from './TimelineGrid';

interface TimelineContainerProps {
  selectedCategories: string[];
  isDraggingEnabled: boolean;
  yearSpacing: number;
  onReset: number;
}

const TimelineContainer: React.FC<TimelineContainerProps> = ({ 
  selectedCategories, 
  isDraggingEnabled,
  yearSpacing,
  onReset
}) => {
  return (
    <div className={styles.container}>
      <TimelineGrid 
        visibleCategories={selectedCategories} 
        isDraggingEnabled={isDraggingEnabled}
        yearSpacing={yearSpacing}
        onReset={onReset}
      />
    </div>
  );
};

export default TimelineContainer;