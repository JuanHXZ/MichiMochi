import React, { useEffect } from "react";
import { Close, LightMode, DarkMode } from "@mui/icons-material";
import { useTranslation } from 'react-i18next';
import { useProductStore } from '@/application/stores/productStore';
import { useSidebarStore } from '@/application/stores/sidebarStore';
import { useThemeStore } from '@/application/stores/themeStore';
import LanguageToggle from '../../common/LanguageToggle/LanguageToggle';
import CurrencyToggle from '../../common/CurrencyToggle/CurrencyToggle';
import "./SideNavBar.css";

export default function SideNavBar() {
  const { t } = useTranslation();
  const { selectedCategory, setCategory } = useProductStore();
  const { isOpen, closeSidebar } = useSidebarStore();
  const { theme, toggleTheme } = useThemeStore();

  const CATEGORIES = [
    { id: "All", labelKey: "sidebar.categories.all", icon: "🍰", isComingSoon: false },
    { id: "Strawberry", labelKey: "sidebar.categories.daifuku", icon: "🍡", isComingSoon: true },
    { id: "Chocolate", labelKey: "sidebar.categories.iceCream", icon: "🍨", isComingSoon: true },
    { id: "Matcha", labelKey: "sidebar.categories.beverages", icon: "☕", isComingSoon: true },
    { id: "Special", labelKey: "sidebar.categories.seasonal", icon: "🌸", isComingSoon: true },
  ];

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        closeSidebar();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeSidebar]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleCategoryClick = (categoryId, isComingSoon) => {
    if (isComingSoon) {
      window.location.assign('/coming-soon');
    } else {
      setCategory(categoryId);
      closeSidebar();
      
      if (window.location.pathname !== '/dashboard') {
        window.location.assign('/dashboard');
      }
    }
  };

  return (
    <>
      {isOpen && (
        <div className="sidenav__overlay" onClick={closeSidebar} />
      )}

      <aside className={`sidenav ${isOpen ? "sidenav--open" : ""}`}>
        <button
          className="sidenav__close"
          onClick={closeSidebar}
          aria-label="Close sidebar"
        >
          <Close />
        </button>

        <div className="sidenav__header">
          <h2 className="sidenav__title">{t('sidebar.title')}</h2>
          <p className="sidenav__subtitle">{t('sidebar.subtitle')}</p>
        </div>

        <nav className="sidenav__nav">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              className={`sidenav__link ${
                selectedCategory === category.id ? "sidenav__link--active" : ""
              }`}
              onClick={() => handleCategoryClick(category.id, category.isComingSoon)}
            >
              <span className="sidenav__icon">{category.icon}</span>
              <span>{t(category.labelKey)}</span>
            </button>
          ))}
        </nav>

        <div className="sidenav__footer">
          <LanguageToggle variant="sidebar" />

          <CurrencyToggle variant="sidebar" />

          <div className="sidenav__theme">
            <span className="sidenav__theme-label">
              {theme === 'light' ? t('sidebar.lightMode') : t('sidebar.darkMode')}
            </span>
            <button
              className="sidenav__theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <DarkMode /> : <LightMode />}
            </button>
          </div>

          <button
            className="sidenav__cart-btn"
            onClick={() => window.location.href = "/cart"}
          >
            {t('nav.cart')}
          </button>
        </div>
      </aside>
    </>
  );
}
