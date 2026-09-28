import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { convertPrice, formatPrice } from '../../domain/currencyCalculator';
import { BUSINESS_CONSTANTS } from '@shared/constants/businessConstants';

export const useCurrencyStore = create(
  persist(
    (set, get) => ({
      currency: localStorage.getItem('currency') || BUSINESS_CONSTANTS.DEFAULT_CURRENCY,
      exchangeRate: BUSINESS_CONSTANTS.DEFAULT_EXCHANGE_RATE,

      setCurrency: (currency) => {
        set({ currency });
        localStorage.setItem('currency', currency);
      },

      toggleCurrency: () => {
        const nextCurrency = get().currency === 'USD' ? 'COP' : 'USD';
        get().setCurrency(nextCurrency);
      },

      formatPrice: (priceInUSD) => {
        const { currency, exchangeRate } = get();
        return formatPrice(priceInUSD, currency, exchangeRate);
      },

      convertPrice: (priceInUSD) => {
        const { currency, exchangeRate } = get();
        return convertPrice(priceInUSD, currency, exchangeRate);
      },
    }),
    {
      name: 'michi-mochi-currency',
    }
  )
);
