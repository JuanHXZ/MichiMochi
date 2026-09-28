import React from 'react';
import { useTranslation } from 'react-i18next';
import { Language } from '@mui/icons-material';
import './LanguageToggle.css';

export default function LanguageToggle({ variant = 'navbar' }) {
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'es' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const currentLang = i18n.language === 'es' ? 'ES' : 'EN';
  const nextLang = i18n.language === 'es' ? 'EN' : 'ES';

  if (variant === 'sidebar') {
    return (
      <button 
        className="language-toggle language-toggle--sidebar"
        onClick={toggleLanguage}
        aria-label={`Change language to ${nextLang}`}
      >
        <Language className="language-toggle__icon" />
        <span className="language-toggle__text">
          {t('sidebar.language')}: <strong>{currentLang}</strong>
        </span>
      </button>
    );
  }

  return (
    <button 
      className="language-toggle language-toggle--navbar"
      onClick={toggleLanguage}
      aria-label={`Change language to ${nextLang}`}
      title={`Switch to ${nextLang}`}
    >
      <Language className="language-toggle__icon" />
      <span className="language-toggle__lang">{currentLang}</span>
    </button>
  );
}
