// pages/admin/categories.tsx
import { useState, useEffect, FormEvent } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/../lib/firebaseConfig";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Category } from "@/config/categories";
import { handleAdminLogout } from "@/components/admin/AuthHandler";

import baseStyles from "@/styles/admin/base.module.css";
import controlStyles from "@/styles/controls.module.css";
import formStyles from "@/styles/admin/forms.module.css";
import categoriesStyles from "@/styles/admin/categories.module.css";
import buttonStyles from "@/styles/admin/buttons.module.css";

const initialCategoryForm: Category = {
  id: "",
  name: "",
  color: "#808080",
  borderStyle: "3px solid",
  extraStyles: {},
};

export default function AdminCategories() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [categoryForm, setCategoryForm] =
    useState<Category>(initialCategoryForm);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Authentication check
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        router.replace("/admin/password");
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch categories
  useEffect(() => {
    const categoriesRef = collection(db, "categories");
    const unsubscribe = onSnapshot(categoriesRef, (snapshot) => {
      const fetchedCategories: Category[] = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Category)
      );

      // Sort categories alphabetically by name
      fetchedCategories.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(fetchedCategories);
    });

    return () => unsubscribe();
  }, []);

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setCategoryForm({ ...category });
    setError("");
    setSuccess("");
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setCategoryForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCategoryForm((prev) => ({
      ...prev,
      color: e.target.value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      // Validate form
      if (!categoryForm.name.trim()) {
        setError("Category name is required");
        return;
      }

      const cleanData = {
        name: categoryForm.name.trim(),
        color: categoryForm.color,
        borderStyle: categoryForm.borderStyle || "3px solid",
        ...(categoryForm.extraStyles &&
        Object.keys(categoryForm.extraStyles).length > 0
          ? { extraStyles: categoryForm.extraStyles }
          : {}),
      };

      if (selectedCategory && selectedCategory.id) {
        // Update existing category
        const categoryRef = doc(db, "categories", selectedCategory.id);
        await updateDoc(categoryRef, cleanData);
        setSuccess("Category updated successfully");
      } else {
        // Add new category
        await addDoc(collection(db, "categories"), {
          ...cleanData,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        setSuccess("Category added successfully");
      }

      // Reset form
      setCategoryForm(initialCategoryForm);
      setSelectedCategory(null);
    } catch (err) {
      console.error("Error saving category:", err);
      setError("Failed to save category. Please try again.");
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory || !selectedCategory.id) return;

    try {
      if (
        window.confirm(
          "Are you sure you want to delete this category? This action cannot be undone."
        )
      ) {
        const categoryRef = doc(db, "categories", selectedCategory.id);
        await deleteDoc(categoryRef);

        // Reset form
        setCategoryForm(initialCategoryForm);
        setSelectedCategory(null);
        setSuccess("Category deleted successfully");
      }
    } catch (err) {
      console.error("Error deleting category:", err);
      setError("Failed to delete category. Please try again.");
    }
  };

  const handleLogout = () => handleAdminLogout(router);

  if (isLoading) return <div className={baseStyles.loading}>Loading...</div>;
  if (!isAuthenticated) return null;

  return (
    <div className={baseStyles.pageWrapper}>
      <Head>
        <title>Category Management - TNT Tag History</title>
      </Head>
      <Header>
        <div className={controlStyles.headerControls}>
          <Link href="/admin">
            <button
              className={controlStyles.headerButton}
              style={{ width: "auto" }}
            >
              Dashboard
            </button>
          </Link>
          <button onClick={handleLogout} className={controlStyles.headerButton}>
            Logout
          </button>
        </div>
      </Header>

      <main className={baseStyles.mainContent}>
        <div className={baseStyles.editLayout}>
          {/* Categories List Section */}
          <div className={baseStyles.formSection}>
            <div
              className={baseStyles.header}
              style={{
                marginLeft: "auto",
                marginRight: "auto",
                maxWidth: "650px",
              }}
            >
              <div className={baseStyles.title}>Categories List</div>
              <button
                type="button"
                className={buttonStyles.addButton}
                onClick={() => {
                  setSelectedCategory(null);
                  setCategoryForm(initialCategoryForm);
                }}
              >
                Create New Category
              </button>
            </div>
            <div className={categoriesStyles.categoriesList}>
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={`${categoriesStyles.categoryItem} ${
                    selectedCategory?.id === category.id
                      ? categoriesStyles.selected
                      : ""
                  }`}
                  onClick={() => handleCategorySelect(category)}
                  style={{
                    borderLeft: `5px solid ${category.color}`,
                  }}
                >
                  <span>{category.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Form Section */}
          <div className={baseStyles.formSection}>
            <div className={baseStyles.header}>
              <div className={baseStyles.title}>
                {selectedCategory ? "Edit Category" : "Add New Category"}
              </div>
            </div>
            <form
              onSubmit={handleSubmit}
              className={categoriesStyles.categoriesForm}
            >
              {error && (
                <div className={baseStyles.errorMessage}>
                  <span className={baseStyles.errorText}>{error}</span>
                </div>
              )}
              {success && (
                <div className={baseStyles.successMessage}>
                  <span className={baseStyles.successText}>{success}</span>
                </div>
              )}

              <div className={categoriesStyles.formSection}>
                <label htmlFor="name">Category Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className={formStyles.input}
                  value={categoryForm.name}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className={categoriesStyles.formSection}>
                <label htmlFor="color">Category Color</label>
                <div className={categoriesStyles.colorPickerContainer}>
                  <input
                    id="color"
                    name="color"
                    type="color"
                    value={categoryForm.color}
                    onChange={handleColorChange}
                    className={categoriesStyles.categoryColorInput}
                  />
                  <input
                    type="text"
                    value={categoryForm.color}
                    onChange={handleColorChange}
                    className={formStyles.input}
                    placeholder="Hex Color Code"
                  />
                </div>
              </div>

              <div className={categoriesStyles.formSection}>
                <label htmlFor="borderStyle">Border Style</label>
                <select
                  id="borderStyle"
                  name="borderStyle"
                  className={formStyles.input}
                  value={categoryForm.borderStyle}
                  onChange={handleFormChange}
                >
                  <option value="3px solid">Solid 3px</option>
                  <option value="3px dashed">Dashed 3px</option>
                  <option value="3px dotted">Dotted 3px</option>
                  <option value="5px solid">Solid 5px</option>
                </select>
              </div>

              <div className={categoriesStyles.buttonGroup}>
                <button type="submit" className={buttonStyles.submitButton}>
                  {selectedCategory ? "Update Category" : "Add Category"}
                </button>
                {selectedCategory && (
                  <button
                    type="button"
                    onClick={handleDeleteCategory}
                    className={buttonStyles.deleteButton}
                  >
                    Delete Category
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
