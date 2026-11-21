import React, { useId } from "react";
import { Menu as MenuIcon, ShoppingCart, LightMode, DarkMode } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '@modules/cart/application/stores/cartStore';
import { useThemeStore } from '@shared/stores/themeStore';
import { useSidebarStore } from '@shared/stores/sidebarStore';
import { useAuthStore } from '@modules/auth/application/stores/authStore';
import LanguageToggle from '../LanguageToggle/LanguageToggle';
import CurrencyToggle from '../CurrencyToggle/CurrencyToggle';
import "./Navbar.css";

const Navbar = ({ userName = "User", onLogout, currentPage = "catalog" }) => {
  const { t } = useTranslation();
  const userMenuId = useId();
  const totalItems = useCartStore((state) => state.totalItems());
  const { theme, toggleTheme } = useThemeStore();
  const { toggleSidebar } = useSidebarStore();
  const clearSession = useAuthStore((state) => state.clearSession);

  const handleLogout = () => {
    clearSession();

    if (typeof onLogout === "function") {
      onLogout();
      return;
    }

    window.location.href = "/login";
  };

  const navItems = [
    { id: 'catalog', label: t('nav.catalog'), href: '/dashboard' },
    { id: 'admin-catalog', label: t('nav.adminCatalog'), href: '/admin/catalog' },
    { id: 'favorites', label: t('nav.favorites'), href: '/coming-soon' },
    { id: 'orders', label: t('nav.orders'), href: '/coming-soon' },
    { id: 'rewards', label: t('nav.rewards'), href: '/coming-soon' },
  ];

  return (
    <header className="navbar">
      <a href="#main-content" className="skip-link visually-hidden">
        Skip to main content
      </a>
      <div className="navbar__content">
        <div className="navbar__left">
          <button 
            type="button"
            className="navbar__menu-btn"
            onClick={toggleSidebar}
            aria-label="Toggle menu"
          >
            <MenuIcon aria-hidden="true" />
          </button>

          <a href="/dashboard" className="navbar__brand-text">Michi Mochi</a>
          
          <nav className="navbar__nav" aria-label="Primary">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={item.href}
                aria-current={currentPage === item.id ? 'page' : undefined}
                className={`navbar__nav-link ${currentPage === item.id ? 'navbar__nav-link--active' : ''}`}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="navbar__actions">
          <button 
            type="button"
            className="navbar__icon-btn" 
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          >
            {theme === 'light' ? <DarkMode aria-hidden="true" /> : <LightMode aria-hidden="true" />}
          </button>

          <LanguageToggle variant="navbar" />

          <CurrencyToggle variant="navbar" />

          <a 
            href="/cart"
            className="navbar__cart-btn" 
            aria-label={totalItems > 0 ? `Shopping cart (${totalItems})` : 'Shopping cart'}
          >
            <ShoppingCart aria-hidden="true" />
            {totalItems > 0 && (
              <span className="navbar__cart-badge" aria-hidden="true">{totalItems}</span>
            )}
          </a>

          <div className="navbar__user">
            <button
              type="button"
              className="navbar__avatar"
              popoverTarget={userMenuId}
              aria-label="Open user menu"
            >
              {userName.charAt(0).toUpperCase()}
            </button>

            <div id={userMenuId} popover="auto" className="navbar__menu">
              <a
                href="/admin/catalog"
                className="navbar__menu-item"
              >
                <span aria-hidden="true">⚙️</span> {t('nav.adminCatalog')}
              </a>
              <button
                type="button"
                className="navbar__menu-item"
                onClick={handleLogout}
              >
                {t('nav.logout')}
              </button>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
};

export default Navbar;
