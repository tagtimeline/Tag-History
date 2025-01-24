// src/config/categories.ts

export interface Category {
    id: string;
    name: string;
    color: string;
    borderStyle: string;
    extraStyles?: {
        border?: string;
        zIndex?: number;
        boxShadow?: string;
    };
}

export const categories: Record<string, Category> = {
    hypixel: {
        id: 'hypixel',
        name: 'Hypixel',
        color: '#66ff66',
        borderStyle: '3px solid'
    },
    feuds: {
        id: 'feuds',
        name: 'Feuds',
        color: '#ff6666',
        borderStyle: '3px solid'
    },
    guilds: {
        id: 'guilds',
        name: 'Guilds',
        color: '#66f2ff',
        borderStyle: '3px solid'
    },
    other: {
        id: 'other',
        name: 'Other',
        color: '#ffffff',
        borderStyle: '3px solid'
    },
    special: {
        id: 'special',
        name: 'Special',
        color: '#ffd700',
        borderStyle: '3px solid',
        extraStyles: {
            border: '2px solid #ffd700',
            boxShadow: '0 0 1px rgba(255, 215, 0, 0.5), 0 0 5px rgba(255, 215, 0, 0.4)',
            zIndex: 10
        }
    }
};

export const getEventStyles = (categoryId: string): React.CSSProperties => {
    const category = categories[categoryId];
    if (!category) return {};

    if (categoryId === 'special') {
        return {
            border: category.extraStyles?.border,
            boxShadow: category.extraStyles?.boxShadow,
            zIndex: category.extraStyles?.zIndex
        };
    }

    return {
        borderLeft: `${category.borderStyle} ${category.color}`
    };
};

export const getCategoryColor = (categoryId: string): string => 
    categories[categoryId]?.color || '#888';

export const getCategoryName = (categoryId: string): string => 
    categories[categoryId]?.name || categoryId;

export const getAllCategories = () => 
    Object.values(categories);