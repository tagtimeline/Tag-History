// src/data/events.ts

export interface TableCell {
  content: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableRow {
  cells: TableCell[];
}

export interface Table {
  headers: string[];
  rows: TableRow[];
  align?: 'left' | 'center' | 'right';
  columnWidths?: string[];
}

export interface SideEvent {
  id: string;
  title: string;
  description: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate?: string;
  category: string;
  tags: string[];
  isSpecial?: boolean;
  tables?: Table[]; // Changed from any[] to Table[]
  sideEvents?: SideEvent[]; // Changed from any[] to SideEvent[]
  createdAt?: Date;
  updatedAt?: Date;
}