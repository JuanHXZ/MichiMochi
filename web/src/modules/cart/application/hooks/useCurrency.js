import { useMemo, useCallback } from 'react';
import { useCurrencyStore } from '../stores/currencyStore';

/**
 * Hook de aplicación para formateo y conversión de moneda
 */
export const useCurrency = () => {
  const currency = useCurrencyStore((state) => state.currency);
  const formatPrice = useCurrencyStore((state) => state.formatPrice);
  const convertPrice = useCurrencyStore((state) => state.convertPrice);
  const toggleCurrency = useCurrencyStore((state) => state.toggleCurrency);

  const format = useCallback(
    (priceInUSD) => formatPrice(priceInUSD),
    [formatPrice]
  );

  const convert = useCallback(
    (priceInUSD) => convertPrice(priceInUSD),
    [convertPrice]
  );

  return {
    currency,
    format,
    convert,
    toggleCurrency,
  };
};

export const useFormattedPrice = (priceInUSD) => {
  const formatPrice = useCurrencyStore((state) => state.formatPrice);
  const currency = useCurrencyStore((state) => state.currency);

  return useMemo(() => {
    return formatPrice(priceInUSD);
  }, [priceInUSD, currency, formatPrice]);
};
