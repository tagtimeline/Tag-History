// components/admin/EventForm.tsx
import React, { useState, useEffect } from 'react';
import { createEvent, updateEvent, deleteEvent } from '../../../lib/eventUtils';
import { categories } from '@/config/categories';
import { TimelineEvent, Table } from '@/data/events';
import TableManager from './TableManager';
import styles from '@/styles/admin.module.css';

interface SideEvent {
  id: string;
  title: string;
  description: string;
}

interface EventFormData {
  title: string;
  date: string;
  endDate?: string;
  category: keyof typeof categories | '';
  description: string;
  isSpecial: boolean;
  tags: string[];
  sideEvents: SideEvent[];
  tables: Table[];
}

interface EventFormProps {
  selectedEvent: TimelineEvent | null;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onDelete: (id: string) => void;
}

const initialFormData: EventFormData = {
  title: '',
  date: '',
  endDate: '',
  category: '',
  description: '',
  isSpecial: false,
  tags: [],
  sideEvents: [],
  tables: []
};

export const EventForm: React.FC<EventFormProps> = ({
  selectedEvent,
  onDelete
}) => {
  const [formData, setFormData] = useState<EventFormData>(
    selectedEvent
      ? {
          title: selectedEvent.title,
          date: selectedEvent.date,
          endDate: selectedEvent.endDate || '',
          category: selectedEvent.category,
          description: selectedEvent.description,
          isSpecial: selectedEvent.isSpecial || false,
          tags: selectedEvent.tags || [],
          sideEvents: selectedEvent.sideEvents || [],
          tables: selectedEvent.tables || []
        }
      : initialFormData
  );

  const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let successTimeout: ReturnType<typeof setTimeout> | null = null;
    let errorTimeout: ReturnType<typeof setTimeout> | null = null;

    if (successMessage) {
      successTimeout = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    }

    if (errorMessage) {
      errorTimeout = setTimeout(() => {
        setErrorMessage('');
      }, 5000);
    }

    return () => {
      if (successTimeout) clearTimeout(successTimeout);
      if (errorTimeout) clearTimeout(errorTimeout);
    };
  }, [successMessage, errorMessage]);


  const handleSideEventChange = (index: number, field: keyof SideEvent, value: string) => {
    const newSideEvents = [...formData.sideEvents];
    if (!newSideEvents[index]) {
      newSideEvents[index] = { id: `side${Date.now()}`, title: '', description: '' };
    }
    newSideEvents[index] = { ...newSideEvents[index], [field]: value };
    setFormData({ ...formData, sideEvents: newSideEvents });
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        await deleteEvent(selectedEvent.id);
        setSuccessMessage('Event deleted successfully!');
        onDelete(selectedEvent!.id);
      } catch (error) {
        console.error('Error deleting event:', error);
        setErrorMessage('Failed to delete event. Please try again.');
      }
    }
  };

  const handleDuplicateEvent = async () => {
    try {
      const duplicateData = {
        ...formData,
        title: `${formData.title} Copy`,
      };
  
      await createEvent(duplicateData);
      setSuccessMessage('Event duplicated successfully!');
    } catch (error) {
      console.error('Error duplicating event:', error);
      setErrorMessage('Failed to duplicate event. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);

    try {
      if (!formData.category) {
        setErrorMessage('Please select a category');
        return;
      }

      if (!formData.tags.length) {
        setErrorMessage('Please add at least one tag');
        return;
      }

      const cleanData = {
        title: formData.title.trim(),
        date: formData.date,
        ...(formData.endDate?.trim() ? { endDate: formData.endDate.trim() } : {}),
        category: formData.category,
        description: formData.description.trim(),
        isSpecial: formData.isSpecial,
        tags: formData.tags.filter(tag => tag.trim() !== ''),
        sideEvents: formData.sideEvents
          .filter(event => event.title.trim() || event.description.trim())
          .map(event => ({
            id: event.id,
            title: event.title.trim(),
            description: event.description.trim()
          })),
        tables: formData.tables
      };

      console.log('Cleaned data before save:', cleanData);

      if (selectedEvent) {
        console.log('Updating event with ID:', selectedEvent.id);
        await updateEvent(selectedEvent.id, cleanData);
        setSuccessMessage('Event updated successfully!');
      } else {
        console.log('Creating new event');
        await createEvent(cleanData);
        setSuccessMessage('Event added successfully!');
      }

      setFormData(initialFormData);
    } catch (error) {
      console.error('Error saving event:', error);
      setErrorMessage('Failed to save event. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
        {successMessage && (
            <div className={styles.successMessage}>
                <span className={styles.successText}>{successMessage}</span>
            </div>
            )}

            {errorMessage && (
            <div className={styles.errorMessage}>
                <span className={styles.errorText}>{errorMessage}</span>
            </div>
            )}
      {/* Title and Special Status */}
      <div className={`${styles.formSection} ${styles['full-width']} ${styles['title-row']}`}>
        <div className={styles['input-container']}>
          <label htmlFor="title">Event Title</label>
          <input
            id="title"
            type="text"
            className={styles.input}
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
          />
        </div>
        <div className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={formData.isSpecial}
            onChange={(e) => setFormData({...formData, isSpecial: e.target.checked})}
          />
          Special Event
        </div>
      </div>

      {/* Dates */}
      <div className={`${styles.dateGroup} ${styles['full-width']}`}>
        <div className={styles.formSection}>
          <label htmlFor="startDate">Start Date</label>
          <input
            id="startDate"
            type="date"
            className={styles.input}
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            required
          />
        </div>
        <div className={styles.formSection}>
          <label htmlFor="endDate">End Date (Optional)</label>
          <input
            id="endDate"
            type="date"
            className={styles.input}
            value={formData.endDate}
            onChange={(e) => setFormData({...formData, endDate: e.target.value})}
          />
        </div>
      </div>

      {/* Category */}
      <div className={styles.formSection}>
        <label htmlFor="category">Category</label>
        <select
          id="category"
          className={styles.input}
          value={formData.category}
          onChange={(e) => setFormData({...formData, category: e.target.value as keyof typeof categories})}
          required
        >
          <option value="" disabled>Select Category</option>
          {Object.keys(categories).map((category) => (
            <option key={category} value={category}>
              {categories[category as keyof typeof categories].name}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div className={`${styles.formSection} ${styles['full-width']}`}>
        <label htmlFor="description">Description (Markdown supported)</label>
        <textarea
          id="description"
          className={styles.textarea}
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          required
        />
      </div>

      {/* Tags */}
      <div className={`${styles.formSection} ${styles['full-width']}`}>
        <label htmlFor="tags">Tags (comma-separated)</label>
        <input
          id="tags"
          type="text"
          className={styles.input}
          value={formData.tags.join(', ')}
          onChange={(e) => setFormData({...formData, tags: e.target.value.split(',').map(tag => tag.trim())})}
          placeholder="tag1, tag2, tag3"
          required
        />
      </div>

      {/* Side Events */}
      <div className={styles.sideEvents}>
        <div className={styles.sideEventsHeader}>
          Side Events
          <button 
            type="button"
            onClick={() => setFormData({
              ...formData,
              sideEvents: [
                ...formData.sideEvents,
                { id: `side${Date.now()}`, title: '', description: '' }
              ]
            })}
            className={styles.addButton}
          >
            Add Side Event
          </button>
        </div>

        {formData.sideEvents.map((sideEvent, index) => (
          <div key={sideEvent.id} className={styles.sideEventGroup}>
            <input
              type="text"
              className={styles.input}
              placeholder="Side Event Title"
              value={sideEvent.title}
              onChange={(e) => handleSideEventChange(index, 'title', e.target.value)}
            />
            <textarea
              className={styles.textarea}
              placeholder="Side Event Description"
              value={sideEvent.description}
              onChange={(e) => handleSideEventChange(index, 'description', e.target.value)}
            />
            <button 
            type="button"
            onClick={() => {
                if (window.confirm('Are you sure you want to remove this side event?')) {
                const newSideEvents = [...formData.sideEvents];
                newSideEvents.splice(index, 1);
                setFormData({ ...formData, sideEvents: newSideEvents });
                }
            }}
            className={styles.removeButton}
            >
            Remove Side Event
            </button>
          </div>
        ))}
      </div>

      {/* Tables */}
      <TableManager 
        tables={formData.tables}
        onChange={(tables) => setFormData({ ...formData, tables })}
      />

    {/* Event Controls */}
    <div className={`${styles.buttonGroup} ${styles.alignRight}`}>
    <button type="submit" className={styles.submitButton}>
        {selectedEvent ? 'Update Event' : 'Add Event'}
    </button>
    {selectedEvent ? (
        <>
        <button 
            type="button" 
            onClick={handleDuplicateEvent}
            className={styles.duplicateButton}
        >
            Duplicate Event
        </button>
        <button 
            type="button" 
            onClick={handleDeleteEvent} 
            className={styles.deleteButton}
        >
            Delete Event
        </button>
        </>
    ) : (
        <>
        <button 
            type="button" 
            onClick={() => setFormData(initialFormData)} 
            className={styles.clearButton}
        >
            Clear Event
        </button>
        </>
    )}
    </div>
    </form>
  );
}

