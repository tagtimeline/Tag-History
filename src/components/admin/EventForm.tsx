// components/admin/EventForm.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { createEvent, updateEvent, deleteEvent } from '../../../lib/eventUtils';
import { fetchCategories, type Category } from '@/config/categories';
import { TimelineEvent, Table } from '@/data/events';
import TableManager from './TableManager';
import PlayerSelector from './PlayerSelector';
import MarkdownGuidePopup from './MarkdownGuidePopup';
import {
  saveDraft,
  loadDraft,
  deleteDraft,
  hasDraft,
  isMacPlatform,
  getSaveShortcutText
} from '@/../lib/draftUtils';

import baseStyles from '@/styles/admin/base.module.css';
import buttonStyles from '@/styles/admin/buttons.module.css';
import formStyles from '@/styles/admin/forms.module.css';

interface SideEvent {
  id: string;
  title: string;
  description: string;
}

interface Player {
  id: string;
  currentIgn: string;
  uuid: string;
}

interface CellPosition {
  tableIndex: number;
  rowIndex: number;
  columnIndex: number;
}

export interface EventFormData {
  title: string;
  date: string;
  endDate?: string;
  category: string;
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
  onChange: (data: EventFormData) => void;
  formData: EventFormData;
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
  onSuccess,
  onError,
  onDelete,
  onChange,
  formData
}) => {
  const [showMarkdownGuide, setShowMarkdownGuide] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDraftMessage, setShowDraftMessage] = useState(false);
  const [hasDraftState, setHasDraftState] = useState(false);
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const [showPlayerSelector, setShowPlayerSelector] = useState(false);
  const [currentField, setCurrentField] = useState<string>('');
  const [currentCellPosition, setCurrentCellPosition] = useState<CellPosition | null>(null);


  const insertPlayerTag = (
    fieldName: 'description' | 'sideEvents' | 'tables', 
    index?: number,
    rowIndex?: number,
    columnIndex?: number
  ) => {
    if (fieldName === 'tables' && typeof index === 'number' && 
        typeof rowIndex === 'number' && typeof columnIndex === 'number') {
      setCurrentCellPosition({ 
        tableIndex: index, 
        rowIndex, 
        columnIndex 
      });
    } else {
      setCurrentCellPosition(null);
      const fieldId = fieldName === 'description' ? 'description' :
                     fieldName === 'sideEvents' ? `sideEvent-${index}` :
                     `table-${index}`;
      setCurrentField(fieldId);
    }
    setShowPlayerSelector(true);
  };

  // Load categories when component mounts
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await fetchCategories();  // Here's the fix - use fetchCategories()
        setCategories(cats);
        setIsLoadingCategories(false);
      } catch (error) {
        console.error('Error loading categories:', error);
        setErrorMessage('Failed to load categories');
        setIsLoadingCategories(false);
      }
    };
    
    loadCategories();
  }, []);

  // Auto-save without showing message
  const saveDraftQuietly = (data: EventFormData) => {
    saveDraft(data, selectedEvent?.id);
  };

  // Save with message (for keyboard shortcut)
  const saveDraftWithMessage = useCallback((data: EventFormData) => {
    saveDraft(data, selectedEvent?.id);
    setShowDraftMessage(true);
    setTimeout(() => setShowDraftMessage(false), 2000);
  }, [selectedEvent?.id]);

  // Check for existing draft on mount
  useEffect(() => {
    setHasDraftState(hasDraft(selectedEvent?.id));
  }, [selectedEvent?.id]);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((isMacPlatform() && e.metaKey && e.key === 's') || 
          (!isMacPlatform() && e.ctrlKey && e.key === 's')) {
        e.preventDefault();
        saveDraftWithMessage(formData);
      }
    };
  
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData, saveDraftWithMessage]);

  const autoResizeTextArea = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
  
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleFormChange = (newData: EventFormData) => {
    setIsDirty(true);
    onChange(newData);
    saveDraftQuietly(newData);
  };

  const handleSideEventChange = (index: number, field: keyof SideEvent, value: string) => {
    const newSideEvents = [...formData.sideEvents];
    if (!newSideEvents[index]) {
      newSideEvents[index] = { id: `side${Date.now()}`, title: '', description: '' };
    }
    newSideEvents[index] = { ...newSideEvents[index], [field]: value };
    handleFormChange({ ...formData, sideEvents: newSideEvents });
  };

  const handleTablesChange = (tables: Table[], updatedDescription?: string) => {
    handleFormChange({ 
      ...formData, 
      tables,
      ...(updatedDescription ? { description: updatedDescription } : {})
    });
    setIsDirty(true);
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        await deleteEvent(selectedEvent.id);
        onSuccess('Event deleted successfully!');
        onDelete(selectedEvent.id);
        deleteDraft(selectedEvent.id);
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
      onSuccess('Event duplicated successfully!');
    } catch (error) {
      console.error('Error duplicating event:', error);
      setErrorMessage('Failed to duplicate event. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
  
      if (selectedEvent) {
        await updateEvent(selectedEvent.id, cleanData);
        setShowSuccessMessage(true);
        setIsDirty(false);
        deleteDraft(selectedEvent.id);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } else {
        await createEvent(cleanData);
        onSuccess('Event added successfully!');
        deleteDraft();
        onChange(initialFormData);
      }
    } catch (error) {
      console.error('Error saving event:', error);
      setErrorMessage('Failed to save event. Please try again.');
      onError('Failed to save event. Please try again.');
    }
  };
  

  // In the EventForm component return statement:

  return (
    <form onSubmit={handleSubmit} className={formStyles.form}>
      {hasDraftState && (
        <div className={baseStyles.draftMessage}>
          <span>You have an unsaved draft.</span>
          <button
            type="button"
            onClick={() => {
              const draft = loadDraft(selectedEvent?.id);
              if (draft) {
                onChange(draft);
                setHasDraftState(false);
              }
            }}
            className={baseStyles.loadDraftButton}
          >
            Load Draft
          </button>
          <button
            type="button"
            onClick={() => {
              deleteDraft(selectedEvent?.id);
              setHasDraftState(false);
            }}
            className={baseStyles.discardDraftButton}
          >
            Discard Draft
          </button>
        </div>
      )}

      {showDraftMessage && (
        <div className={baseStyles.saveMessage}>
          <span className={baseStyles.saveText}>
            Draft saved ({getSaveShortcutText()} to save)
          </span>
        </div>
      )}

      {showSuccessMessage && (
        <div className={baseStyles.successMessage}>
          <span className={baseStyles.successText}>Event updated successfully!</span>
        </div>
      )}

      {errorMessage && (
        <div className={baseStyles.errorMessage}>
          <span className={baseStyles.errorText}>{errorMessage}</span>
        </div>
      )}

      <div className={`${formStyles.formSection} ${formStyles.fullWidth} ${formStyles.titleRow}`}>
        <div className={formStyles.inputContainer}>
          <label htmlFor="title">Event Title</label>
          <input
            id="title"
            type="text"
            className={formStyles.input}
            value={formData.title}
            onChange={(e) => handleFormChange({ ...formData, title: e.target.value })}
            required
          />
        </div>
        <div className={formStyles.checkboxLabel}>
          <input
            type="checkbox"
            checked={formData.isSpecial}
            onChange={(e) => onChange({ ...formData, isSpecial: e.target.checked })}
          />
          Special Event
        </div>
      </div>

      <div className={`${formStyles.dateGroup} ${formStyles.fullWidth}`}>
        <div className={formStyles.formSection}>
          <label htmlFor="startDate">Start Date</label>
          <input
            id="startDate"
            type="date"
            className={formStyles.input}
            value={formData.date}
            onChange={(e) => onChange({ ...formData, date: e.target.value })}
            required
          />
        </div>
        <div className={formStyles.formSection}>
          <label htmlFor="endDate">End Date (Optional)</label>
          <input
            id="endDate"
            type="date"
            className={formStyles.input}
            value={formData.endDate}
            onChange={(e) => onChange({ ...formData, endDate: e.target.value })}
          />
        </div>
      </div>

      <div className={formStyles.formSection}>
        <label htmlFor="category">Category</label>
        <select
          id="category"
          className={formStyles.input}
          value={formData.category}
          onChange={(e) => onChange({ ...formData, category: e.target.value })}
          required
          disabled={isLoadingCategories}
        >
          <option value="" disabled>
            {isLoadingCategories ? 'Loading categories...' : 'Select Category'}
          </option>
          {Object.entries(categories).map(([id, category]) => (
            <option key={id} value={id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className={`${formStyles.formSection} ${formStyles.fullWidth}`}>
        <div className={formStyles.labelWithButton}>
          <label htmlFor="description">
            Description
            <button 
              type="button"
              onClick={() => setShowMarkdownGuide(true)}
              className={buttonStyles.markdownInfoButton}
            >
              (Markdown Info)
            </button>
          </label>
          <button
            type="button"
            onClick={() => insertPlayerTag('description')}
            className={buttonStyles.addPlayerButton}
          >
            Add Player
          </button>
        </div>
        <textarea
          id="description"
          className={formStyles.textarea}
          value={formData.description}
          onChange={(e) => {
            onChange({ ...formData, description: e.target.value });
            autoResizeTextArea(e.target);
          }}
          onInput={(e) => autoResizeTextArea(e.target as HTMLTextAreaElement)}
          ref={(ref) => {
            if (ref) autoResizeTextArea(ref);
          }}
          required
        />
        {showMarkdownGuide && (
          <MarkdownGuidePopup onClose={() => setShowMarkdownGuide(false)} />
        )}
      </div>

      <div className={`${formStyles.formSection} ${formStyles.fullWidth}`}>
        <label htmlFor="tags">Tags (comma-separated)</label>
        <input
          id="tags"
          type="text"
          className={formStyles.input}
          value={formData.tags.join(', ')}
          onChange={(e) => onChange({ ...formData, tags: e.target.value.split(',').map(tag => tag.trim()) })}
          placeholder="tag1, tag2, tag3"
          required
        />
      </div>

      <div className={formStyles.sideEvents}>
        <div className={formStyles.sideEventsHeader}>
          Side Events
          <button 
            type="button"
            onClick={() => onChange({
              ...formData,
              sideEvents: [
                ...formData.sideEvents,
                { id: `side${Date.now()}`, title: '', description: '' }
              ]
            })}
            className={buttonStyles.addButton}
          >
            Add Side Event
          </button>
        </div>

        {formData.sideEvents.map((sideEvent, index) => (
          <div key={sideEvent.id} className={formStyles.sideEventGroup}>
            <div className={formStyles.labelWithButton}>
              <div>Side {index}</div>
              <button
                type="button"
                onClick={() => insertPlayerTag('sideEvents', index)}
                className={buttonStyles.addPlayerButton}
              >
                Add Player
              </button>
            </div>
            <input
              type="text"
              className={formStyles.input}
              placeholder="Side Event Title"
              value={sideEvent.title}
              onChange={(e) => handleSideEventChange(index, 'title', e.target.value)}
            />
            <textarea
              id={`sideEvent-${index}`}
              className={formStyles.textarea}
              placeholder="Side Event Description"
              value={sideEvent.description}
              onChange={(e) => {
                handleSideEventChange(index, 'description', e.target.value);
                autoResizeTextArea(e.target);
              }}
              onInput={(e) => autoResizeTextArea(e.target as HTMLTextAreaElement)}
              ref={(ref) => {
                if (ref) autoResizeTextArea(ref);
              }}
            />
            <button 
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to remove this side event?')) {
                  const newSideEvents = [...formData.sideEvents];
                  newSideEvents.splice(index, 1);
                  onChange({ ...formData, sideEvents: newSideEvents });
                }
              }}
              className={buttonStyles.removeButton}
            >
              Remove Side Event
            </button>
          </div>
        ))}
      </div>

      <TableManager 
        tables={formData.tables}
        currentDescription={formData.description}
        onChange={handleTablesChange}
        onAddPlayer={(tableIndex) => {
          // Find the last edited cell in the table and use those coordinates
          const table = formData.tables[tableIndex];
          const lastRowIndex = table.rows.length - 1;
          const lastColumnIndex = table.rows[lastRowIndex].cells.length - 1;
          insertPlayerTag('tables', tableIndex, lastRowIndex, lastColumnIndex);
        }}
      />

      <hr className={formStyles.divider} />
      <div className={`${buttonStyles.buttonGroup} ${buttonStyles.alignRight}`}>
        <button type="submit" className={buttonStyles.submitButton}>
          {selectedEvent ? 'Update Event' : 'Add Event'}
        </button>
        {selectedEvent ? (
          <>
            <button 
              type="button" 
              onClick={handleDuplicateEvent}
              className={buttonStyles.duplicateButton}
            >
              Duplicate Event
            </button>
            <button 
              type="button" 
              onClick={handleDeleteEvent} 
              className={buttonStyles.deleteButton}
            >
              Delete Event
            </button>
          </>
        ) : (
          <button 
            type="button" 
            onClick={() => onChange(initialFormData)} 
            className={buttonStyles.clearButton}
          >
            Clear Event
          </button>
        )}
      </div>

      {/* Player Selector Modal */}
      {showPlayerSelector && (
      <PlayerSelector
        onSelect={(player) => {
          const playerTag = `<${player.currentIgn}:${player.id}>`;  // Updated format
          
          if (currentCellPosition) {
            // Handle table cell updates
            const { tableIndex, rowIndex, columnIndex } = currentCellPosition;
            const newTables = [...formData.tables];
            const textArea = document.getElementById(
              `table-${tableIndex}-${rowIndex}-${columnIndex}`
            ) as HTMLTextAreaElement;

            const currentContent = newTables[tableIndex].rows[rowIndex].cells[columnIndex].content;
            
            const cursorPos = document.activeElement === textArea 
              ? textArea.selectionStart 
              : currentContent.length;

            const before = currentContent.substring(0, cursorPos);
            const after = currentContent.substring(cursorPos);
            
            newTables[tableIndex].rows[rowIndex].cells[columnIndex].content = 
              `${before}${playerTag}${after}`;
            
            handleTablesChange(newTables);
            
            setTimeout(() => {
              if (textArea) {
                textArea.focus();
                const newCursorPos = cursorPos + playerTag.length;
                textArea.setSelectionRange(newCursorPos, newCursorPos);
              }
            }, 0);
          } else {
            // Handle other text areas
            const textArea = document.getElementById(currentField) as HTMLTextAreaElement;
            if (textArea) {
              const cursorPos = textArea.selectionStart;
              const text = textArea.value;
              const before = text.substring(0, cursorPos);
              const after = text.substring(cursorPos);
              const newText = `${before}${playerTag}${after}`;
              
              if (currentField === 'description') {
                handleFormChange({ ...formData, description: newText });
              } else if (currentField.startsWith('sideEvent-')) {
                const index = parseInt(currentField.split('-')[1]);
                handleSideEventChange(index, 'description', newText);
              }
            }
          }
          setShowPlayerSelector(false);
          setCurrentCellPosition(null);
        }}
        onClose={() => {
          setShowPlayerSelector(false);
          setCurrentCellPosition(null);
        }}
      />
    )}
    </form>
  );
};