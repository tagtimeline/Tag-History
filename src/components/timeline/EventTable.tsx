import React from "react";
import Link from "next/link";
import { Table } from "../../data/events";
import formatStyles from "../../styles/formatting.module.css";
import { formatText } from "../../config/formatting";

interface EventTableProps {
  table: Table;
}

const processPlayerMentions = (text: string, keyPrefix: string) => {
  const parts = [];
  const playerPattern = /<([^:]+):([^>]+)>/g;
  let lastIndex = 0;
  let match;

  while ((match = playerPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index);
      parts.push(
        <span
          key={`text-${keyPrefix}-${lastIndex}`}
          dangerouslySetInnerHTML={{ __html: formatText(beforeText) }}
        />
      );
    }

    // Extract just the name for display, use the documentId for the link
    const [, playerName, documentId] = match;

    parts.push(
      <Link
        key={`player-${keyPrefix}-${match.index}`}
        href={`/player/${documentId}`}
        className={formatStyles.playerLink}
      >
        {playerName}
      </Link>
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    const afterText = text.slice(lastIndex);
    parts.push(
      <span
        key={`text-${keyPrefix}-${lastIndex}`}
        dangerouslySetInnerHTML={{ __html: formatText(afterText) }}
      />
    );
  }

  return parts;
};

const EventTable: React.FC<EventTableProps> = ({ table }) => {
  const alignment = table.align || "left";

  const renderCell = (content: string, rowIndex: number, cellIndex: number) => {
    const lines = content.split("\n");
    return lines.map((line, lineIndex) => (
      <React.Fragment key={`line-${lineIndex}`}>
        {lineIndex > 0 && <br />}
        {processPlayerMentions(
          line,
          `row-${rowIndex}-cell-${cellIndex}-line-${lineIndex}`
        )}
      </React.Fragment>
    ));
  };

  return (
    <table>
      <thead>
        <tr>
          {table.headers.map((header, index) => (
            <th
              key={index}
              style={{
                textAlign: alignment,
                width: table.columnWidths?.[index],
              }}
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
                  width: table.columnWidths?.[cellIndex],
                }}
              >
                {renderCell(cell.content, rowIndex, cellIndex)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default EventTable;
