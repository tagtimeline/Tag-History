// src/config/timelineControls.ts
export const EVENT_CARD_WIDTH = 200;
export const GRID_COLUMN_WIDTH = EVENT_CARD_WIDTH + 20;

export const DEFAULT_YEAR_SPACING = 600;
export const MIN_YEAR_SPACING = 200;
export const MAX_YEAR_SPACING = 1800;
export const ZOOM_STEP = 100;

export interface TimelineState {
  yearSpacing: number;
  selectedCategories: string[];
}

export const zoomIn = (currentSpacing: number): number => {
  const newSpacing = currentSpacing + ZOOM_STEP;
  return Math.min(newSpacing, MAX_YEAR_SPACING);
};

export const zoomOut = (currentSpacing: number): number => {
  const newSpacing = currentSpacing - ZOOM_STEP;
  return Math.max(newSpacing, MIN_YEAR_SPACING);
};

export const getDefaultTimelineState = (): TimelineState => ({
  yearSpacing: DEFAULT_YEAR_SPACING,
  selectedCategories: ['all']
});