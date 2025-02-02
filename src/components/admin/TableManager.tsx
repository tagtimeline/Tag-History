// components/admin/TableManager.tsx
import React from 'react';
import { Table } from '@/data/events';
import styles from '@/styles/admin.module.css';

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

  const addColumn = (tableIndex: number) => {
    const newTables = [...tables];
    const table = newTables[tableIndex];
    
    table.headers.push(`Column ${table.headers.length + 1}`);
    
    // Distribute widths evenly
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
    
    // Only remove if there's more than one column
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
    <div className={styles.tables}>
      <div className={styles.tablesHeader}>
        Tables
        <button 
          type="button" 
          onClick={addTable} 
          className={styles.addButton}
        >
          Add Table
        </button>
      </div>

      {tables.map((table, tableIndex) => (
        <div key={tableIndex} className={styles.tableWrapper}>
          <div className={styles.tableControls}>
            <button 
              type="button"
              onClick={() => addColumn(tableIndex)}
              className={styles.tableButton}
            >
              Add Column
            </button>
            <button 
              type="button"
              onClick={() => addRow(tableIndex)}
              className={styles.tableButton}
            >
              Add Row
            </button>
            <select
              className={styles.alignDropdown}
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

          <div className={styles.tableEditor}>
            <div className={styles.tableGrid}>
              {table.headers.map((header, columnIndex) => (
                <div key={columnIndex} className={styles.headerCell}>
                  <input
                    type="text"
                    className={styles.input}
                    value={header}
                    onChange={(e) => {
                      const newTables = [...tables];
                      newTables[tableIndex].headers[columnIndex] = e.target.value;
                      onChange(newTables);
                    }}
                    placeholder="Header"
                  />
                  <div className={styles.widthInput}>
                    Width <input
                      type="text"
                      className={styles.input}
                      value={table.columnWidths?.[columnIndex]?.replace(/%$/, '') || ''}
                      onChange={(e) => updateColumnWidth(tableIndex, columnIndex, e.target.value)}
                      placeholder="Width"
                    /> %
                    {table.headers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeColumn(tableIndex, columnIndex)}
                        className={styles.removeColumnButton}
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {table.rows.map((row, rowIndex) => (
                <div key={rowIndex} className={styles.tableRow}>
                  {row.cells.map((cell, columnIndex) => (
                    <div
                      key={columnIndex}
                      className={styles.tableCell}
                      style={{
                        gridColumn: `${columnIndex + 1} / span 1`,
                        gridRow: `${rowIndex + 2} / span 1`,
                      }}
                    >
                      <textarea
                        className={styles.input}
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
                        onClick={() => removeRow(tableIndex, rowIndex)}
                        className={styles.removeRowButton}
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
            onClick={() => {
              const newTables = [...tables];
              newTables.splice(tableIndex, 1);
              onChange(newTables);
            }}
            className={styles.removeTableButton}
          >
            Remove Table
          </button>
        </div>
      ))}
    </div>
  );
};

export default TableManager;