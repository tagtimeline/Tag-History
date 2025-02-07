// components/admin/EventsList.tsx
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { TimelineEvent } from '@/data/events';
import { fetchCategories, getEventStyles, Category } from '@/config/categories';
import { ALL_EVENTS_OPTION } from '@/config/dropdown';
import EventSearch from '@/components/search/EventSearch';

import eventStyles from '@/styles/events.module.css';
import controlStyles from '@/styles/controls.module.css';
import listStyles from '@/styles/admin/events.module.css';
import buttonStyles from '@/styles/admin/buttons.module.css';
import baseStyles from '@/styles/admin/base.module.css';

interface EventsListProps {
  events: TimelineEvent[];
  onEventSelect: (event: TimelineEvent) => void;
}

export default function EventsList({ events, onEventSelect }: EventsListProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([ALL_EVENTS_OPTION.id]);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load categories when component mounts
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await fetchCategories();
        setCategories(cats);
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    
    loadCategories();
  }, []);

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
    <div className={listStyles.eventsList}>
      <div className={baseStyles.header}>
        <div className={baseStyles.title}>Event Management</div>
        <Link href="/admin/event/new">
          <button className={buttonStyles.addButton}>
            Create New Event
          </button>
        </Link>
      </div>
      <div className={baseStyles.title}>Existing Events</div>
      
      <div className={listStyles.eventsControls}>
        <div className={controlStyles.dropdown} ref={dropdownRef}>
          <div 
            className={controlStyles.dropdownHeader}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className={controlStyles.label}>
              {isLoadingCategories ? 'Loading categories...' : 'Categories...'}
            </span>
          </div>
          {isDropdownOpen && !isLoadingCategories && (
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

        <EventSearch/>

        <div className={listStyles.sortButtonContainer}>
          <button
            className={`${controlStyles.button} ${listStyles.sortButton}`}
            onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
          >
            {sortDirection === 'asc' ? '↑' : '↓'} Date
          </button>
        </div>
      </div>
      
      <div className={listStyles.eventsGrid}>
        {filteredEvents.map((event) => {
          const eventStyle = {
            ...getEventStyles(event.category),
            borderLeft: `3px solid ${categories[event.category]?.color || '#555'}`
          };
          
          return (
            <div 
              key={event.id}
              data-event-id={event.id}
              className={listStyles.eventItem}
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