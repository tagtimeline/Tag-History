import React, { useState } from 'react';
import { Table } from '../../data/events';
import styles from '../../styles/events.module.css';

interface EventTableProps {
 table: Table;
}

const EventTable: React.FC<EventTableProps> = ({ table }) => {
    const [hoveredCell, setHoveredCell] = useState<{row: number, cell: number} | null>(null);
    const [copiedCell, setCopiedCell] = useState<{row: number, cell: number} | null>(null);
    const alignment = table.align || 'left';
   
    const copyContent = (content: string, row: number, cell: number) => {
      navigator.clipboard.writeText(content);
      setCopiedCell({row, cell});
      setTimeout(() => setCopiedCell(null), 2000); // Reset after 2 seconds
    };
   
    const getCopyButtonText = (row: number, cell: number) => {
      return copiedCell?.row === row && copiedCell?.cell === cell ? 'Copied' : 'Copy';
    };
   
    return (
      <table>
        <thead>
          <tr>
            {table.headers.map((header, index) => (
              <th key={index} style={{ textAlign: alignment, width: table.columnWidths?.[index] }}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.cells.map((cell, cellIndex) => (
                <td 
                  key={cellIndex}
                  style={{ 
                    textAlign: cell.align || alignment,
                    width: table.columnWidths?.[cellIndex],
                    backgroundColor: hoveredCell?.row === rowIndex && hoveredCell?.cell === cellIndex ? '#1D1D1D' : 'transparent'
                  }}
                  onMouseEnter={() => setHoveredCell({row: rowIndex, cell: cellIndex})}
                  onMouseLeave={() => setHoveredCell(null)}
                >
                  {cell.content}
                  {hoveredCell?.row === rowIndex && hoveredCell?.cell === cellIndex && (
                    <button
                      onClick={() => copyContent(cell.content, rowIndex, cellIndex)}
                      className={styles.copyButton}
                    >
                      {getCopyButtonText(rowIndex, cellIndex)}
                    </button>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
   };

export default EventTable;