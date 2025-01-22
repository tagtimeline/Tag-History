// src/config/dropdown.ts

export interface DropdownOption {
    id: string;
    name: string;
    color?: string;
}

export const ALL_EVENTS_OPTION: DropdownOption = {
    id: 'all',
    name: 'All Events',
    color: '#888888'
};