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
  tables?: Table[];
}

export interface Player {
  uuid: string;
  currentIgn: string;
  pastIgns: string[];
  events: string[]; 
  lastUpdated: Date;
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
  tables?: Table[];
  sideEvents?: SideEvent[];
  createdAt?: Date;
  updatedAt?: Date;
  playerIds?: string[];  // Optional array of player document IDs involved in the event
}