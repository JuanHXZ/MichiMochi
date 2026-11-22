import { create } from 'zustand';
import { orderService } from '../../infrastructure/services/orderService';

export const useOrderStore = create((set) => ({
  orders: [],
  currentOrder: null,
  isLoading: false,
  isSubmitting: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchMyOrders: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const orders = await orderService.getMyOrders(filters);
      set({ orders, isLoading: false });
      return orders;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return [];
    }
  },

  fetchOrderById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const order = await orderService.getOrderById(id);
      set({ currentOrder: order, isLoading: false });
      return order;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return null;
    }
  },

  createOrder: async (payload) => {
    set({ isSubmitting: true, error: null });
    try {
      const created = await orderService.createOrder(payload);
      set((state) => ({
        currentOrder: created,
        orders: [created, ...state.orders.filter((o) => o.id !== created.id)],
        isSubmitting: false,
      }));
      return created;
    } catch (err) {
      set({ error: err.message, isSubmitting: false });
      throw err;
    }
  },

  advanceOrderStatus: async (id) => {
    set({ isSubmitting: true, error: null });
    try {
      const updated = await orderService.simulateAdvanceOrder(id);
      set((state) => ({
        currentOrder: updated,
        orders: state.orders.map((o) => (o.id === updated.id ? updated : o)),
        isSubmitting: false,
      }));
      return updated;
    } catch (err) {
      set({ error: err.message, isSubmitting: false });
      throw err;
    }
  },

  cancelOrder: async (id) => {
    set({ isSubmitting: true, error: null });
    try {
      const updated = await orderService.cancelOrder(id);
      set((state) => ({
        currentOrder: updated,
        orders: state.orders.map((o) => (o.id === updated.id ? updated : o)),
        isSubmitting: false,
      }));
      return updated;
    } catch (err) {
      set({ error: err.message, isSubmitting: false });
      throw err;
    }
  },
}));
