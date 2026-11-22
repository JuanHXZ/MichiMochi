import React, { useState, useMemo, useEffect } from 'react';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import Navbar from '@shared/components/Navbar/Navbar';
import SideNavBar from '@shared/components/SideNavBar/SideNavBar';
import ImageCarousel from '../../components/ImageCarousel/ImageCarousel';
import { useCartStore } from '@/modules/cart/application/stores/cartStore';
import { useAuthStore } from '@/modules/auth/application/stores/authStore';
import { useFavoriteStore } from '@/modules/favorites/application/stores/favoriteStore';
import { useToastStore } from '@shared/stores/toastStore';
import { useProductStore } from '../../../application/stores/productStore';
import { useTranslatedProduct } from '../../../application/hooks/useTranslatedProducts';
import { useCurrency } from '@/modules/cart/application/hooks/useCurrency';
import './ProductDetailPage.css';

export default function ProductDetailPage() {
  const { t } = useTranslation();
  const { format: formatPrice } = useCurrency();
  const [quantity, setQuantity] = useState(1);
  const [selectedFlavor, setSelectedFlavor] = useState(null);
  const addItem = useCartStore((state) => state.addItem);
  const user = useAuthStore((state) => state.user);
  const fetchProductById = useProductStore((state) => state.fetchProductById);
  const showToast = useToastStore((state) => state.showToast);
  const favoriteIds = useFavoriteStore((state) => state.favoriteIds);
  const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite);

  const productId = useMemo(() => {
    const path = window.location.pathname;
    return path.split('/product/')[1];
  }, []);

  useEffect(() => {
    if (productId) {
      fetchProductById(productId);
    }
  }, [productId, fetchProductById]);

  const product = useTranslatedProduct(productId);
  const activeFlavor = selectedFlavor ?? (product?.flavors?.[0]?.id ?? null);
  const isFavorite = product ? favoriteIds.includes(String(product.id)) : false;
  const isOutOfStock = Boolean(
    product && (product.inStock === false || (typeof product.stock === 'number' && product.stock <= 0))
  );

  const userName = useMemo(() => {
    if (!user) return "Usuario";
    return String(user.fullName || "").trim() ||
           String(user.email || "").split("@")[0] ||
           "Usuario";
  }, [user]);

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleAddToCart = () => {
    if (product && !isOutOfStock) {
      for (let i = 0; i < quantity; i++) {
        addItem({ ...product, selectedFlavor: activeFlavor });
      }
    }
  };

  const handleToggleFavorite = async () => {
    if (!product) return;
    try {
      const nowFavorite = await toggleFavorite(product);
      showToast({
        message: nowFavorite
          ? t('favorites.addedToast', { name: product.shortName || product.name })
          : t('favorites.removedToast', { name: product.shortName || product.name }),
        type: 'info',
      });
    } catch (err) {
      showToast({
        message: err.message || 'Error al actualizar favoritos',
        type: 'error',
      });
    }
  };

  if (!product) {
    return (
      <div className="product-detail">
        <Navbar userName={userName} />
        <div className="product-detail__layout">
          <SideNavBar />
          <div className="product-detail__error">
            <h1>{t('productDetail.notFound')}</h1>
          </div>
        </div>
      </div>
    );
  }

  const totalPrice = product.price * quantity;

  return (
    <div className="product-detail">
      <Navbar userName={userName} />

      <div className="product-detail__layout">
        <SideNavBar />

        <main id="main-content" className="product-detail__main">
          <div className="product-detail__content">
            <section className="product-detail__image-section">
              <div className="product-detail__image-container">
                <ImageCarousel
                  key={product.id}
                  images={product.images || [product.image]}
                  productName={product.name}
                />
                {product.featured && !isOutOfStock && (
                  <span className="product-detail__badge">
                    {t('productDetail.badge')}
                  </span>
                )}
                {isOutOfStock && (
                  <span className="product-detail__badge product-detail__badge--sold-out" role="status">
                    {t('dashboard.card.soldOut')}
                  </span>
                )}
              </div>
            </section>

            <section className="product-detail__info">
              <nav className="product-detail__breadcrumbs" aria-label="Breadcrumb">
                <ol className="product-detail__breadcrumb-list">
                  <li>
                    <a href="/dashboard" className="product-detail__breadcrumb-link">{t('productDetail.breadcrumbs.catalog')}</a>
                  </li>
                  <li>
                    <a href="/dashboard" className="product-detail__breadcrumb-link">
                      {product.category || 'Daifuku'}
                    </a>
                  </li>
                  <li>
                    <a href={window.location.pathname} aria-current="page" className="product-detail__breadcrumb-current">
                      {product.name}
                    </a>
                  </li>
                </ol>
              </nav>

              <div className="product-detail__title-row">
                <h1 className="product-detail__title">{product.name}</h1>
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  aria-pressed={isFavorite}
                  aria-label={
                    isFavorite
                      ? `Remove ${product.shortName || product.name} from favorites`
                      : `Add ${product.shortName || product.name} to favorites`
                  }
                  className={`product-detail__favorite-btn ${isFavorite ? 'product-detail__favorite-btn--active' : ''}`}
                >
                  {isFavorite ? <Favorite aria-hidden="true" /> : <FavoriteBorder aria-hidden="true" />}
                </button>
              </div>

              <div className="product-detail__price-row">
                <div className="product-detail__price">
                  <span>{formatPrice(product.price).formatted}</span>
                  {product.discount > 0 && (
                    <>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="product-detail__original-price">
                          {formatPrice(product.originalPrice).formatted}
                        </span>
                      )}
                      <span className="product-detail__discount">
                        -{product.discount}%
                      </span>
                    </>
                  )}
                </div>
                <div className="product-detail__rating-badge">
                  <span aria-hidden="true">⭐</span>
                  <span>{product.rating}/5 ({product.reviewCount}+ {t('productDetail.reviews')})</span>
                </div>
              </div>

              <p className="product-detail__description">
                {product.longDescription || product.description}
              </p>

              <div className="product-detail__flavors">
                <h2 className="product-detail__flavors-title">{t('productDetail.selectFlavor')}</h2>
                <div className="product-detail__flavors-list">
                  {product.flavors?.map((flavor) => (
                    <button
                      type="button"
                      key={flavor.id}
                      onClick={() => setSelectedFlavor(flavor.id)}
                      aria-pressed={activeFlavor === flavor.id}
                      className={`product-detail__flavor-btn ${
                        activeFlavor === flavor.id ? 'active' : ''
                      }`}
                    >
                      {flavor.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="product-detail__actions-row">
                <div className="product-detail__quantity">
                  <button 
                    type="button"
                    onClick={() => handleQuantityChange(-1)}
                    className="product-detail__quantity-btn"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="product-detail__quantity-value">{quantity}</span>
                  <button 
                    type="button"
                    onClick={() => handleQuantityChange(1)}
                    className="product-detail__quantity-btn"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <button 
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="product-detail__add-to-cart-desktop"
                >
                  <span aria-hidden="true">🛒</span>
                  <span>{isOutOfStock ? t('dashboard.card.soldOut') : t('productDetail.addToCart')}</span>
                  {!isOutOfStock && (
                    <span className="product-detail__total-price">{formatPrice(totalPrice).formatted}</span>
                  )}
                </button>
              </div>
            </section>
          </div>

          <section className="product-detail__features">
            <div className="product-detail__feature">
              <div className="product-detail__feature-icon" aria-hidden="true">🌾</div>
              <div className="product-detail__feature-content">
                <h2 className="product-detail__feature-title">{t('productDetail.features.organic.title')}</h2>
                <p className="product-detail__feature-description">{t('productDetail.features.organic.description')}</p>
              </div>
            </div>
            <div className="product-detail__feature">
              <div className="product-detail__feature-icon" aria-hidden="true">⏰</div>
              <div className="product-detail__feature-content">
                <h2 className="product-detail__feature-title">{t('productDetail.features.fresh.title')}</h2>
                <p className="product-detail__feature-description">{t('productDetail.features.fresh.description')}</p>
              </div>
            </div>
            <div className="product-detail__feature">
              <div className="product-detail__feature-icon" aria-hidden="true">💧</div>
              <div className="product-detail__feature-content">
                <h2 className="product-detail__feature-title">{t('productDetail.features.sweetness.title')}</h2>
                <p className="product-detail__feature-description">{t('productDetail.features.sweetness.description')}</p>
              </div>
            </div>
          </section>

          {/* Story Section */}
          <section className="product-detail__story">
            <div className="product-detail__story-content">
              <h2 className="product-detail__story-title">{t('productDetail.story.title')}</h2>
              <p className="product-detail__story-text">
                {t('productDetail.story.description1')}
              </p>
              <p className="product-detail__story-text">
                {t('productDetail.story.description2')}
              </p>
              <a href="/coming-soon" className="product-detail__story-link">
                <span>{t('productDetail.story.link')}</span>
                <span aria-hidden="true">→</span>
              </a>
            </div>
            <div className="product-detail__story-image">
              <img 
                src="https://images.unsplash.com/photo-1582716401301-b2407dc7563d?w=600" 
                alt="Traditional Mochitsuki process"
                className="product-detail__story-img"
                width={600}
                height={450}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            </div>
          </section>

          <div className="product-detail__bottom-bar">
            <button 
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="product-detail__add-to-cart"
            >
              <span>{isOutOfStock ? t('dashboard.card.soldOut') : t('productDetail.addToCart')}</span>
              {!isOutOfStock && (
                <span className="product-detail__total-price">{formatPrice(totalPrice).formatted}</span>
              )}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
