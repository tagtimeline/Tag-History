// src/config/search.ts
import { TimelineEvent } from '../data/events';

export const searchEvents = (events: TimelineEvent[], searchTerm: string): TimelineEvent[] => {
  if (!searchTerm.trim()) return events;
  
  const normalizedSearch = searchTerm.toLowerCase().trim();
  
  return events.filter(event => {
    const matchesTitle = event.title.toLowerCase().includes(normalizedSearch);
    const matchesTags = event.tags.some(tag => tag.toLowerCase().includes(normalizedSearch));
    const matchesCategory = event.category.toLowerCase().includes(normalizedSearch);
    
    return matchesTitle || matchesTags || matchesCategory;
  });
};