import { apiClient } from '@shared/services/apiClient';

export const favoriteService = {
  async getFavorites() {
    const response = await apiClient('/favorites', { requiresAuth: true });
    return response.data || { productIds: [], products: [] };
  },

  async addFavorite(productId) {
    const response = await apiClient(`/favorites/${encodeURIComponent(productId)}`, {
      method: 'POST',
      requiresAuth: true,
    });
    return response.data || { productIds: [], products: [] };
  },

  async removeFavorite(productId) {
    const response = await apiClient(`/favorites/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
      requiresAuth: true,
    });
    return response.data || { productIds: [], products: [] };
  },
};
