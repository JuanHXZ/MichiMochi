import { apiClient } from '@/shared/services/apiClient';

export const FALLBACK_CATEGORIES = [
  { id: 'cat_strawberry', name: 'Strawberry', description: 'Fresh berry delights', icon: '🍓', visible: true, displayOrder: 1 },
  { id: 'cat_mango', name: 'Mango', description: 'Tropical sweetness', icon: '🥭', visible: true, displayOrder: 2 },
  { id: 'cat_matcha', name: 'Matcha', description: 'Premium green tea', icon: '🍵', visible: true, displayOrder: 3 },
  { id: 'cat_chocolate', name: 'Chocolate', description: 'Rich cocoa flavors', icon: '🍫', visible: true, displayOrder: 4 },
  { id: 'cat_special', name: 'Special', description: 'Limited edition & seasonal flavors', icon: '🌸', visible: true, displayOrder: 5 },
];

export const categoryService = {
  async getCategories(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters?.visible !== undefined) {
        params.append('visible', String(filters.visible));
      }
      if (filters?.search && filters.search.trim()) {
        params.append('search', filters.search.trim());
      }
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const response = await apiClient(`/categories${queryStr}`, { requiresAuth: false });
      if (response?.ok && Array.isArray(response.data)) {
        return response.data;
      }
      return FALLBACK_CATEGORIES;
    } catch (err) {
      console.warn('[categoryService] Fallo al consultar API /categories, usando fallback local:', err.message);
      return FALLBACK_CATEGORIES;
    }
  },

  async createCategory(categoryData) {
    const response = await apiClient('/categories', {
      method: 'POST',
      body: categoryData,
      requiresAuth: true,
    });
    return response.data;
  },

  async updateCategory(id, categoryData) {
    const response = await apiClient(`/categories/${id}`, {
      method: 'PUT',
      body: categoryData,
      requiresAuth: true,
    });
    return response.data;
  },

  async deleteCategory(id) {
    const response = await apiClient(`/categories/${id}`, {
      method: 'DELETE',
      requiresAuth: true,
    });
    return response.ok;
  },
};
