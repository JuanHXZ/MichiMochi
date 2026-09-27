import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateSubtotal, calculateOrderSummary } from '@/domain/calculations/orderCalculator';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        set((state) => {
          const existing = state.items.find((i) => i.id === product.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { items: [...state.items, { ...product, quantity: 1 }] };
        });
      },

      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== productId) })),

      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.id !== productId)
              : state.items.map((i) => (i.id === productId ? { ...i, quantity } : i)),
        })),

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () => calculateSubtotal(get().items),

      getOrderSummary: (options) => calculateOrderSummary(get().items, options),
    }),
    { name: 'michi-mochi-cart' }
  )
);
