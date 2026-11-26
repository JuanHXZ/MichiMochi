import { create } from 'zustand';
import { categoryService } from '../../infrastructure/services/categoryService';

function sortCategories(list) {
  return [...list].sort((a, b) => {
    const orderA = Number(a.displayOrder) || 0;
    const orderB = Number(b.displayOrder) || 0;
    if (orderA !== orderB) return orderA - orderB;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });
}

export const useCategoryStore = create((set, get) => ({
  categories: [],
  isLoading: false,
  hasLoaded: false,
  error: null,

  fetchCategories: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const data = await categoryService.getCategories(filters);
      set({ categories: sortCategories(data), isLoading: false, hasLoaded: true });
      return data;
    } catch (err) {
      set({ error: err.message, isLoading: false, hasLoaded: true });
      return get().categories;
    }
  },

  addCategory: async (categoryData) => {
    set({ isLoading: true, error: null });
    try {
      const created = await categoryService.createCategory(categoryData);
      set((state) => ({
        categories: sortCategories([...state.categories, created]),
        isLoading: false,
      }));
      return created;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updateCategory: async (id, categoryData) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await categoryService.updateCategory(id, categoryData);
      set((state) => ({
        categories: sortCategories(
          state.categories.map((c) => (String(c.id) === String(id) ? { ...c, ...updated } : c))
        ),
        isLoading: false,
      }));
      return updated;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  deleteCategory: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await categoryService.deleteCategory(id);
      set((state) => ({
        categories: state.categories.filter((c) => String(c.id) !== String(id)),
        isLoading: false,
      }));
      return true;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  getVisibleCategories: () => {
    return get().categories.filter((c) => c.visible !== false);
  },
}));
