import React, { useState, useMemo, useEffect } from 'react';
import { Delete, LocalShipping, CardGiftcard, Close, LocalOffer } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import Navbar from '@shared/components/Navbar/Navbar';
import SideNavBar from '@shared/components/SideNavBar/SideNavBar';
import { useCartStore } from '@modules/cart/application/stores/cartStore';
import { useAuthStore } from '@modules/auth/application/stores/authStore';
import { promoService } from '@modules/cart/infrastructure/services/promoService';
import { translateProducts } from '@shared/utils/translateProduct';
import { useCurrency } from '@modules/cart/application/hooks/useCurrency';
import { calculateOrderSummary } from '@modules/cart/domain/orderCalculator';
import { BUSINESS_CONSTANTS } from '@shared/constants/businessConstants';
import { useToastStore } from '@shared/stores/toastStore';
import './CartPage.css';

export default function CartPage() {
  const { t, i18n } = useTranslation();
  const { format: formatPrice } = useCurrency();
  const showToast = useToastStore((state) => state.showToast);
  const [promoCode, setPromoCode] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const {
    items: rawItems,
    updateQuantity,
    removeItem,
    appliedPromo,
    setAppliedPromo,
    clearAppliedPromo,
  } = useCartStore();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const items = useMemo(() => {
    return translateProducts(rawItems);
  }, [rawItems, i18n.language]);

  const userName = useMemo(() => {
    if (!user) return "Usuario";
    return String(user.fullName || "").trim() ||
           String(user.email || "").split("@")[0] ||
           "Usuario";
  }, [user]);

  const summary = useMemo(() => {
    return calculateOrderSummary(items, {
      deliveryFee: BUSINESS_CONSTANTS.DELIVERY_FEE,
      taxRate: BUSINESS_CONSTANTS.TAX_RATE,
      discountAmount: appliedPromo?.discountAmount || 0,
    });
  }, [items, appliedPromo?.discountAmount]);

  useEffect(() => {
    if (!appliedPromo?.code || summary.subtotal <= 0) return;
    let active = true;
    promoService
      .validatePromoCode(appliedPromo.code, summary.subtotal)
      .then((res) => {
        if (!active) return;
        if (Math.abs((res.discountAmount || 0) - (appliedPromo.discountAmount || 0)) > 0.001) {
          setAppliedPromo({
            code: res.code,
            discountAmount: res.discountAmount,
            description: res.description,
            discountType: res.discountType,
            discountValue: res.discountValue,
          });
        }
      })
      .catch(() => {
        if (!active) return;
        clearAppliedPromo();
      });
    return () => {
      active = false;
    };
  }, [summary.subtotal, appliedPromo?.code, appliedPromo?.discountAmount, setAppliedPromo, clearAppliedPromo]);

  const handleBack = () => {
    window.history.back();
  };

  const handleCheckout = () => {
    if (!isAuthenticated || !user) {
      window.location.href = '/login';
      return;
    }
    window.location.assign('/checkout');
  };

  const handleApplyPromo = async () => {
    const clean = promoCode.trim().toUpperCase();
    if (!clean || isApplyingPromo) return;
    setIsApplyingPromo(true);
    try {
      const res = await promoService.validatePromoCode(clean, summary.subtotal);
      setAppliedPromo({
        code: res.code,
        discountAmount: res.discountAmount,
        description: res.description,
        discountType: res.discountType,
        discountValue: res.discountValue,
      });
      setPromoCode('');
      showToast({
        message: t('cart.summary.promoAppliedToast', {
          code: res.code,
          discount: formatPrice(res.discountAmount).formatted,
        }),
        type: 'success',
      });
    } catch (err) {
      showToast({
        message: err.message || t('cart.summary.promoInvalid'),
        type: 'error',
      });
    } finally {
      setIsApplyingPromo(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="cart">
        <Navbar userName={userName} currentPage="cart" />
        <div className="cart__layout">
          <SideNavBar />
          <main id="main-content" className="cart__empty">
            <h1 className="cart__empty-title">{t('cart.empty.title')}</h1>
            <p className="cart__empty-text">{t('cart.empty.text')}</p>
            <button type="button" onClick={handleBack} className="cart__empty-btn">
              {t('cart.empty.button')}
            </button>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="cart">
      <Navbar userName={userName} currentPage="cart" />

      <div className="cart__layout">
        <SideNavBar />

        <main id="main-content" className="cart__content">
          <section className="cart__items-section">
            <div className="cart__header">
              <h1 className="cart__title">{t('cart.title')}</h1>
              <p className="cart__subtitle">{t('cart.subtitle')}</p>
            </div>

            <div className="cart__items">
              {items.map((item) => (
                <div key={item.id} className="cart-item">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="cart-item__image"
                    width={128}
                    height={128}
                    loading="lazy"
                    decoding="async"
                  />
                  
                  <div className="cart-item__details">
                    <div className="cart-item__header">
                      <div>
                        <h2 className="cart-item__name">{item.name}</h2>
                        {item.featured && (
                          <span className="cart-item__badge">{t('cart.item.limited')}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="cart-item__delete"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Delete aria-hidden="true" />
                      </button>
                    </div>
                    
                    <p className="cart-item__description">{item.description}</p>
                    
                    <div className="cart-item__footer">
                      <div className="cart-item__quantity">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="cart-item__quantity-btn"
                          disabled={item.quantity <= 1}
                          aria-label={`Decrease quantity for ${item.name}`}
                        >
                          −
                        </button>
                        <span className="cart-item__quantity-value">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="cart-item__quantity-btn"
                          aria-label={`Increase quantity for ${item.name}`}
                        >
                          +
                        </button>
                      </div>
                      
                      <div className="cart-item__price">
                        {item.originalPrice && item.originalPrice > item.price && (
                          <span className="cart-item__price-original">{formatPrice(item.originalPrice).formatted}</span>
                        )}
                        <span className="cart-item__price-total">{formatPrice(item.price * item.quantity).formatted}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="cart__sidebar">
            <div className="cart-summary">
              <h2 className="cart-summary__title">{t('cart.summary.title')}</h2>
              
              <div className="cart-summary__line">
                <span className="cart-summary__label">{t('cart.summary.subtotal')}</span>
                <span className="cart-summary__value">{formatPrice(summary.subtotal).formatted}</span>
              </div>
              
              <div className="cart-summary__line">
                <span className="cart-summary__label">{t('cart.summary.deliveryFee')}</span>
                <span className="cart-summary__value">{formatPrice(summary.shipping).formatted}</span>
              </div>
              
              <div className="cart-summary__line">
                <span className="cart-summary__label">{t('cart.summary.tax')}</span>
                <span className="cart-summary__value">{formatPrice(summary.tax).formatted}</span>
              </div>
              
              {summary.savings > 0 && (
                <div className="cart-summary__line cart-summary__line--savings">
                  <span className="cart-summary__label">{t('cart.summary.saving')}</span>
                  <span className="cart-summary__value cart-summary__value--savings">
                    −{formatPrice(summary.savings).formatted}
                  </span>
                </div>
              )}

              {appliedPromo && summary.discountAmount > 0 && (
                <div className="cart-summary__line cart-summary__line--savings">
                  <span className="cart-summary__label">
                    {t('cart.summary.promoDiscount', { code: appliedPromo.code })}
                  </span>
                  <span className="cart-summary__value cart-summary__value--savings">
                    −{formatPrice(summary.discountAmount).formatted}
                  </span>
                </div>
              )}
              
              <div className="cart-summary__divider"></div>
              
              <div className="cart-summary__total">
                <span className="cart-summary__total-label">{t('cart.summary.total')}</span>
                <span className="cart-summary__total-value">{formatPrice(summary.total).formatted}</span>
              </div>
              
              {/* Promo Code */}
              {appliedPromo ? (
                <div className="cart-summary__promo-applied" role="status">
                  <div className="cart-summary__promo-chip">
                    <LocalOffer fontSize="small" aria-hidden="true" />
                    <div className="cart-summary__promo-chip-info">
                      <strong>{appliedPromo.code}</strong>
                      {appliedPromo.description && <span>{appliedPromo.description}</span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearAppliedPromo}
                    className="cart-summary__promo-remove"
                    aria-label={t('cart.summary.promoRemove')}
                    title={t('cart.summary.promoRemove')}
                  >
                    <Close fontSize="small" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <div className="cart-summary__promo">
                  <label htmlFor="cart-promo-code" className="visually-hidden">
                    {t('cart.summary.promoPlaceholder')}
                  </label>
                  <input
                    id="cart-promo-code"
                    name="promoCode"
                    type="text"
                    placeholder={t('cart.summary.promoPlaceholder')}
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyPromo();
                      }
                    }}
                    className="cart-summary__promo-input"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="cart-summary__promo-btn"
                    disabled={!promoCode.trim() || isApplyingPromo}
                  >
                    {isApplyingPromo ? '...' : t('cart.summary.promoApply')}
                  </button>
                </div>
              )}
              
              <button 
                type="button"
                onClick={handleCheckout}
                className="cart-summary__checkout-btn"
              >
                {t('cart.summary.checkout')}
              </button>
              
              <p className="cart-summary__terms">
                {t('cart.summary.terms')}
              </p>
            </div>

            <a href="/rewards" className="cart-rewards cart-rewards--link">
              <CardGiftcard className="cart-rewards__icon" aria-hidden="true" />
              <div className="cart-rewards__content">
                <h2 className="cart-rewards__title">
                  {t('cart.rewards.earnTitle', { points: Math.floor(summary.subtotal * 10) })}
                </h2>
                <p className="cart-rewards__text">
                  {t('cart.rewards.earnText')}
                </p>
              </div>
            </a>

            <div className="cart-delivery">
              <LocalShipping className="cart-delivery__icon" aria-hidden="true" />
              <div className="cart-delivery__content">
                <h2 className="cart-delivery__title">{t('cart.delivery.title')}</h2>
                <p className="cart-delivery__text">{t('cart.delivery.text')}</p>
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
