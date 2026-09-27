import React from 'react';
import { useTranslation } from 'react-i18next';
import { AttachMoney } from '@mui/icons-material';
import { useCurrencyStore } from '@/application/stores/currencyStore';
import './CurrencyToggle.css';

export default function CurrencyToggle({ variant = 'navbar' }) {
  const { t } = useTranslation();
  const { currency, toggleCurrency } = useCurrencyStore();

  const currentCurrency = currency;
  const nextCurrency = currency === 'USD' ? 'COP' : 'USD';

  if (variant === 'sidebar') {
    return (
      <button 
        className="currency-toggle currency-toggle--sidebar"
        onClick={toggleCurrency}
        aria-label={`Change currency to ${nextCurrency}`}
      >
        <AttachMoney className="currency-toggle__icon" />
        <span className="currency-toggle__text">
          {t('sidebar.currency')}: <strong>{currentCurrency}</strong>
        </span>
      </button>
    );
  }

  return (
    <button 
      className="currency-toggle currency-toggle--navbar"
      onClick={toggleCurrency}
      aria-label={`Change currency to ${nextCurrency}`}
      title={`Switch to ${nextCurrency}`}
    >
      <AttachMoney className="currency-toggle__icon" />
      <span className="currency-toggle__currency">{currentCurrency}</span>
    </button>
  );
}
