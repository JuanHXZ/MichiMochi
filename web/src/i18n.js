import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './shared/locales/en/translation.json';
import translationES from './shared/locales/es/translation.json';

const resources = {
  en: {
    translation: translationEN
  },
  es: {
    translation: translationES
  }
};

const syncDocumentLang = (lng) => {
  if (typeof document !== 'undefined' && lng) {
    document.documentElement.lang = String(lng).split('-')[0];
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  })
  .then(() => {
    syncDocumentLang(i18n.resolvedLanguage || i18n.language);
  });

i18n.on('languageChanged', syncDocumentLang);

export default i18n;
