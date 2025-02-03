// components/admin/EventForm.tsx
import { useState } from 'react';
import { createEvent, updateEvent } from '../../../lib/eventUtils';
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

export default function EventForm({ selectedEvent, onSuccess, onError }: EventFormProps) {
  const [formData, setFormData] = useState<EventFormData>(
    selectedEvent ? {
      title: selectedEvent.title,
      date: selectedEvent.date,
      endDate: selectedEvent.endDate || '',
      category: selectedEvent.category,
      description: selectedEvent.description,
      isSpecial: selectedEvent.isSpecial || false,
      tags: selectedEvent.tags || [],
      sideEvents: selectedEvent.sideEvents || [],
      tables: selectedEvent.tables || []
    } : initialFormData
  );

  const handleSideEventChange = (index: number, field: keyof SideEvent, value: string) => {
    const newSideEvents = [...formData.sideEvents];
    if (!newSideEvents[index]) {
      newSideEvents[index] = { id: `side${Date.now()}`, title: '', description: '' };
    }
    newSideEvents[index] = { ...newSideEvents[index], [field]: value };
    setFormData({ ...formData, sideEvents: newSideEvents });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData); 

    try {
      if (!formData.category) {
        onError('Please select a category');
        return;
      }

      if (!formData.tags.length) {
        onError('Please add at least one tag');
        return;
      }

      const cleanData = {
        title: formData.title.trim(),
        date: formData.date,
        // Only include endDate if it has a value
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
        onSuccess('Event updated successfully!');
      } else {
        console.log('Creating new event');
        await createEvent(cleanData);
        onSuccess('Event added successfully!');
      }

      setFormData(initialFormData);
    } catch (error) {
      console.error('Error saving event:', error);
      onError('Failed to save event. Please try again.');
    }
};

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
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
                const newSideEvents = [...formData.sideEvents];
                newSideEvents.splice(index, 1);
                setFormData({ ...formData, sideEvents: newSideEvents });
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

      <button type="submit" className={styles.submitButton}>
        {selectedEvent ? 'Update Event' : 'Add Event'}
      </button>
    </form>
  );
}