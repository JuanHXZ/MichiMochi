import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowBack,
  PlayArrow,
  Pause,
  FastForward,
  Cancel,
  LocalShipping,
  Receipt,
  Inventory2,
  Science,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import Navbar from '@shared/components/Navbar/Navbar';
import SideNavBar from '@shared/components/SideNavBar/SideNavBar';
import OrderStatusStepper from '@modules/orders/presentation/components/OrderStatusStepper/OrderStatusStepper';
import { useAuthStore } from '@modules/auth/application/stores/authStore';
import { useOrderStore } from '@modules/orders/application/stores/orderStore';
import { useCurrency } from '@modules/cart/application/hooks/useCurrency';
import { useToastStore } from '@shared/stores/toastStore';
import './OrderTrackingPage.css';

export default function OrderTrackingPage() {
  const { t, i18n } = useTranslation();
  const { format: formatPrice } = useCurrency();
  const showToast = useToastStore((state) => state.showToast);

  const user = useAuthStore((state) => state.user);
  const currentOrder = useOrderStore((state) => state.currentOrder);
  const isLoading = useOrderStore((state) => state.isLoading);
  const isSubmitting = useOrderStore((state) => state.isSubmitting);
  const error = useOrderStore((state) => state.error);
  const fetchOrderById = useOrderStore((state) => state.fetchOrderById);
  const advanceOrderStatus = useOrderStore((state) => state.advanceOrderStatus);
  const cancelOrder = useOrderStore((state) => state.cancelOrder);

  const [autoSimulating, setAutoSimulating] = useState(false);
  const cancelDialogRef = useRef(null);
  const isAdvancingRef = useRef(false);

  const orderId = useMemo(() => {
    const segment = window.location.pathname.split('/orders/')[1] || '';
    return decodeURIComponent(segment.split('/')[0] || '').trim();
  }, []);

  useEffect(() => {
    if (orderId) {
      fetchOrderById(orderId);
    }
  }, [orderId, fetchOrderById]);

  // Safari fallback for closedby="any" on native <dialog>
  useEffect(() => {
    const dialog = cancelDialogRef.current;
    if (!dialog || 'closedBy' in HTMLDialogElement.prototype) return;

    const outside = (e) => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    let pressedOutside = false;
    const onDown = (e) => {
      pressedOutside = outside(e);
    };
    const onUp = (e) => {
      if (pressedOutside && outside(e)) {
        dialog.close();
      }
      pressedOutside = false;
    };
    dialog.addEventListener('pointerdown', onDown);
    dialog.addEventListener('pointerup', onUp);
    return () => {
      dialog.removeEventListener('pointerdown', onDown);
      dialog.removeEventListener('pointerup', onUp);
    };
  }, [currentOrder?.id]);

  // Automatic 5-second customer tracking simulation
  useEffect(() => {
    if (!autoSimulating || !currentOrder) return undefined;
    if (currentOrder.status === 'DELIVERED' || currentOrder.status === 'CANCELLED') {
      setAutoSimulating(false);
      return undefined;
    }

    const timer = setInterval(async () => {
      if (isAdvancingRef.current) return;
      isAdvancingRef.current = true;
      try {
        const updated = await advanceOrderStatus(currentOrder.id);
        showToast({
          message: t('orders.tracking.statusUpdatedToast', {
            status: t(`orders.statuses.${updated.status}.label`),
          }),
          type: 'success',
        });
        if (updated.status === 'DELIVERED') {
          setAutoSimulating(false);
        }
      } catch (err) {
        setAutoSimulating(false);
        showToast({
          message: err.message || t('orders.tracking.advanceError'),
          type: 'error',
        });
      } finally {
        isAdvancingRef.current = false;
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [autoSimulating, currentOrder, advanceOrderStatus, showToast, t]);

  const userName = useMemo(() => {
    if (!user) return 'Usuario';
    return (
      String(user.fullName || '').trim() ||
      String(user.email || '').split('@')[0] ||
      'Usuario'
    );
  }, [user]);

  const formatDateTime = (iso) => {
    if (!iso) return '';
    try {
      const locale = i18n.language?.startsWith('es') ? 'es-CO' : 'en-US';
      return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  const handleManualAdvance = async () => {
    if (!currentOrder || isAdvancingRef.current) return;
    isAdvancingRef.current = true;
    try {
      const updated = await advanceOrderStatus(currentOrder.id);
      showToast({
        message: t('orders.tracking.statusUpdatedToast', {
          status: t(`orders.statuses.${updated.status}.label`),
        }),
        type: 'success',
      });
    } catch (err) {
      showToast({
        message: err.message || t('orders.tracking.advanceError'),
        type: 'error',
      });
    } finally {
      isAdvancingRef.current = false;
    }
  };

  const handleConfirmCancel = async () => {
    if (!currentOrder) return;
    setAutoSimulating(false);
    try {
      await cancelOrder(currentOrder.id);
      cancelDialogRef.current?.close();
      showToast({
        message: t('orders.tracking.cancelledToast'),
        type: 'info',
      });
    } catch (err) {
      showToast({
        message: err.message || t('orders.tracking.cancelError'),
        type: 'error',
      });
    }
  };

  const canSimulate =
    currentOrder &&
    currentOrder.status !== 'DELIVERED' &&
    currentOrder.status !== 'CANCELLED';

  const canCancel =
    currentOrder &&
    (currentOrder.status === 'RECEIVED' || currentOrder.status === 'PREPARING');

  return (
    <div className="tracking-page">
      <Navbar userName={userName} currentPage="orders" />
      <div className="tracking-page__layout">
        <SideNavBar />

        <main id="main-content" className="tracking-page__main">
          <a href="/orders" className="tracking-page__back">
            <ArrowBack fontSize="small" aria-hidden="true" />
            <span>{t('orders.tracking.backToOrders')}</span>
          </a>

          {isLoading && !currentOrder ? (
            <div className="tracking-page__loading" role="status">
              {t('orders.tracking.loading')}
            </div>
          ) : error && !currentOrder ? (
            <section className="tracking-page__error-box" role="alert">
              <h1>{t('orders.tracking.notFoundTitle')}</h1>
              <p>{error}</p>
              <a href="/orders" className="tracking-page__error-btn">
                {t('orders.tracking.backToOrders')}
              </a>
            </section>
          ) : currentOrder ? (
            <>
              <header className="tracking-header">
                <div>
                  <div className="tracking-header__title-row">
                    <h1 className="tracking-header__title">
                      {t('orders.tracking.title', { orderNumber: currentOrder.orderNumber })}
                    </h1>
                    <span
                      className={`order-status-badge order-status-badge--${currentOrder.status.toLowerCase()}`}
                    >
                      {t(`orders.statuses.${currentOrder.status}.label`)}
                    </span>
                  </div>
                  <p className="tracking-header__meta">
                    {t('orders.tracking.placedAt')}: {formatDateTime(currentOrder.createdAt)} ·{' '}
                    {t('orders.tracking.eta')}: <strong>{currentOrder.estimatedDelivery}</strong>
                  </p>
                </div>
              </header>

              <OrderStatusStepper order={currentOrder} />

              {canSimulate && (
                <section className="tracking-sim-panel" aria-labelledby="tracking-sim-heading">
                  <div className="tracking-sim-panel__info">
                    <span className="tracking-sim-panel__badge">
                      <Science fontSize="small" aria-hidden="true" />
                      <span>{t('orders.tracking.simBadge')}</span>
                    </span>
                    <h2 id="tracking-sim-heading" className="tracking-sim-panel__title">
                      {t('orders.tracking.simTitle')}
                    </h2>
                    <p className="tracking-sim-panel__text">{t('orders.tracking.simDesc')}</p>
                  </div>

                  <div className="tracking-sim-panel__actions">
                    <button
                      type="button"
                      onClick={handleManualAdvance}
                      disabled={isSubmitting}
                      className="tracking-sim-btn tracking-sim-btn--primary"
                    >
                      <FastForward fontSize="small" aria-hidden="true" />
                      <span>{t('orders.tracking.advanceBtn')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAutoSimulating((prev) => !prev)}
                      className={`tracking-sim-btn ${
                        autoSimulating ? 'tracking-sim-btn--active' : 'tracking-sim-btn--secondary'
                      }`}
                    >
                      {autoSimulating ? (
                        <>
                          <Pause fontSize="small" aria-hidden="true" />
                          <span>{t('orders.tracking.pauseAutoBtn')}</span>
                        </>
                      ) : (
                        <>
                          <PlayArrow fontSize="small" aria-hidden="true" />
                          <span>{t('orders.tracking.startAutoBtn')}</span>
                        </>
                      )}
                    </button>

                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => cancelDialogRef.current?.showModal()}
                        disabled={isSubmitting}
                        className="tracking-sim-btn tracking-sim-btn--danger"
                      >
                        <Cancel fontSize="small" aria-hidden="true" />
                        <span>{t('orders.tracking.cancelBtn')}</span>
                      </button>
                    )}
                  </div>
                </section>
              )}

              {/* Chronological Log */}
              <section className="tracking-history-card" aria-labelledby="tracking-history-heading">
                <h2 id="tracking-history-heading" className="tracking-card__title">
                  {t('orders.tracking.historyTitle')}
                </h2>
                <ol className="tracking-history-list">
                  {currentOrder.statusHistory.map((evt, index) => (
                    <li key={`${evt.status}-${index}`} className="tracking-history-item">
                      <div className="tracking-history-item__dot" aria-hidden="true" />
                      <div className="tracking-history-item__content">
                        <div className="tracking-history-item__top">
                          <strong>{t(`orders.statuses.${evt.status}.label`)}</strong>
                          <time dateTime={evt.timestamp}>{formatDateTime(evt.timestamp)}</time>
                        </div>
                        <p>{evt.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              {/* Details Grid */}
              <div className="tracking-details-grid">
                <section className="tracking-card" aria-labelledby="tracking-items-heading">
                  <div className="tracking-card__head">
                    <Inventory2 className="tracking-card__icon" aria-hidden="true" />
                    <h2 id="tracking-items-heading" className="tracking-card__title">
                      {t('orders.tracking.itemsTitle')}
                    </h2>
                  </div>
                  <ul className="tracking-items-list">
                    {currentOrder.items.map((item, idx) => (
                      <li key={`${item.productId}-${idx}`} className="tracking-item-row">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="tracking-item-row__img"
                            width={48}
                            height={48}
                          />
                        )}
                        <div className="tracking-item-row__info">
                          <span className="tracking-item-row__name">{item.name}</span>
                          <span className="tracking-item-row__meta">
                            ×{item.quantity}
                            {item.flavor ? ` · ${item.flavor}` : ''}
                          </span>
                        </div>
                        <span className="tracking-item-row__price">
                          {formatPrice(item.subtotal).formatted}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="tracking-card" aria-labelledby="tracking-delivery-heading">
                  <div className="tracking-card__head">
                    <LocalShipping className="tracking-card__icon" aria-hidden="true" />
                    <h2 id="tracking-delivery-heading" className="tracking-card__title">
                      {t('orders.tracking.deliveryTitle')}
                    </h2>
                  </div>
                  <dl className="tracking-dl">
                    <div className="tracking-dl__row">
                      <dt>{t('checkout.shipping.fullName')}</dt>
                      <dd>{currentOrder.shippingAddress.fullName}</dd>
                    </div>
                    <div className="tracking-dl__row">
                      <dt>{t('checkout.shipping.phone')}</dt>
                      <dd>{currentOrder.shippingAddress.phone}</dd>
                    </div>
                    <div className="tracking-dl__row">
                      <dt>{t('checkout.shipping.address')}</dt>
                      <dd>{currentOrder.shippingAddress.address}</dd>
                    </div>
                    <div className="tracking-dl__row">
                      <dt>{t('checkout.shipping.city')}</dt>
                      <dd>{currentOrder.shippingAddress.city}</dd>
                    </div>
                    {currentOrder.shippingAddress.notes && (
                      <div className="tracking-dl__row">
                        <dt>{t('checkout.shipping.notes')}</dt>
                        <dd>{currentOrder.shippingAddress.notes}</dd>
                      </div>
                    )}
                  </dl>
                </section>

                <section className="tracking-card" aria-labelledby="tracking-payment-heading">
                  <div className="tracking-card__head">
                    <Receipt className="tracking-card__icon" aria-hidden="true" />
                    <h2 id="tracking-payment-heading" className="tracking-card__title">
                      {t('orders.tracking.paymentTitle')}
                    </h2>
                  </div>
                  <dl className="tracking-dl">
                    <div className="tracking-dl__row">
                      <dt>{t('orders.tracking.paymentMethod')}</dt>
                      <dd>
                        {t(`checkout.payment.methods.${currentOrder.payment.method}`)}
                        {currentOrder.payment.cardLast4
                          ? ` (•••• ${currentOrder.payment.cardLast4})`
                          : ''}
                      </dd>
                    </div>
                    <div className="tracking-dl__row">
                      <dt>{t('orders.tracking.paymentStatus')}</dt>
                      <dd className="tracking-payment-ok">
                        {t('orders.tracking.paymentApprovedSim')}
                      </dd>
                    </div>
                    <div className="tracking-dl__row">
                      <dt>{t('orders.tracking.paymentRef')}</dt>
                      <dd><code>{currentOrder.payment.reference}</code></dd>
                    </div>
                    <div className="tracking-dl__row">
                      <dt>{t('cart.summary.subtotal')}</dt>
                      <dd>{formatPrice(currentOrder.subtotal).formatted}</dd>
                    </div>
                    <div className="tracking-dl__row">
                      <dt>{t('cart.summary.deliveryFee')}</dt>
                      <dd>{formatPrice(currentOrder.shipping).formatted}</dd>
                    </div>
                    <div className="tracking-dl__row">
                      <dt>{t('cart.summary.tax')}</dt>
                      <dd>{formatPrice(currentOrder.tax).formatted}</dd>
                    </div>
                    <div className="tracking-dl__row tracking-dl__row--total">
                      <dt>{t('cart.summary.total')}</dt>
                      <dd>{formatPrice(currentOrder.total).formatted}</dd>
                    </div>
                  </dl>
                </section>
              </div>
            </>
          ) : null}
        </main>
      </div>

      {/* Native confirmation modal (<dialog>) for cancelling order */}
      <dialog
        ref={cancelDialogRef}
        closedby="any"
        aria-labelledby="cancel-order-dialog-title"
        className="tracking-confirm-dialog"
      >
        <h2 id="cancel-order-dialog-title" className="tracking-confirm-dialog__title">
          {t('orders.tracking.cancelDialog.title')}
        </h2>
        <p className="tracking-confirm-dialog__text">
          {t('orders.tracking.cancelDialog.text', {
            orderNumber: currentOrder?.orderNumber || '',
          })}
        </p>
        <div className="tracking-confirm-dialog__actions">
          <button
            type="button"
            autoFocus
            onClick={() => cancelDialogRef.current?.close()}
            className="tracking-confirm-dialog__keep"
          >
            {t('orders.tracking.cancelDialog.keep')}
          </button>
          <button
            type="button"
            onClick={handleConfirmCancel}
            disabled={isSubmitting}
            className="tracking-confirm-dialog__confirm"
          >
            {t('orders.tracking.cancelDialog.confirm')}
          </button>
        </div>
      </dialog>
    </div>
  );
}
