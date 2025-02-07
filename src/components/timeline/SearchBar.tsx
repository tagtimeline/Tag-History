// src/components/timeline/SearchBar.tsx
import { useEffect, useState } from 'react';
import { TimelineEvent } from '../../data/events';
import { searchEvents } from '../../config/search';
import { Category, fetchCategories, getCategoryColor } from '../../config/categories';
import searchStyles from '../../styles/search.module.css';

interface SearchBarProps {
  events: TimelineEvent[];
  onResultClick: (event: TimelineEvent) => void;
}

const SearchBar = ({ events, onResultClick }: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<TimelineEvent[]>([]);
  const [categories, setCategories] = useState<Record<string, Category>>({});

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSearchResults(searchEvents(events, value));
  };

  const handleResultClick = (event: TimelineEvent) => {
    onResultClick(event);
    setSearchTerm('');
    setSearchResults([]);
  };

  useEffect(() => {
    const loadCategories = async () => {
      const cats = await fetchCategories();
      setCategories(cats);
    };
    loadCategories();
  }, []);

  return (
    <div className={searchStyles.searchContainer}>
      <input 
        type="text" 
        className={searchStyles.searchInput} 
        placeholder="Search events..." 
        value={searchTerm}
        onChange={handleSearchChange}
      />
      {searchTerm && searchResults.length > 0 && (
        <div className={searchStyles.searchResults}>
          {searchResults.map(event => (
            <div 
              key={event.id} 
              className={searchStyles.resultItem}
              onClick={() => handleResultClick(event)}
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

export default SearchBar;