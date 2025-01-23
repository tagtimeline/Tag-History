// src/config/timeline-controls.ts
export interface TimelineState {
  yearSpacing: number;
  eventPositions: Record<string, number>;
}

const DEFAULT_YEAR_SPACING = 600;
const MIN_YEAR_SPACING = 300;
const MAX_YEAR_SPACING = 1200;
const ZOOM_STEP = 100;

export const DEFAULT_TIMELINE_STATE: TimelineState = {
  yearSpacing: DEFAULT_YEAR_SPACING,
  eventPositions: {}
};

export const zoomIn = (currentSpacing: number): number => 
  Math.min(currentSpacing + ZOOM_STEP, MAX_YEAR_SPACING);

export const zoomOut = (currentSpacing: number): number => 
  Math.max(currentSpacing - ZOOM_STEP, MIN_YEAR_SPACING);