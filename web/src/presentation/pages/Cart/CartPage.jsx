import React, { useState, useMemo } from 'react';
import { Delete, LocalShipping, CardGiftcard } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import Navbar from '@/presentation/components/layout/Navbar/Navbar';
import SideNavBar from '@/presentation/components/layout/SideNavBar/SideNavBar';
import { useCartStore } from '@/application/stores/cartStore';
import { useAuthStore } from '@/application/stores/authStore';
import { translateProducts } from '@/shared/utils/translateProduct';
import { useCurrency } from '@/application/hooks/useCurrency';
import { calculateOrderSummary } from '@/domain/calculations/orderCalculator';
import { BUSINESS_CONSTANTS } from '@/domain/constants/businessConstants';
import './CartPage.css';

export default function CartPage() {
  const { t, i18n } = useTranslation();
  const { format: formatPrice } = useCurrency();
  const [promoCode, setPromoCode] = useState('');
  const { items: rawItems, updateQuantity, removeItem } = useCartStore();
  const user = useAuthStore((state) => state.user);

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
    });
  }, [items]);

  const handleBack = () => {
    window.history.back();
  };

  const handleCheckout = () => {
    alert('Proceeding to checkout...');
  };

  const handleApplyPromo = () => {
    alert(`Applying promo code: ${promoCode}`);
  };

  if (items.length === 0) {
    return (
      <div className="cart">
        <Navbar userName={userName} currentPage="cart" />
        <div className="cart__layout">
          <SideNavBar />
          <div className="cart__empty">
            <h1 className="cart__empty-title">{t('cart.empty.title')}</h1>
            <p className="cart__empty-text">{t('cart.empty.text')}</p>
            <button onClick={handleBack} className="cart__empty-btn">
              {t('cart.empty.button')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart">
      <Navbar userName={userName} currentPage="cart" />

      <div className="cart__layout">
        <SideNavBar />

        <main className="cart__content">
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
                  />
                  
                  <div className="cart-item__details">
                    <div className="cart-item__header">
                      <div>
                        <h3 className="cart-item__name">{item.name}</h3>
                        {item.featured && (
                          <span className="cart-item__badge">{t('cart.item.limited')}</span>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="cart-item__delete"
                        aria-label="Remove item"
                      >
                        <Delete />
                      </button>
                    </div>
                    
                    <p className="cart-item__description">{item.description}</p>
                    
                    <div className="cart-item__footer">
                      <div className="cart-item__quantity">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="cart-item__quantity-btn"
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="cart-item__quantity-value">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="cart-item__quantity-btn"
                          aria-label="Increase quantity"
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
              
              <div className="cart-summary__divider"></div>
              
              <div className="cart-summary__total">
                <span className="cart-summary__total-label">{t('cart.summary.total')}</span>
                <span className="cart-summary__total-value">{formatPrice(summary.total).formatted}</span>
              </div>
              
              {/* Promo Code */}
              <div className="cart-summary__promo">
                <input
                  type="text"
                  placeholder={t('cart.summary.promoPlaceholder')}
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="cart-summary__promo-input"
                />
                <button
                  onClick={handleApplyPromo}
                  className="cart-summary__promo-btn"
                  disabled={!promoCode.trim()}
                >
                  {t('cart.summary.promoApply')}
                </button>
              </div>
              
              <button 
                onClick={handleCheckout}
                className="cart-summary__checkout-btn"
              >
                {t('cart.summary.checkout')}
              </button>
              
              <p className="cart-summary__terms">
                {t('cart.summary.terms')}
              </p>
            </div>

            <div className="cart-rewards">
              <CardGiftcard className="cart-rewards__icon" />
              <div className="cart-rewards__content">
                <h3 className="cart-rewards__title">{t('cart.rewards.title')}</h3>
                <p className="cart-rewards__text">
                  {t('cart.rewards.text')}
                </p>
              </div>
            </div>

            <div className="cart-delivery">
              <LocalShipping className="cart-delivery__icon" />
              <div className="cart-delivery__content">
                <h3 className="cart-delivery__title">{t('cart.delivery.title')}</h3>
                <p className="cart-delivery__text">{t('cart.delivery.text')}</p>
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
