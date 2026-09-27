import { BUSINESS_CONSTANTS } from '../constants/businessConstants';

/**
 * Cálculos puros de pedidos y carrito de compras
 */

export const calculateSubtotal = (items = []) => {
  return items.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.quantity) || 0;
    return sum + price * qty;
  }, 0);
};

export const calculateTax = (subtotal = 0, taxRate = BUSINESS_CONSTANTS.TAX_RATE) => {
  return (Number(subtotal) || 0) * taxRate;
};

export const calculateShipping = (items = [], deliveryFee = BUSINESS_CONSTANTS.DELIVERY_FEE) => {
  if (!items || items.length === 0) return 0;
  return deliveryFee;
};

export const calculateTotalSavings = (items = []) => {
  return items.reduce((sum, item) => {
    if (item.discount && item.originalPrice) {
      const original = Number(item.originalPrice) || 0;
      const current = Number(item.price) || 0;
      const qty = Number(item.quantity) || 0;
      return sum + (original - current) * qty;
    }
    return sum;
  }, 0);
};

export const calculateOrderSummary = (items = [], options = {}) => {
  const {
    deliveryFee = BUSINESS_CONSTANTS.DELIVERY_FEE,
    taxRate = BUSINESS_CONSTANTS.TAX_RATE,
    discountAmount = 0,
  } = options;

  const subtotal = calculateSubtotal(items);
  const shipping = items.length > 0 ? deliveryFee : 0;
  const tax = calculateTax(subtotal, taxRate);
  const savings = calculateTotalSavings(items);
  const total = Math.max(0, subtotal + shipping + tax - discountAmount);

  return {
    subtotal,
    shipping,
    tax,
    savings,
    discountAmount,
    total,
  };
};
