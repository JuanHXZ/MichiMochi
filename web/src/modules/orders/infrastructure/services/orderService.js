import { apiClient } from '@shared/services/apiClient';

export const orderService = {
  async createOrder(payload) {
    const response = await apiClient('/orders', {
      method: 'POST',
      body: payload,
      requiresAuth: true,
    });
    return response?.data;
  },

  async getMyOrders(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    const query = params.toString();
    const response = await apiClient(`/orders${query ? `?${query}` : ''}`, {
      requiresAuth: true,
    });
    return response?.data || [];
  },

  async getOrderById(id) {
    const response = await apiClient(`/orders/${encodeURIComponent(id)}`, {
      requiresAuth: true,
    });
    return response?.data;
  },

  async simulateAdvanceOrder(id) {
    const response = await apiClient(`/orders/${encodeURIComponent(id)}/simulate-advance`, {
      method: 'POST',
      requiresAuth: true,
    });
    return response?.data;
  },

  async cancelOrder(id) {
    const response = await apiClient(`/orders/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
      requiresAuth: true,
    });
    return response?.data;
  },
};
