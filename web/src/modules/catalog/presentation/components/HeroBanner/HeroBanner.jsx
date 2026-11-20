import React from "react";
import { ArrowForward } from "@mui/icons-material";
import { useTranslation } from 'react-i18next';
import "./HeroBanner.css";

export default function HeroBanner({ product, onOrderClick }) {
  const { t } = useTranslation();
  
  if (!product) return null;

  return (
    <section className="hero-banner">
      <div className="hero-banner__overlay" />
      <img
        src="/assets/strawberry-promo.png"
        alt={product.name}
        className="hero-banner__image"
        width={1200}
        height={500}
        fetchPriority="high"
      />
      <div className="hero-banner__content">
        <span className="hero-banner__badge">{t('dashboard.hero.badge')}</span>
        <h1 className="hero-banner__title">{product.name}</h1>
        <p className="hero-banner__description">
          {product.longDescription || product.description}
        </p>
        <button className="hero-banner__btn" onClick={onOrderClick}>
          {t('dashboard.hero.orderNow')} <ArrowForward />
        </button>
      </div>
    </section>
  );
}
