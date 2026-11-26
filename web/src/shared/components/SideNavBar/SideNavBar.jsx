import React, { useEffect, useRef, useCallback } from "react";
import { Close, LightMode, DarkMode } from "@mui/icons-material";
import { useTranslation } from 'react-i18next';
import { useProductStore } from '@modules/catalog/application/stores/productStore';
import { useCategoryStore } from '@modules/catalog/application/stores/categoryStore';
import { useSidebarStore } from '@shared/stores/sidebarStore';
import { useThemeStore } from '@shared/stores/themeStore';
import LanguageToggle from '../LanguageToggle/LanguageToggle';
import CurrencyToggle from '../CurrencyToggle/CurrencyToggle';
import "./SideNavBar.css";

export default function SideNavBar() {
  const { t } = useTranslation();
  const { selectedCategory, setCategory } = useProductStore();
  const categories = useCategoryStore((state) => state.categories);
  const hasLoadedCategories = useCategoryStore((state) => state.hasLoaded);
  const fetchCategories = useCategoryStore((state) => state.fetchCategories);
  const { isOpen, closeSidebar } = useSidebarStore();
  const { theme, toggleTheme } = useThemeStore();

  const dialogRef = useRef(null);
  const scrollerRef = useRef(null);
  const sheetRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  useEffect(() => {
    if (!hasLoadedCategories) {
      fetchCategories({ visible: true });
    }
  }, [hasLoadedCategories, fetchCategories]);

  const CATEGORIES = [
    { id: "All", label: t("sidebar.categories.all"), icon: "🍰" },
    ...categories
      .filter((c) => c.visible !== false)
      .map((c) => ({
        id: c.name,
        label: c.name,
        icon: c.icon || "🍡",
      })),
  ];

  const finalizeClose = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    const dialog = dialogRef.current;
    if (dialog?.open) {
      dialog.close();
    }
    closeSidebar();
  }, [closeSidebar]);

  const closeDrawer = useCallback(() => {
    const scroller = scrollerRef.current;
    const dialog = dialogRef.current;
    if (!scroller || !dialog || !dialog.open) {
      finalizeClose();
      return;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const maxScroll = Math.max(0, scroller.scrollWidth - scroller.clientWidth);

    if (prefersReducedMotion || maxScroll === 0) {
      finalizeClose();
      return;
    }

    const handleScrollEnd = () => {
      scroller.removeEventListener('scrollend', handleScrollEnd);
      finalizeClose();
    };
    scroller.addEventListener('scrollend', handleScrollEnd, { once: true });

    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      scroller.removeEventListener('scrollend', handleScrollEnd);
      finalizeClose();
    }, 260);

    scroller.scrollTo({ left: maxScroll, behavior: 'auto' });
  }, [finalizeClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    const scroller = scrollerRef.current;
    const sheet = sheetRef.current;
    if (!dialog || !scroller || !sheet) return;

    let cancelled = false;

    const openDrawer = async () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
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
      closeDrawer();
    }

    return () => {
      cancelled = true;
    };
  }, [isOpen, closeDrawer]);

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
          finalizeClose();
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
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
      if (dialog.open) {
        dialog.close();
      }
    };
  }, [finalizeClose]);

  const handleCategoryClick = (categoryId) => {
    finalizeClose();
    setCategory(categoryId);

    if (window.location.pathname !== '/dashboard') {
      window.location.assign('/dashboard');
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
                  selectedCategory.toLowerCase() === category.id.toLowerCase() ? "sidenav__link--active" : ""
                }`}
                onClick={() => handleCategoryClick(category.id)}
              >
                <span className="sidenav__icon" aria-hidden="true">{category.icon}</span>
                <span>{category.label}</span>
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
              onClick={finalizeClose}
            >
              {t('nav.cart')}
            </a>
          </div>
        </aside>
      </div>
    </dialog>
  );
}
