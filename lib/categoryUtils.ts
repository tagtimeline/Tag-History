// lib/categoryUtils.ts
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Category, categories } from '@/config/categories';

export async function initializeCategories(): Promise<void> {
  try {
    const categoriesRef = collection(db, 'categories');
    const snapshot = await getDocs(categoriesRef);
    
    // If categories already exist, no need to reinitialize
    if (!snapshot.empty) {
      console.log('Categories collection already exists');
      return;
    }

    // Add all categories from the predefined config
    const categoriesToAdd = Object.entries(categories).map(([id, category]) => 
      setDoc(doc(categoriesRef, id), {
        ...(category as Category),
        createdAt: new Date(),
        updatedAt: new Date()
      })
    );

    await Promise.all(categoriesToAdd);
    console.log('Categories successfully initialized');
  } catch (error) {
    console.error('Error initializing categories:', error);
    throw error;
  }
}

// Function to get all categories from database
export async function getCategoriesFromDB(): Promise<Record<string, Category>> {
  try {
    const categoriesRef = collection(db, 'categories');
    const snapshot = await getDocs(categoriesRef);
    
    const categoriesData: Record<string, Category> = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      categoriesData[doc.id] = {
        id: doc.id,
        name: data.name,
        color: data.color,
        borderStyle: data.borderStyle,
        extraStyles: data.extraStyles || {}
      };
    });

    return categoriesData;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return {};
  }
}