import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CreditCard,
  LocalShipping,
  AccountBalance,
  Smartphone,
  Payments,
  VerifiedUser,
  ArrowBack,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import Navbar from '@shared/components/Navbar/Navbar';
import SideNavBar from '@shared/components/SideNavBar/SideNavBar';
import { useCartStore } from '@modules/cart/application/stores/cartStore';
import { useAuthStore } from '@modules/auth/application/stores/authStore';
import { useOrderStore } from '@modules/orders/application/stores/orderStore';
import { useCurrency } from '@modules/cart/application/hooks/useCurrency';
import { calculateOrderSummary } from '@modules/cart/domain/orderCalculator';
import { translateProducts } from '@shared/utils/translateProduct';
import { BUSINESS_CONSTANTS } from '@shared/constants/businessConstants';
import { useToastStore } from '@shared/stores/toastStore';
import './CheckoutPage.css';

const PAYMENT_METHODS = [
  { id: 'card', Icon: CreditCard },
  { id: 'nequi', Icon: Smartphone },
  { id: 'pse', Icon: AccountBalance },
  { id: 'cash_on_delivery', Icon: Payments },
];

const formatCardNumberInput = (raw) => {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
};

const formatExpiryInput = (raw) => {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
};

export default function CheckoutPage() {
  const { t } = useTranslation();
  const { currency, format: formatPrice } = useCurrency();
  const showToast = useToastStore((state) => state.showToast);

  const user = useAuthStore((state) => state.user);
  const rawItems = useCartStore((state) => state.items);
  const appliedPromo = useCartStore((state) => state.appliedPromo);
  const clearCart = useCartStore((state) => state.clearCart);
  const createOrder = useOrderStore((state) => state.createOrder);
  const isSubmitting = useOrderStore((state) => state.isSubmitting);

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState(user?.city || '');
  const [notes, setNotes] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardHolder, setCardHolder] = useState(user?.fullName || '');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCsc, setCardCsc] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const formRef = useRef(null);
  const liveAnnouncerRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    setFullName((prev) => prev || user.fullName || '');
    setPhone((prev) => prev || user.phone || '');
    setAddress((prev) => prev || user.address || '');
    setCity((prev) => prev || user.city || '');
    setCardHolder((prev) => prev || user.fullName || '');
  }, [user]);

  const items = translateProducts(rawItems);

  const summary = useMemo(
    () =>
      calculateOrderSummary(items, {
        deliveryFee: BUSINESS_CONSTANTS.DELIVERY_FEE,
        taxRate: BUSINESS_CONSTANTS.TAX_RATE,
        discountAmount: appliedPromo?.discountAmount || 0,
      }),
    [items, appliedPromo?.discountAmount]
  );

  const userName = useMemo(() => {
    if (!user) return 'Usuario';
    return (
      String(user.fullName || '').trim() ||
      String(user.email || '').split('@')[0] ||
      'Usuario'
    );
  }, [user]);

  // Synchronize aria-invalid and error descriptions after interaction (:user-invalid + fallback)
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const supportsUserInvalid =
      typeof CSS !== 'undefined' && CSS.supports('selector(:user-invalid)');
    const dirtyState = new WeakMap();
    const flagged = new WeakSet();
    const announced = new WeakSet();
    let announceTimer = null;
    let announcedField = null;

    const linkError = (el, shown) => {
      const errorId = el.dataset.error;
      if (!errorId) return;
      const ids = (el.getAttribute('aria-describedby') || '')
        .split(/\s+/)
        .filter((id) => id && id !== errorId);
      if (shown) ids.push(errorId);
      if (ids.length) {
        el.setAttribute('aria-describedby', ids.join(' '));
      } else {
        el.removeAttribute('aria-describedby');
      }
    };

    const announceError = (el) => {
      const announcer = liveAnnouncerRef.current;
      const errorEl = el.dataset.error ? document.getElementById(el.dataset.error) : null;
      if (!announcer || !errorEl) return;
      const labelText = el.labels?.[0]?.textContent?.trim();
      const prefix = labelText ? `${labelText}: ` : '';
      clearTimeout(announceTimer);
      announcer.textContent = '';
      announcedField = el;
      announceTimer = setTimeout(() => {
        announcer.textContent = prefix + errorEl.textContent.replace(/\s+/g, ' ').trim();
      }, 450);
    };

    const syncAria = (el, shouldAnnounce = false) => {
      if (!el?.matches?.('input, select, textarea')) return;

      let invalid = false;
      if (supportsUserInvalid) {
        invalid = el.matches(':user-invalid');
      } else {
        const state = dirtyState.get(el);
        const isValid = el.validity.valid;
        if (state?.hasBlurred && state?.hasInteracted) {
          el.classList.toggle('user-invalid-fallback', !isValid);
          el.classList.toggle('user-valid-fallback', isValid);
          invalid = !isValid;
        }
      }

      if (invalid) {
        if (shouldAnnounce && !announced.has(el)) {
          announceError(el);
          announced.add(el);
        }
        el.setAttribute('aria-invalid', 'true');
        linkError(el, true);
        flagged.add(el);
      } else if (flagged.has(el) || el.getAttribute('aria-invalid') !== 'true') {
        el.setAttribute('aria-invalid', 'false');
        linkError(el, false);
        flagged.delete(el);
        announced.delete(el);
        if (announcedField === el && liveAnnouncerRef.current) {
          clearTimeout(announceTimer);
          liveAnnouncerRef.current.textContent = '';
        }
      }
    };

    form.querySelectorAll('input, select, textarea').forEach((el) => {
      if (!el.hasAttribute('aria-invalid')) {
        el.setAttribute('aria-invalid', 'false');
      }
    });

    const onBlur = (e) => {
      const el = e.target;
      if (!supportsUserInvalid && el?.matches?.('input, select, textarea')) {
        const state = dirtyState.get(el) || { hasInteracted: false, hasBlurred: false };
        state.hasBlurred = true;
        dirtyState.set(el, state);
      }
      syncAria(el, true);
    };

    const onInput = (e) => {
      const el = e.target;
      if (!supportsUserInvalid && el?.matches?.('input, select, textarea')) {
        const state = dirtyState.get(el) || { hasInteracted: false, hasBlurred: false };
        state.hasInteracted = true;
        dirtyState.set(el, state);
      }
      if (el?.hasAttribute?.('aria-invalid')) {
        syncAria(el, false);
      }
    };

    const onChange = (e) => syncAria(e.target, true);

    const onInvalid = (e) => {
      const el = e.target;
      if (!supportsUserInvalid && el?.matches?.('input, select, textarea')) {
        dirtyState.set(el, { hasInteracted: true, hasBlurred: true });
      }
      announced.add(el);
      syncAria(el, false);
    };

    form.addEventListener('blur', onBlur, true);
    form.addEventListener('input', onInput);
    form.addEventListener('change', onChange, true);
    form.addEventListener('invalid', onInvalid, true);

    return () => {
      clearTimeout(announceTimer);
      form.removeEventListener('blur', onBlur, true);
      form.removeEventListener('input', onInput);
      form.removeEventListener('change', onChange, true);
      form.removeEventListener('invalid', onInvalid, true);
    };
  }, [paymentMethod, items.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const form = formRef.current;
    if (form && !form.checkValidity()) {
      form.reportValidity();
      const firstInvalid = form.querySelector(':invalid');
      firstInvalid?.focus();
      return;
    }

    const cardDigits = cardNumber.replace(/\D/g, '');
    const payload = {
      items: rawItems.map((item) => ({
        productId: String(item.id),
        quantity: Number(item.quantity) || 1,
        ...(item.selectedFlavor ? { flavor: String(item.selectedFlavor) } : {}),
      })),
      shippingAddress: {
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      },
      payment: {
        method: paymentMethod,
        ...(paymentMethod === 'card' && cardDigits.length >= 4
          ? {
              cardLast4: cardDigits.slice(-4),
              cardHolder: cardHolder.trim(),
            }
          : {}),
        simulateOutcome: 'approved',
      },
      currency,
      ...(appliedPromo?.code ? { promoCode: appliedPromo.code } : {}),
    };

    setProcessingPayment(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 650));
      const created = await createOrder(payload);
      clearCart();
      showToast({
        message: t('checkout.successToast', { orderNumber: created.orderNumber }),
        type: 'success',
      });
      window.location.assign(`/orders/${created.id}`);
    } catch (err) {
      setSubmitError(err.message || t('checkout.errorGeneric'));
      showToast({
        message: err.message || t('checkout.errorGeneric'),
        type: 'error',
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="checkout">
        <Navbar userName={userName} currentPage="cart" />
        <div className="checkout__layout">
          <SideNavBar />
          <main id="main-content" className="checkout__empty">
            <h1 className="checkout__empty-title">{t('checkout.empty.title')}</h1>
            <p className="checkout__empty-text">{t('checkout.empty.text')}</p>
            <div className="checkout__empty-actions">
              <a href="/dashboard" className="checkout__btn checkout__btn--primary">
                {t('checkout.empty.backToCatalog')}
              </a>
              <a href="/orders" className="checkout__btn checkout__btn--secondary">
                {t('checkout.empty.goToOrders')}
              </a>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const isBusy = isSubmitting || processingPayment;

  return (
    <div className="checkout">
      <Navbar userName={userName} currentPage="cart" />
      <div className="checkout__layout">
        <SideNavBar />

        <main id="main-content" className="checkout__main">
          <div className="checkout__header">
            <a href="/cart" className="checkout__back-link">
              <ArrowBack aria-hidden="true" fontSize="small" />
              <span>{t('checkout.backToCart')}</span>
            </a>
            <h1 className="checkout__title">{t('checkout.title')}</h1>
            <p className="checkout__subtitle">{t('checkout.subtitle')}</p>
          </div>

          <div className="checkout__sim-banner" role="note">
            <VerifiedUser className="checkout__sim-banner-icon" aria-hidden="true" />
            <div>
              <strong className="checkout__sim-banner-title">
                {t('checkout.simulationBanner.title')}
              </strong>
              <p className="checkout__sim-banner-text">
                {t('checkout.simulationBanner.text')}
              </p>
            </div>
          </div>

          <div ref={liveAnnouncerRef} aria-live="polite" className="visually-hidden" />

          <div className="checkout__grid">
            <form ref={formRef} onSubmit={handleSubmit} className="checkout__form">
              {/* Step 1: Shipping Address */}
              <section className="checkout-card" aria-labelledby="checkout-shipping-heading">
                <div className="checkout-card__header">
                  <LocalShipping className="checkout-card__icon" aria-hidden="true" />
                  <h2 id="checkout-shipping-heading" className="checkout-card__title">
                    {t('checkout.shipping.title')}
                  </h2>
                </div>

                <div className="checkout-form-grid">
                  <div className="checkout-field">
                    <label htmlFor="checkout-fullname" className="checkout-label">
                      {t('checkout.shipping.fullName')}
                    </label>
                    <input
                      id="checkout-fullname"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      required
                      minLength={2}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t('checkout.shipping.fullNamePlaceholder')}
                      data-error="checkout-fullname-error"
                      className="checkout-input"
                    />
                    <div id="checkout-fullname-error" className="checkout-error-msg">
                      <span role="img" aria-label="Error">⚠️</span> {t('checkout.errors.fullName')}
                    </div>
                  </div>

                  <div className="checkout-field">
                    <label htmlFor="checkout-phone" className="checkout-label">
                      {t('checkout.shipping.phone')}
                    </label>
                    <input
                      id="checkout-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      required
                      minLength={7}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t('checkout.shipping.phonePlaceholder')}
                      data-error="checkout-phone-error"
                      className="checkout-input"
                    />
                    <div id="checkout-phone-error" className="checkout-error-msg">
                      <span role="img" aria-label="Error">⚠️</span> {t('checkout.errors.phone')}
                    </div>
                  </div>

                  <div className="checkout-field checkout-field--full">
                    <label htmlFor="checkout-address" className="checkout-label">
                      {t('checkout.shipping.address')}
                    </label>
                    <input
                      id="checkout-address"
                      name="address"
                      type="text"
                      autoComplete="street-address"
                      required
                      minLength={5}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={t('checkout.shipping.addressPlaceholder')}
                      data-error="checkout-address-error"
                      className="checkout-input"
                    />
                    <div id="checkout-address-error" className="checkout-error-msg">
                      <span role="img" aria-label="Error">⚠️</span> {t('checkout.errors.address')}
                    </div>
                  </div>

                  <div className="checkout-field">
                    <label htmlFor="checkout-city" className="checkout-label">
                      {t('checkout.shipping.city')}
                    </label>
                    <input
                      id="checkout-city"
                      name="city"
                      type="text"
                      autoComplete="address-level2"
                      required
                      minLength={2}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder={t('checkout.shipping.cityPlaceholder')}
                      data-error="checkout-city-error"
                      className="checkout-input"
                    />
                    <div id="checkout-city-error" className="checkout-error-msg">
                      <span role="img" aria-label="Error">⚠️</span> {t('checkout.errors.city')}
                    </div>
                  </div>

                  <div className="checkout-field">
                    <label htmlFor="checkout-notes" className="checkout-label">
                      {t('checkout.shipping.notes')}
                    </label>
                    <input
                      id="checkout-notes"
                      name="notes"
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={t('checkout.shipping.notesPlaceholder')}
                      className="checkout-input"
                    />
                  </div>
                </div>
              </section>

              {/* Step 2: Simulated Payment */}
              <section className="checkout-card" aria-labelledby="checkout-payment-heading">
                <div className="checkout-card__header">
                  <CreditCard className="checkout-card__icon" aria-hidden="true" />
                  <h2 id="checkout-payment-heading" className="checkout-card__title">
                    {t('checkout.payment.title')}
                  </h2>
                </div>

                <fieldset className="checkout-methods-fieldset">
                  <legend className="visually-hidden">{t('checkout.payment.methodLegend')}</legend>
                  <div className="checkout-methods">
                    {PAYMENT_METHODS.map((method) => {
                      const MethodIcon = method.Icon;
                      return (
                        <label
                          key={method.id}
                          className={`checkout-method ${
                            paymentMethod === method.id ? 'checkout-method--active' : ''
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method.id}
                            checked={paymentMethod === method.id}
                            onChange={() => setPaymentMethod(method.id)}
                            className="checkout-method__radio"
                          />
                          <MethodIcon className="checkout-method__icon" aria-hidden="true" />
                          <span className="checkout-method__label">
                            {t(`checkout.payment.methods.${method.id}`)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                {paymentMethod === 'card' ? (
                  <div className="checkout-card-box">
                    <div className="checkout-form-grid">
                      <div className="checkout-field checkout-field--full">
                        <label htmlFor="cc-name" className="checkout-label">
                          {t('checkout.payment.cardHolder')}
                        </label>
                        <input
                          id="cc-name"
                          name="cc-name"
                          type="text"
                          autoComplete="cc-name"
                          maxLength={50}
                          pattern="[\p{L} \-\.]+"
                          required
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          placeholder={t('checkout.payment.cardHolderPlaceholder')}
                          data-error="cc-name-error"
                          className="checkout-input"
                        />
                        <div id="cc-name-error" className="checkout-error-msg">
                          <span role="img" aria-label="Error">⚠️</span> {t('checkout.errors.cardHolder')}
                        </div>
                      </div>

                      <div className="checkout-field checkout-field--full">
                        <label htmlFor="cc-number" className="checkout-label">
                          {t('checkout.payment.cardNumber')}
                        </label>
                        <span id="cc-number-hint" className="checkout-hint">
                          {t('checkout.payment.cardNumberHint')}
                        </span>
                        <input
                          id="cc-number"
                          name="cc-number"
                          type="text"
                          inputMode="numeric"
                          autoComplete="cc-number"
                          maxLength={19}
                          pattern="[\d ]{13,19}"
                          aria-describedby="cc-number-hint"
                          required
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumberInput(e.target.value))}
                          placeholder={t('checkout.payment.cardNumberPlaceholder')}
                          data-error="cc-number-error"
                          className="checkout-input"
                        />
                        <div id="cc-number-error" className="checkout-error-msg">
                          <span role="img" aria-label="Error">⚠️</span> {t('checkout.errors.cardNumber')}
                        </div>
                      </div>

                      <div className="checkout-field">
                        <label htmlFor="cc-exp" className="checkout-label">
                          {t('checkout.payment.expiry')}
                        </label>
                        <span id="cc-exp-hint" className="checkout-hint">
                          {t('checkout.payment.expHint')}
                        </span>
                        <input
                          id="cc-exp"
                          name="cc-exp"
                          type="text"
                          autoComplete="cc-exp"
                          aria-describedby="cc-exp-hint"
                          maxLength={5}
                          pattern="(0[1-9]|1[0-2])\/\d{2}"
                          required
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiryInput(e.target.value))}
                          placeholder={t('checkout.payment.expiryPlaceholder')}
                          data-error="cc-exp-error"
                          className="checkout-input"
                        />
                        <div id="cc-exp-error" className="checkout-error-msg">
                          <span role="img" aria-label="Error">⚠️</span> {t('checkout.errors.cardExpiry')}
                        </div>
                      </div>

                      <div className="checkout-field">
                        <label htmlFor="cc-csc" className="checkout-label">
                          {t('checkout.payment.csc')}
                        </label>
                        <span id="cc-csc-hint" className="checkout-hint">
                          {t('checkout.payment.cscHint')}
                        </span>
                        <input
                          id="cc-csc"
                          name="cc-csc"
                          type="text"
                          inputMode="numeric"
                          autoComplete="cc-csc"
                          aria-describedby="cc-csc-hint"
                          maxLength={4}
                          pattern="[0-9]{3,4}"
                          required
                          value={cardCsc}
                          onChange={(e) => setCardCsc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder={t('checkout.payment.cscPlaceholder')}
                          data-error="cc-csc-error"
                          className="checkout-input"
                        />
                        <div id="cc-csc-error" className="checkout-error-msg">
                          <span role="img" aria-label="Error">⚠️</span> {t('checkout.errors.cardCsc')}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="checkout-method-note">
                    {t(`checkout.payment.methodNotes.${paymentMethod}`)}
                  </p>
                )}
              </section>

              {submitError && (
                <div className="checkout__submit-error" role="alert">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={isBusy}
                className="checkout__submit-btn"
              >
                {isBusy
                  ? t('checkout.submitting')
                  : t('checkout.submitBtn', { total: formatPrice(summary.total).formatted })}
              </button>
            </form>

            {/* Summary Sidebar */}
            <aside className="checkout-summary" aria-label={t('checkout.summary.title')}>
              <h2 className="checkout-summary__title">{t('checkout.summary.title')}</h2>

              <ul className="checkout-summary__items">
                {items.map((item) => (
                  <li key={`${item.id}-${item.selectedFlavor || 'default'}`} className="checkout-summary__item">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="checkout-summary__item-img"
                      width={56}
                      height={56}
                    />
                    <div className="checkout-summary__item-info">
                      <span className="checkout-summary__item-name">{item.name}</span>
                      <span className="checkout-summary__item-qty">
                        ×{item.quantity}
                        {item.selectedFlavor ? ` · ${item.selectedFlavor}` : ''}
                      </span>
                    </div>
                    <span className="checkout-summary__item-price">
                      {formatPrice(item.price * item.quantity).formatted}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="checkout-summary__lines">
                <div className="checkout-summary__line">
                  <span>{t('cart.summary.subtotal')}</span>
                  <span>{formatPrice(summary.subtotal).formatted}</span>
                </div>
                <div className="checkout-summary__line">
                  <span>{t('cart.summary.deliveryFee')}</span>
                  <span>{formatPrice(summary.shipping).formatted}</span>
                </div>
                <div className="checkout-summary__line">
                  <span>{t('cart.summary.tax')}</span>
                  <span>{formatPrice(summary.tax).formatted}</span>
                </div>
                {summary.savings > 0 && (
                  <div className="checkout-summary__line checkout-summary__line--savings">
                    <span>{t('cart.summary.saving')}</span>
                    <span>−{formatPrice(summary.savings).formatted}</span>
                  </div>
                )}
                {appliedPromo && summary.discountAmount > 0 && (
                  <div className="checkout-summary__line checkout-summary__line--savings">
                    <span>{t('cart.summary.promoDiscount', { code: appliedPromo.code })}</span>
                    <span>−{formatPrice(summary.discountAmount).formatted}</span>
                  </div>
                )}
              </div>

              <div className="checkout-summary__total">
                <span>{t('cart.summary.total')}</span>
                <span>{formatPrice(summary.total).formatted}</span>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
