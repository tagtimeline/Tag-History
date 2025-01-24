import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import TimelineContainer from '../components/timeline/TimelineContainer'
import SettingsPopup from '../components/timeline/SettingsPopup'
import controlStyles from '../styles/controls.module.css'
import headerStyles from '../styles/header.module.css'
import searchStyles from '../styles/search.module.css'
import { useState, useMemo, useEffect, useRef } from 'react'
import withAuth from '../components/auth/withAuth'
import { getAllCategories, getCategoryColor } from '../config/categories'
import { ALL_EVENTS_OPTION } from '../config/dropdown'
import { events, TimelineEvent } from '../data/events'
import { searchEvents } from '../config/search'
import { zoomIn, zoomOut, DEFAULT_YEAR_SPACING, getDefaultTimelineState } from '../config/timelineControls'

const TimelinePage: NextPage = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([ALL_EVENTS_OPTION.id]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<TimelineEvent[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [timelineOrder, setTimelineOrder] = useState<'ascending' | 'descending'>('ascending');
  const [yearSpacing, setYearSpacing] = useState(DEFAULT_YEAR_SPACING);
  const [isDraggingEnabled, setIsDraggingEnabled] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allCategories = useMemo(() => [
    ALL_EVENTS_OPTION,
    ...getAllCategories()
  ], []);

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

  const handleResultClick = (event: TimelineEvent) => {
    const targetEvent = event;
    const eventElement = document.querySelector(`[data-event-id="${targetEvent.id}"]`);
    
    if (eventElement) {
      eventElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (eventElement as HTMLElement).click();
    }
    
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleZoomIn = () => {
    setYearSpacing(current => zoomIn(current));
  };

  const handleZoomOut = () => {
    setYearSpacing(current => zoomOut(current));
  };

  const handleReset = () => {
    const defaultState = getDefaultTimelineState();
    setYearSpacing(defaultState.yearSpacing);
    setSelectedCategories(defaultState.selectedCategories);
    setResetKey(prev => prev + 1); // Increment reset key to trigger reset in TimelineGrid
  };

  return (
    <>
      <Head>
        <title>Timeline - TNT Tag History</title>
        <meta name="description" content="Browse through the history of TNT Tag on Hypixel" />
      </Head>
      
      <Header>
        <div className={controlStyles.headerControls}>
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
                      <div className={searchStyles.resultDate}>
                        {new Date(event.date).toLocaleDateString()}
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

          <Link href="/info">
            <button className={controlStyles.infoButton}>Info</button>
          </Link>
        </div>
      </Header>

      <div className={headerStyles['info-box']}>Version: Beta 1.0</div>

      <main>
        <div className={controlStyles.controls}>
          <button className={controlStyles.zoomIn} onClick={handleZoomIn}>+</button>
          <button className={controlStyles.zoomOut} onClick={handleZoomOut}>-</button>
          <button className={controlStyles.resetTimeline} onClick={handleReset}>r</button>
          <button 
            className={controlStyles.settingsButton}
            onClick={() => setIsSettingsOpen(true)}
          >s</button>
        </div>
        
        {isSettingsOpen && (
          <SettingsPopup 
            onClose={() => setIsSettingsOpen(false)}
            isDraggingEnabled={isDraggingEnabled}
            onDraggingToggle={setIsDraggingEnabled}
          />
        )}

        <TimelineContainer 
          selectedCategories={selectedCategories} 
          isDraggingEnabled={isDraggingEnabled}
          yearSpacing={yearSpacing}
          onReset={resetKey}
        />
      </main>

      <Footer />
    </>
  );
};

export default withAuth(TimelinePage);