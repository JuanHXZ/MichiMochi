import React, { useEffect, useRef, useState } from "react";
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const totalItems = useCartStore((state) => state.totalItems());
  const { theme, toggleTheme } = useThemeStore();
  const { toggleSidebar } = useSidebarStore();
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

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
      <div className="navbar__content">
        <div className="navbar__left">
          <button 
            className="navbar__menu-btn"
            onClick={toggleSidebar}
            aria-label="Toggle menu"
          >
            <MenuIcon />
          </button>

          <span className="navbar__brand-text">Michi Mochi</span>
          
          <nav className="navbar__nav">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className={`navbar__nav-link ${currentPage === item.id ? 'navbar__nav-link--active' : ''}`}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="navbar__actions">
          <button 
            className="navbar__icon-btn" 
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          >
            {theme === 'light' ? <DarkMode /> : <LightMode />}
          </button>

          <LanguageToggle variant="navbar" />

          <CurrencyToggle variant="navbar" />

          <button 
            className="navbar__cart-btn" 
            aria-label="Shopping cart"
            onClick={() => window.location.href = '/cart'}
          >
            <ShoppingCart />
            {totalItems > 0 && (
              <span className="navbar__cart-badge">{totalItems}</span>
            )}
          </button>

          <div className="navbar__user" ref={userMenuRef}>
            <button
              type="button"
              className="navbar__avatar"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              aria-label="Open user menu"
            >
              {userName.charAt(0).toUpperCase()}
            </button>

            {isMenuOpen && (
              <div className="navbar__menu" role="menu">
                <a
                  href="/admin/catalog"
                  className="navbar__menu-item"
                  role="menuitem"
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  ⚙️ {t('nav.adminCatalog')}
                </a>
                <button
                  type="button"
                  className="navbar__menu-item"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  {t('nav.logout')}
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};

export default Navbar;
