// src/config/categories.ts
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/../lib/firebaseConfig";
import type { CSSProperties } from "react";

export interface Category {
  id: string;
  name: string;
  color: string;
  borderStyle: string;
  createdAt?: Date;
  updatedAt?: Date;
  extraStyles?: {
    border?: string;
    zIndex?: number;
    boxShadow?: string;
  };
}

export const categories: Record<string, Category> = {
  default: {
    id: "default",
    name: "Default",
    color: "#808080",
    borderStyle: "3px solid",
  },
};

// This will store our cached categories
let cachedCategories: Record<string, Category> = {};

// Make sure to properly export the function
export async function fetchCategories(): Promise<Record<string, Category>> {
  try {
    const categoriesRef = collection(db, "categories");
    const snapshot = await getDocs(categoriesRef);

    const categoriesData: Record<string, Category> = {};
    snapshot.forEach((doc) => {
      const data = doc.data();
      categoriesData[doc.id] = {
        id: doc.id,
        name: data.name,
        color: data.color,
        borderStyle: data.borderStyle,
        extraStyles: data.extraStyles,
      };
    });

    // Update cache
    cachedCategories = categoriesData;
    return categoriesData;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return {};
  }
}

// Helper functions now use the cached categories
export function getEventStyles(
  categoryId: string,
  isSpecial?: boolean
): CSSProperties {
  const category = cachedCategories[categoryId];
  if (!category) return {};

  const baseStyles = {
    borderLeft: `${category.borderStyle} ${category.color}`,
  };

  if (isSpecial) {
    return {
      ...baseStyles,
    };
  }

  return baseStyles;
}

export function getCategoryColor(categoryId: string): string {
  return cachedCategories[categoryId]?.color || "#888";
}

export function getCategoryName(categoryId: string): string {
  return cachedCategories[categoryId]?.name || categoryId;
}

export function getAllCategories(): Category[] {
  return Object.values(cachedCategories);
}

// Optional: Function to get a single category
export async function getCategory(id: string): Promise<Category | null> {
  try {
    const categoryRef = doc(db, "categories", id);
    const categoryDoc = await getDoc(categoryRef);

    if (categoryDoc.exists()) {
      const data = categoryDoc.data();
      return {
        id: categoryDoc.id,
        name: data.name,
        color: data.color,
        borderStyle: data.borderStyle,
        extraStyles: data.extraStyles,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching category:", error);
    return null;
  }
}

// Validation function for categories
export function validateCategory(category: Partial<Category>): boolean {
  // Check if required fields are present and valid
  return !!(
    category.name &&
    category.name.trim() !== "" &&
    category.color &&
    /^#([0-9A-F]{3}){1,2}$/i.test(category.color)
  );
}
