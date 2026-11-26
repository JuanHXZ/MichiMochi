import React from "react";
import { ArrowForward } from "@mui/icons-material";
import { useTranslation } from 'react-i18next';
import "./HeroBanner.css";

const FALLBACK_HERO_IMAGE = "/assets/strawberry-promo.png";

export default function HeroBanner({ product, onOrderClick }) {
  const { t } = useTranslation();
  
  if (!product) return null;

  const heroImage = product.image || product.images?.[0] || FALLBACK_HERO_IMAGE;

  return (
    <section className="hero-banner">
      <div className="hero-banner__overlay" />
      <img
        src={heroImage}
        alt={product.name}
        className="hero-banner__image"
        width={1200}
        height={500}
        fetchPriority="high"
        onError={(e) => {
          if (!e.currentTarget.src.endsWith(FALLBACK_HERO_IMAGE)) {
            e.currentTarget.src = FALLBACK_HERO_IMAGE;
          }
        }}
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
