import React from "react";
import { AddShoppingCart, Favorite } from "@mui/icons-material";
import { useTranslation } from 'react-i18next';
import { useFormattedPrice } from '@/modules/cart/application/hooks/useCurrency';
import { useCartStore } from '@/modules/cart/application/stores/cartStore';
import "./ProductCard.css";

export default function ProductCard({ product, onAddToCart }) {
  const { t } = useTranslation();
  const formattedPrice = useFormattedPrice(product?.price || 0);
  const formattedOriginalPrice = useFormattedPrice(product?.originalPrice || 0);
  const addItem = useCartStore((state) => state.addItem);

  if (!product) return null;

  const isOutOfStock = product.inStock === false || (typeof product.stock === 'number' && product.stock <= 0);
  const discount = Number(product.discount) || 0;
  const hasDiscount = discount > 0;
  const showOriginalPrice = hasDiscount && Number(product.originalPrice) > Number(product.price);

  const handleAddClick = () => {
    if (isOutOfStock) return;
    if (typeof onAddToCart === 'function') {
      onAddToCart(product);
    } else {
      addItem(product);
    }
  };

  return (
    <article className={`stitch-card ${isOutOfStock ? 'stitch-card--out-of-stock' : ''}`}>
      <div className="stitch-card__image-container">
        <img
          src={product.image}
          alt={product.name}
          className="stitch-card__image"
          width={400}
          height={400}
          loading="lazy"
          decoding="async"
        />
        {isOutOfStock && (
          <span className="stitch-card__sold-out-badge" role="status">
            {t('dashboard.card.soldOut')}
          </span>
        )}
        {hasDiscount && !isOutOfStock && (
          <span className="stitch-card__discount-badge">
            -{discount}%
          </span>
        )}
        <button
          type="button"
          className="stitch-card__favorite"
          aria-label={`Add ${product.shortName || product.name} to favorites`}
        >
          <Favorite aria-hidden="true" />
        </button>
      </div>

      <div className="stitch-card__body">
        <div className="stitch-card__header">
          <div>
            <h3 className="stitch-card__title">
              <a href={`/product/${product.id}`} className="stitch-card__link">
                {product.shortName || product.name}
              </a>
            </h3>
            <p className="stitch-card__subtitle">{product.description}</p>
          </div>
          <div className="stitch-card__price-group">
            <span className="stitch-card__price">{formattedPrice.formatted}</span>
            {showOriginalPrice && (
              <span className="stitch-card__original-price">
                {formattedOriginalPrice.formatted}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          className="stitch-card__add-btn"
          onClick={handleAddClick}
          disabled={isOutOfStock}
        >
          <AddShoppingCart fontSize="small" aria-hidden="true" />{' '}
          {isOutOfStock ? t('dashboard.card.soldOut') : t('dashboard.card.add')}
        </button>
      </div>
    </article>
  );
}
