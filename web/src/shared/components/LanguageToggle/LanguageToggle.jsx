import React from 'react';
import { useTranslation } from 'react-i18next';
import { Language } from '@mui/icons-material';
import './LanguageToggle.css';

export default function LanguageToggle({ variant = 'navbar' }) {
  const { i18n, t } = useTranslation();
  const activeLang = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];

  const toggleLanguage = () => {
    const newLang = activeLang === 'es' ? 'en' : 'es';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
    document.documentElement.lang = newLang;
  };

  const currentLang = activeLang === 'es' ? 'ES' : 'EN';
  const nextLang = activeLang === 'es' ? 'EN' : 'ES';

  if (variant === 'sidebar') {
    return (
      <button 
        type="button"
        className="language-toggle language-toggle--sidebar"
        onClick={toggleLanguage}
        aria-label={`Change language to ${nextLang}`}
      >
        <Language className="language-toggle__icon" aria-hidden="true" />
        <span className="language-toggle__text">
          {t('sidebar.language')}: <strong>{currentLang}</strong>
        </span>
      </button>
    );
  }

  return (
    <button 
      type="button"
      className="language-toggle language-toggle--navbar"
      onClick={toggleLanguage}
      aria-label={`Change language to ${nextLang}`}
      title={`Switch to ${nextLang}`}
    >
      <Language className="language-toggle__icon" aria-hidden="true" />
      <span className="language-toggle__lang">{currentLang}</span>
    </button>
  );
}
