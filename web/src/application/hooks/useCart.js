import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../stores/cartStore';
import { translateProducts } from '@/shared/utils/translateProduct';

/**
 * Hook de aplicación para gestionar el carrito de compras
 */
export function useCart() {
  const { i18n } = useTranslation();
  const rawItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const totalItems = useCartStore((state) => state.totalItems);
  const totalPrice = useCartStore((state) => state.totalPrice);
  const getOrderSummary = useCartStore((state) => state.getOrderSummary);

  const items = useMemo(() => {
    return translateProducts(rawItems);
  }, [rawItems, i18n.language]);

  const summary = useMemo(() => {
    return getOrderSummary();
  }, [getOrderSummary, rawItems]);

  return {
    rawItems,
    items,
    itemCount: totalItems(),
    subtotal: totalPrice(),
    summary,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  };
}
