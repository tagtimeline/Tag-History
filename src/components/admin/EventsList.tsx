// components/admin/EventsList.tsx
import { useState, useRef, useEffect } from 'react';
import { TimelineEvent } from '@/data/events';
import { categories, getEventStyles, getCategoryColor } from '@/config/categories';
import { ALL_EVENTS_OPTION } from '@/config/dropdown';
import { searchEvents } from '@/config/search';
import styles from '@/styles/admin.module.css';
import eventStyles from '@/styles/events.module.css';
import controlStyles from '@/styles/controls.module.css';
import searchStyles from '@/styles/search.module.css';

interface EventsListProps {
  events: TimelineEvent[];
  onEventSelect: (event: TimelineEvent) => void;
}

export default function EventsList({ events, onEventSelect }: EventsListProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([ALL_EVENTS_OPTION.id]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<TimelineEvent[]>([]);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allCategories = [ALL_EVENTS_OPTION, ...Object.values(categories)];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (categoryId === ALL_EVENTS_OPTION.id) {
        return [ALL_EVENTS_OPTION.id];
      }
      
      if (prev.includes(ALL_EVENTS_OPTION.id)) {
        return [categoryId];
      }
      
      const newCategories = prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId];
        
      return newCategories.length === 0 ? [ALL_EVENTS_OPTION.id] : newCategories;
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSearchResults(searchEvents(events, value));
  };

  const filteredEvents = events
    .filter(event => 
      selectedCategories.includes(ALL_EVENTS_OPTION.id) || 
      selectedCategories.includes(event.category)
    )
    .sort((a, b) => {
      const comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return (
        <div className={styles.eventsList}>
          <div className={styles.title}>Existing Events</div>
          
          <div className={styles.eventsControls}>
            {/* Category Dropdown */}
            <div className={controlStyles.dropdown} ref={dropdownRef}>
              <div 
                className={controlStyles.dropdownHeader}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span className={controlStyles.label}>Categories...</span>
              </div>
              {isDropdownOpen && (
                <ul className={controlStyles.dropdownMenu}>
                  {allCategories.map((category) => (
                    <li 
                      key={category.id}
                      className={`${controlStyles.dropdownItem} ${
                        selectedCategories.includes(category.id) ? controlStyles.selected : ''
                      }`}
                      onClick={() => handleCategorySelect(category.id)}
                    >
                      <span 
                        className={controlStyles.categoryColor} 
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
      
            {/* Search Box */}
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
                      onClick={() => {
                        onEventSelect(event);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        setSearchTerm('');
                        setSearchResults([]);
                      }}
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
      
            {/* Sort Direction Toggle */}
            <div className={styles.sortButtonContainer}>
                <button
                    className={`${controlStyles.button} ${styles.sortButton}`}
                    onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                >
                    {sortDirection === 'asc' ? '↑' : '↓'} Date
                </button>
            </div>
          </div>
          
          <div className={styles.eventsGrid}>
            {filteredEvents.map((event) => {
              const eventStyle = {
                ...getEventStyles(event.category),
                borderLeft: `3px solid ${categories[event.category]?.color || '#555'}`
              };
              
              return (
                <div 
                  key={event.id} 
                  className={styles.eventItem}
                  onClick={() => {
                    onEventSelect(event);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={eventStyle}
                >
                  <div className={eventStyles.eventContent}>
                    <h3 className={eventStyles.eventTitle}>
                      {event.isSpecial && <span className={eventStyles.specialStar}>⭐</span>}
                      {event.title}
                    </h3>
                    <div className={eventStyles.eventDate}>
                      {new Date(event.date).toLocaleDateString()}
                      {event.endDate && ` - ${new Date(event.endDate).toLocaleDateString()}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
}