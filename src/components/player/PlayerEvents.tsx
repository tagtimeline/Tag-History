// src/components/player/PlayerSearch.tsx
import React from 'react';
import { TimelineEvent } from '../../data/events';
import { getCategoryColor } from '../../config/categories';
import searchStyles from '../../styles/search.module.css';

interface PlayerEventsProps {
  searchTerm: string;
  searchResults: TimelineEvent[];
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEventSelect: (event: TimelineEvent) => void;
}

const PlayerEvents: React.FC<PlayerEventsProps> = ({
  searchTerm,
  searchResults,
  onSearchChange,
  onEventSelect
}) => {
  return (
    <div className={searchStyles.searchContainer}>
      <input 
        type="text" 
        className={searchStyles.searchInput} 
        placeholder="Search events..." 
        value={searchTerm}
        onChange={onSearchChange}
      />
      {searchTerm && searchResults.length > 0 && (
        <div className={searchStyles.searchResults}>
          {searchResults.map(event => (
            <div 
              key={event.id} 
              className={searchStyles.resultItem}
              onClick={() => onEventSelect(event)}
            >
              <span 
                className={searchStyles.categoryColor}
                style={{ backgroundColor: getCategoryColor(event.category) }}
              />
              <div>
                <div className={searchStyles.resultTitle}>{event.title}</div>
                <div className={searchStyles.eventDate}>
                  {new Date(event.date).toLocaleDateString()}
                  {event.endDate && ` - ${new Date(event.endDate).toLocaleDateString()}`}
                  {event.isSpecial && <span className={searchStyles.specialStar}>⭐</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {searchTerm && searchResults.length === 0 && (
        <div className={searchStyles.searchResults}>
          <div className={searchStyles.noResults}>
            No events found
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerEvents;