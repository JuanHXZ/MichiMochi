import { BUSINESS_CONSTANTS } from '../constants/businessConstants';

/**
 * Cálculos puros de conversión y formateo de divisas
 */

export const convertPrice = (
  priceInUSD,
  currency = BUSINESS_CONSTANTS.DEFAULT_CURRENCY,
  exchangeRate = BUSINESS_CONSTANTS.DEFAULT_EXCHANGE_RATE
) => {
  const numericPrice = Number(priceInUSD) || 0;
  return currency === 'COP' ? numericPrice * exchangeRate : numericPrice;
};

export const formatPrice = (
  priceInUSD,
  currency = BUSINESS_CONSTANTS.DEFAULT_CURRENCY,
  exchangeRate = BUSINESS_CONSTANTS.DEFAULT_EXCHANGE_RATE
) => {
  const numericPrice = Number(priceInUSD) || 0;

  if (currency === 'COP') {
    const priceInCOP = numericPrice * exchangeRate;
    return {
      value: priceInCOP,
      formatted: `$${Math.round(priceInCOP).toLocaleString('es-CO')}`,
      symbol: '$',
      currency: 'COP',
    };
  }

  return {
    value: numericPrice,
    formatted: `$${numericPrice.toFixed(2)}`,
    symbol: '$',
    currency: 'USD',
  };
};
