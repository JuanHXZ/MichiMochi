import React, { useEffect, useRef } from "react";
import { Close, LightMode, DarkMode } from "@mui/icons-material";
import { useTranslation } from 'react-i18next';
import { useProductStore } from '@modules/catalog/application/stores/productStore';
import { useSidebarStore } from '@shared/stores/sidebarStore';
import { useThemeStore } from '@shared/stores/themeStore';
import LanguageToggle from '../LanguageToggle/LanguageToggle';
import CurrencyToggle from '../CurrencyToggle/CurrencyToggle';
import "./SideNavBar.css";

export default function SideNavBar() {
  const { t } = useTranslation();
  const { selectedCategory, setCategory } = useProductStore();
  const { isOpen, closeSidebar } = useSidebarStore();
  const { theme, toggleTheme } = useThemeStore();

  const dialogRef = useRef(null);
  const scrollerRef = useRef(null);
  const sheetRef = useRef(null);

  const CATEGORIES = [
    { id: "All", labelKey: "sidebar.categories.all", icon: "🍰", isComingSoon: false },
    { id: "Strawberry", labelKey: "sidebar.categories.daifuku", icon: "🍡", isComingSoon: true },
    { id: "Chocolate", labelKey: "sidebar.categories.iceCream", icon: "🍨", isComingSoon: true },
    { id: "Matcha", labelKey: "sidebar.categories.beverages", icon: "☕", isComingSoon: true },
    { id: "Special", labelKey: "sidebar.categories.seasonal", icon: "🌸", isComingSoon: true },
  ];

  const closeDrawer = () => {
    const scroller = scrollerRef.current;
    const dialog = dialogRef.current;
    if (!scroller || !dialog) {
      closeSidebar();
      return;
    }
    scroller.scrollTo({ left: scroller.offsetWidth, behavior: 'auto' });
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    const scroller = scrollerRef.current;
    const sheet = sheetRef.current;
    if (!dialog || !scroller || !sheet) return;

    let cancelled = false;

    const openDrawer = async () => {
      if (!dialog.open) {
        dialog.showModal();
      }
      if (!CSS.supports('scroll-initial-target', 'nearest')) {
        scroller.scrollTo({ left: scroller.offsetWidth, behavior: 'instant' });
        await new Promise((r) =>
          requestAnimationFrame(() => requestAnimationFrame(r))
        );
      }
      if (!cancelled && dialog.open) {
        scroller.scrollTo({ left: 0, behavior: 'auto' });
      }
    };

    if (isOpen) {
      openDrawer();
    } else if (dialog.open) {
      scroller.scrollTo({ left: scroller.offsetWidth, behavior: 'auto' });
    }

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    const scroller = scrollerRef.current;
    const sheet = sheetRef.current;
    if (!dialog || !scroller || !sheet) return;

    const visibleThreshold = 1 / Math.max(window.innerWidth, 1);

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.at(-1);
        if (!entry) return;
        if (entry.intersectionRatio < visibleThreshold && dialog.open) {
          dialog.close();
          closeSidebar();
        }
      },
      { root: dialog, threshold: [visibleThreshold, 1] }
    );
    observer.observe(sheet);

    let onScrollFallback;
    if (!CSS.supports('animation-timeline: scroll()')) {
      onScrollFallback = () => {
        const ratio = Math.max(0, Math.min(1, 1 - scroller.scrollLeft / Math.max(sheet.offsetWidth, 1)));
        dialog.style.setProperty('--drawer-backdrop', String(ratio));
      };
      scroller.addEventListener('scroll', onScrollFallback, { passive: true });
    }

    return () => {
      observer.disconnect();
      if (onScrollFallback) {
        scroller.removeEventListener('scroll', onScrollFallback);
      }
    };
  }, [closeSidebar]);

  const handleCategoryClick = (categoryId, isComingSoon) => {
    if (isComingSoon) {
      window.location.assign('/coming-soon');
    } else {
      setCategory(categoryId);
      closeDrawer();

      if (window.location.pathname !== '/dashboard') {
        window.location.assign('/dashboard');
      }
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="sidenav-dialog"
      aria-label={t('sidebar.title')}
      onClick={(e) => {
        if (sheetRef.current && !sheetRef.current.contains(e.target)) {
          closeDrawer();
        }
      }}
      onCancel={(e) => {
        if (e.cancelable) {
          e.preventDefault();
          closeDrawer();
        }
      }}
      onClose={() => {
        closeSidebar();
      }}
    >
      <div ref={scrollerRef} className="sidenav__scroller">
        <aside ref={sheetRef} className="sidenav">
          <button
            type="button"
            className="sidenav__close"
            onClick={closeDrawer}
            aria-label="Close sidebar"
            autoFocus
          >
            <Close aria-hidden="true" />
          </button>

          <div className="sidenav__header">
            <h2 className="sidenav__title">{t('sidebar.title')}</h2>
            <p className="sidenav__subtitle">{t('sidebar.subtitle')}</p>
          </div>

          <nav className="sidenav__nav" aria-label={t('sidebar.title')}>
            {CATEGORIES.map((category) => (
              <button
                type="button"
                key={category.id}
                className={`sidenav__link ${
                  selectedCategory === category.id ? "sidenav__link--active" : ""
                }`}
                onClick={() => handleCategoryClick(category.id, category.isComingSoon)}
              >
                <span className="sidenav__icon" aria-hidden="true">{category.icon}</span>
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
                type="button"
                className="sidenav__theme-toggle"
                onClick={toggleTheme}
                aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {theme === 'light' ? <DarkMode aria-hidden="true" /> : <LightMode aria-hidden="true" />}
              </button>
            </div>

            <a
              href="/cart"
              className="sidenav__cart-btn"
            >
              {t('nav.cart')}
            </a>
          </div>
        </aside>
      </div>
    </dialog>
  );
}
