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
    }
};

export const getEventStyles = (categoryId: string, isSpecial?: boolean): React.CSSProperties => {
    const category = categories[categoryId];
    if (!category) return {};

    const baseStyles = {
        borderLeft: `${category.borderStyle} ${category.color}`
    };

    if (isSpecial) {
        return {
            ...baseStyles,
        };
    }

    return baseStyles;
};

export const getCategoryColor = (categoryId: string): string => 
    categories[categoryId]?.color || '#888';

export const getCategoryName = (categoryId: string): string => 
    categories[categoryId]?.name || categoryId;

export const getAllCategories = () => 
    Object.values(categories);