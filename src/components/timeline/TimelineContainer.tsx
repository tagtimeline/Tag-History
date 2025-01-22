// src/components/timeline/TimelineContainer.tsx
import React from 'react';
import styles from '../../styles/timeline.module.css';
import TimelineGrid from './TimelineGrid';

interface TimelineContainerProps {
  selectedCategories: string[];
}

const TimelineContainer: React.FC<TimelineContainerProps> = ({ selectedCategories }) => {
  return (
    <div className={styles.container}>
      <TimelineGrid visibleCategories={selectedCategories} />
    </div>
  );
};

export default TimelineContainer;