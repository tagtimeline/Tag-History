// Modified TableManager.tsx
import React, { useState } from 'react';
import { Table } from '@/data/events';
import { ChevronDown, ChevronRight } from 'lucide-react';

import tableStyles from '@/styles/admin/tables.module.css';
import formStyles from '@/styles/admin/forms.module.css';
import buttonStyles from '@/styles/admin/buttons.module.css';

interface TableManagerProps {
  tables: Table[];
  onChange: (tables: Table[], description?: string) => void;
  currentDescription: string;
  onAddPlayer: (tableIndex: number, rowIndex?: number, columnIndex?: number) => void;
  // New props for side event support
  isSideEvent?: boolean;
  sideEventIndex?: number;
  sideEventDescription?: string;
  onSideEventChange?: (index: number, description: string) => void;
}

const insertTableMarker = (description: string, tableIndex: number, isSideEvent: boolean, sideEventIndex?: number) => {
  const marker = `[TABLE-${isSideEvent ? `S${sideEventIndex}-` : ''}${tableIndex}]`;
  return description + (description.endsWith('\n') ? '' : '\n') + marker + '\n';
};


export const TableManager: React.FC<TableManagerProps> = ({ 
  tables, 
  onChange, 
  currentDescription,
  onAddPlayer,
  isSideEvent = false,
  sideEventIndex,
  sideEventDescription,
  onSideEventChange
}) => {
  const [collapsedTables, setCollapsedTables] = useState<Record<number, boolean>>({});

  const toggleTable = (index: number) => {
    setCollapsedTables(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const addTable = () => {
    const newTables = [
      ...tables,
      {
        headers: ['Column 1'],
        rows: [{ cells: [{ content: '' }] }],
        align: 'left' as const,
        columnWidths: ['100%'] as string[]
      }
    ];

    // Add table marker to the appropriate description
    const description = isSideEvent ? sideEventDescription : currentDescription;
    if (description !== undefined) {
      const updatedDescription = insertTableMarker(
        description, 
        tables.length, 
        isSideEvent, 
        sideEventIndex
      );
      
      if (isSideEvent && onSideEventChange && typeof sideEventIndex === 'number') {
        onSideEventChange(sideEventIndex, updatedDescription);
      } else {
        onChange(newTables, updatedDescription);
      }
    } else {
      onChange(newTables);
    }
  };

  const confirmRemove = (tableIndex: number) => {
    if (window.confirm('Are you sure you want to remove this table? This cannot be undone.')) {
      const newTables = [...tables];
      newTables.splice(tableIndex, 1);
      
      // Update description by removing the table marker and updating remaining ones
      let description = isSideEvent ? sideEventDescription : currentDescription;
      if (description) {
        const oldMarker = `[TABLE-${isSideEvent ? `S${sideEventIndex}-` : ''}${tableIndex}]`;
        description = description.replace(oldMarker + '\n', '');
        
        // Update remaining table markers
        for (let i = tableIndex + 1; i < tables.length; i++) {
          const oldTableMarker = `[TABLE-${isSideEvent ? `S${sideEventIndex}-` : ''}${i}]`;
          const newTableMarker = `[TABLE-${isSideEvent ? `S${sideEventIndex}-` : ''}${i - 1}]`;
          description = description.replace(oldTableMarker, newTableMarker);
        }
        
        if (isSideEvent && onSideEventChange && typeof sideEventIndex === 'number') {
          onSideEventChange(sideEventIndex, description);
        } else {
          onChange(newTables, description);
        }
      } else {
        onChange(newTables);
      }
    }
  };

  const addColumn = (tableIndex: number) => {
    const newTables = [...tables];
    const table = newTables[tableIndex];
    
    table.headers.push(`Column ${table.headers.length + 1}`);
    
    const newWidth = Math.floor(100 / table.headers.length);
    const remainder = 100 - (newWidth * table.headers.length);
    table.columnWidths = table.headers.map((_, index) => 
      `${newWidth + (index === 0 ? remainder : 0)}%`
    );
    
    table.rows.forEach(row => {
      row.cells.push({ content: '' });
    });
    
    onChange(newTables);
  };

  const removeColumn = (tableIndex: number, columnIndex: number) => {
    const newTables = [...tables];
    const table = newTables[tableIndex];
    
    if (table.headers.length > 1) {
      table.headers.splice(columnIndex, 1);
      if (!table.columnWidths) {
        table.columnWidths = [];
      }
      table.columnWidths.splice(columnIndex, 1);
      table.rows.forEach(row => row.cells.splice(columnIndex, 1));
      
      onChange(newTables);
    }
  };

  const addRow = (tableIndex: number) => {
    const newTables = [...tables];
    const table = newTables[tableIndex];
    
    table.rows.push({
      cells: table.headers.map(() => ({ content: '' }))
    });
    
    onChange(newTables);
  };

  const removeRow = (tableIndex: number, rowIndex: number) => {
    const newTables = [...tables];
    newTables[tableIndex].rows.splice(rowIndex, 1);
    onChange(newTables);
  };

  const updateColumnWidth = (tableIndex: number, columnIndex: number, width: string) => {
    const newTables = [...tables];
    const numWidth = Number(width.replace('%', ''));
    
    if (!isNaN(numWidth) && numWidth > 0 && numWidth <= 100) {
      if (!newTables[tableIndex].columnWidths) {
        newTables[tableIndex].columnWidths = [];
      }
      newTables[tableIndex].columnWidths[columnIndex] = `${numWidth}%`;
      onChange(newTables);
    }
  };

  return (
    <div className={tableStyles.tables}>
      <div className={tableStyles.tablesHeader}>
        Tables
        <button 
          type="button" 
          onClick={addTable} 
          className={buttonStyles.addButton}
        >
          Add Table
        </button>
      </div>
  
      {tables.map((table, tableIndex) => (
        <div key={tableIndex} className={tableStyles.tableWrapper}>
          <div className={tableStyles.tableSubHeader}>
            <div 
              className={tableStyles.tableIdentifier}
              onClick={() => toggleTable(tableIndex)}
              style={{ cursor: 'pointer' }}
            >
              Table {tableIndex}
            </div>
            <div className={tableStyles.tableControls}>
              <button 
                type="button"
                onClick={() => addColumn(tableIndex)}
                className={tableStyles.tableButton}
              >
                Add Column
              </button>
              <button 
                type="button"
                onClick={() => addRow(tableIndex)}
                className={tableStyles.tableButton}
              >
                Add Row
              </button>
              <select
                className={tableStyles.alignDropdown}
                value={table.align}
                onChange={(e) => {
                  const newTables = [...tables];
                  newTables[tableIndex].align = e.target.value as 'left' | 'center' | 'right';
                  onChange(newTables);
                }}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
              <button 
                type="button"
                onClick={() => onAddPlayer(tableIndex)}
                className={tableStyles.tableButton}
              >
                Add Player
              </button>
            </div>
          </div>

          {!collapsedTables[tableIndex] && (
            <>
              <div className={tableStyles.tableEditor}>
                <div className={tableStyles.tableGrid}>
                  {table.headers.map((header, columnIndex) => (
                    <div key={columnIndex} className={tableStyles.headerCell}>
                      <input
                        type="text"
                        className={formStyles.input}
                        value={header}
                        onChange={(e) => {
                          const newTables = [...tables];
                          newTables[tableIndex].headers[columnIndex] = e.target.value;
                          onChange(newTables);
                        }}
                        placeholder="Header"
                      />
                      <div className={tableStyles.widthInput}>
                        Width <input
                          type="text"
                          className={formStyles.input}
                          value={table.columnWidths?.[columnIndex]?.replace(/%$/, '') || ''}
                          onChange={(e) => updateColumnWidth(tableIndex, columnIndex, e.target.value)}
                          placeholder="Width"
                        /> %
                        {table.headers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to remove this column? This will delete all data in the column.')) {
                                removeColumn(tableIndex, columnIndex);
                              }
                            }}
                            className={tableStyles.removeColumnButton}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
  
                  {table.rows.map((row, rowIndex) => (
                    <div key={rowIndex} className={tableStyles.tableRow}>
                      {row.cells.map((cell, columnIndex) => (
                        <div
                          key={columnIndex}
                          className={tableStyles.tableCell}
                          style={{
                            gridColumn: `${columnIndex + 1} / span 1`,
                            gridRow: `${rowIndex + 2} / span 1`,
                          }}
                        >
                          <div className={tableStyles.cellControls}>
                            <textarea
                              id={`table-${tableIndex}-${rowIndex}-${columnIndex}`}
                              className={formStyles.input}
                              value={cell.content}
                              onChange={(e) => {
                                const newTables = [...tables];
                                newTables[tableIndex].rows[rowIndex].cells[columnIndex].content = e.target.value;
                                onChange(newTables);
                              }}
                              placeholder="Cell content"
                            />
                          </div>
                          {row.cells.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Are you sure you want to remove this row? This cannot be undone.')) {
                                  removeRow(tableIndex, rowIndex);
                                }
                              }}
                              className={tableStyles.removeRowButton}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
            </div>
              </div>
              <button
                type="button"
                onClick={() => confirmRemove(tableIndex)}
                className={buttonStyles.removeButton}
              >
                Remove Table
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default TableManager;