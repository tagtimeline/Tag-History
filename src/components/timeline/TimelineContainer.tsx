// components/timeline/TimelineContainer.tsx
import React from "react";
import styles from "../../styles/timeline.module.css";
import TimelineGrid from "./TimelineGrid";
import { TimelineEvent } from "../../data/events";

interface TimelineContainerProps {
  events: TimelineEvent[];
  selectedCategories: string[];
  isDraggingEnabled: boolean;
  yearSpacing: number;
  onReset: number;
  showEventDates: boolean;
  isPreview?: boolean;
}

const TimelineContainer: React.FC<TimelineContainerProps> = ({
  events,
  selectedCategories,
  isDraggingEnabled,
  yearSpacing,
  onReset,
  showEventDates,
  isPreview = false,
}) => {
  return (
    <div className={`${styles.container} ${isPreview ? styles.preview : ""}`}>
      <TimelineGrid
        events={events}
        visibleCategories={selectedCategories}
        isDraggingEnabled={isDraggingEnabled}
        yearSpacing={yearSpacing}
        onReset={onReset}
        showEventDates={showEventDates}
        isPreview={isPreview}
      />
    </div>
  );
};

export default TimelineContainer;
