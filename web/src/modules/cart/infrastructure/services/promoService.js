import { apiClient } from '@shared/services/apiClient';

export const promoService = {
  async validatePromoCode(code, subtotal) {
    const response = await apiClient('/promotions/validate', {
      method: 'POST',
      body: { code, subtotal },
    });
    return response.data;
  },

  async getPromotions() {
    const response = await apiClient('/promotions', { requiresAuth: true });
    return response.data || [];
  },

  async createPromotion(payload) {
    const response = await apiClient('/promotions', {
      method: 'POST',
      body: payload,
      requiresAuth: true,
    });
    return response.data;
  },

  async updatePromotion(code, payload) {
    const response = await apiClient(`/promotions/${encodeURIComponent(code)}`, {
      method: 'PUT',
      body: payload,
      requiresAuth: true,
    });
    return response.data;
  },

  async deletePromotion(code) {
    const response = await apiClient(`/promotions/${encodeURIComponent(code)}`, {
      method: 'DELETE',
      requiresAuth: true,
    });
    return response.ok;
  },
};
