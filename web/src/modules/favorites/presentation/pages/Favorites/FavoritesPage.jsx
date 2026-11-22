import React, { useEffect, useMemo } from 'react';
import { FavoriteBorder } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import Navbar from '@shared/components/Navbar/Navbar';
import SideNavBar from '@shared/components/SideNavBar/SideNavBar';
import ProductCard from '@modules/catalog/presentation/components/ProductCard/ProductCard';
import { useFavoriteStore } from '@modules/favorites/application/stores/favoriteStore';
import { useProductStore } from '@modules/catalog/application/stores/productStore';
import { useCartStore } from '@modules/cart/application/stores/cartStore';
import { useAuthStore } from '@modules/auth/application/stores/authStore';
import { translateProducts } from '@shared/utils/translateProduct';
import './FavoritesPage.css';

export default function FavoritesPage() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const addItem = useCartStore((state) => state.addItem);

  const products = useProductStore((state) => state.products);
  const fetchProducts = useProductStore((state) => state.fetchProducts);

  const favoriteIds = useFavoriteStore((state) => state.favoriteIds);
  const favoriteProducts = useFavoriteStore((state) => state.favoriteProducts);
  const loadFavorites = useFavoriteStore((state) => state.loadFavorites);
  const isLoading = useFavoriteStore((state) => state.isLoading);

  useEffect(() => {
    fetchProducts();
    loadFavorites();
  }, [fetchProducts, loadFavorites]);

  const displayedFavorites = useMemo(() => {
    const source =
      favoriteProducts.length > 0
        ? favoriteProducts
        : products.filter((p) => favoriteIds.includes(String(p.id)));
    return translateProducts(source);
  }, [favoriteProducts, products, favoriteIds, i18n.language]);

  const userName =
    isAuthenticated && user
      ? String(user.fullName || '').trim() || String(user.email || '').split('@')[0] || 'User'
      : '';

  return (
    <div className="favorites-page">
      <Navbar userName={userName} currentPage="favorites" />

      <div className="favorites-page__layout">
        <SideNavBar />

        <main id="main-content" className="favorites-page__main">
          <header className="favorites-page__header">
            <div>
              <h1 className="favorites-page__title">{t('favorites.title')}</h1>
              <p className="favorites-page__subtitle">{t('favorites.subtitle')}</p>
            </div>
            <span className="favorites-page__count">
              {displayedFavorites.length} {t('favorites.itemsLabel')}
            </span>
          </header>

          {!isLoading && displayedFavorites.length === 0 ? (
            <section className="favorites-page__empty">
              <FavoriteBorder className="favorites-page__empty-icon" aria-hidden="true" />
              <h2 className="favorites-page__empty-title">{t('favorites.empty.title')}</h2>
              <p className="favorites-page__empty-text">{t('favorites.empty.text')}</p>
              <a href="/dashboard" className="favorites-page__empty-btn">
                {t('favorites.empty.cta')}
              </a>
            </section>
          ) : (
            <div className="favorites-page__grid">
              {displayedFavorites.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={(prod) => addItem(prod)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
