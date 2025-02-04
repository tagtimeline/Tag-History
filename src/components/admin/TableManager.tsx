// components/admin/TableManager.tsx
import React from 'react';
import { Table } from '@/data/events';

import tableStyles from '@/styles/admin/tables.module.css';
import formStyles from '@/styles/admin/forms.module.css';
import buttonStyles from '@/styles/admin/buttons.module.css';

interface TableManagerProps {
  tables: Table[];
  onChange: (tables: Table[]) => void;
}

export const TableManager: React.FC<TableManagerProps> = ({ tables, onChange }) => {
  const addTable = () => {
    onChange([
      ...tables,
      {
        headers: ['Column 1'],
        rows: [{ cells: [{ content: '' }] }],
        align: 'left',
        columnWidths: ['100%'] as string[]
      }
    ]);
  };

  const confirmRemove = (action: () => void, message: string) => {
    if (window.confirm(message)) {
      action();
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
              <option value="left">Left Align</option>
              <option value="center">Center Align</option>
              <option value="right">Right Align</option>
            </select>
          </div>

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
                      <textarea
                        className={formStyles.input}
                        value={cell.content}
                        onChange={(e) => {
                          const newTables = [...tables];
                          newTables[tableIndex].rows[rowIndex].cells[columnIndex].content = e.target.value;
                          onChange(newTables);
                        }}
                        placeholder="Cell content"
                      />
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
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => confirmRemove(() => {
              const newTables = [...tables];
              newTables.splice(tableIndex, 1);
              onChange(newTables);
            }, 'Are you sure you want to remove this table?')}
            className={buttonStyles.removeButton}
          >
            Remove Table
          </button>
        </div>
      ))}
    </div>
  );
};

export default TableManager;