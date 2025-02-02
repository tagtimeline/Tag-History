import React from 'react';
import { Table } from '../../data/events';
import styles from '../../styles/events.module.css';

interface EventTableProps {
  table: Table;
}

const EventTable: React.FC<EventTableProps> = ({ table }) => {
  const alignment = table.align || 'left';

  const formatContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      const formattedLine = line.replace(/<([^>]+)>/g, (match, username) => 
        `<a href="/player/${username}" class="${styles.playerLink}">${username}</a>`
      );
      return i === 0 ? formattedLine : `<br/>${formattedLine}`;
    }).join('');
  };
   
  return (
    <table>
      <thead>
        <tr>
          {table.headers.map((header, index) => (
            <th 
              key={index} 
              style={{ textAlign: alignment, width: table.columnWidths?.[index] }}
            >
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
                  width: table.columnWidths?.[cellIndex]
                }}
                dangerouslySetInnerHTML={{ 
                  __html: formatContent(cell.content) 
                }}
              />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default EventTable;