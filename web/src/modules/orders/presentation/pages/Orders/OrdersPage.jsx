import React, { useEffect, useMemo, useState } from 'react';
import { ReceiptLong, ArrowForward, ShoppingBag } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import Navbar from '@shared/components/Navbar/Navbar';
import SideNavBar from '@shared/components/SideNavBar/SideNavBar';
import { useAuthStore } from '@modules/auth/application/stores/authStore';
import { useOrderStore } from '@modules/orders/application/stores/orderStore';
import { useCurrency } from '@modules/cart/application/hooks/useCurrency';
import './OrdersPage.css';

const FILTER_TABS = ['all', 'active', 'delivered', 'cancelled'];
const ACTIVE_STATUSES = new Set(['RECEIVED', 'PREPARING', 'SHIPPED']);

export default function OrdersPage() {
  const { t, i18n } = useTranslation();
  const { format: formatPrice } = useCurrency();

  const user = useAuthStore((state) => state.user);
  const orders = useOrderStore((state) => state.orders);
  const isLoading = useOrderStore((state) => state.isLoading);
  const error = useOrderStore((state) => state.error);
  const fetchMyOrders = useOrderStore((state) => state.fetchMyOrders);

  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    fetchMyOrders();
  }, [fetchMyOrders]);

  const userName = useMemo(() => {
    if (!user) return 'Usuario';
    return (
      String(user.fullName || '').trim() ||
      String(user.email || '').split('@')[0] ||
      'Usuario'
    );
  }, [user]);

  const filteredOrders = useMemo(() => {
    if (activeFilter === 'active') {
      return orders.filter((o) => ACTIVE_STATUSES.has(o.status));
    }
    if (activeFilter === 'delivered') {
      return orders.filter((o) => o.status === 'DELIVERED');
    }
    if (activeFilter === 'cancelled') {
      return orders.filter((o) => o.status === 'CANCELLED');
    }
    return orders;
  }, [orders, activeFilter]);

  const formatDate = (iso) => {
    if (!iso) return '';
    try {
      const locale = i18n.language?.startsWith('es') ? 'es-CO' : 'en-US';
      return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  return (
    <div className="orders-page">
      <Navbar userName={userName} currentPage="orders" />
      <div className="orders-page__layout">
        <SideNavBar />

        <main id="main-content" className="orders-page__main">
          <header className="orders-page__header">
            <div>
              <h1 className="orders-page__title">{t('orders.list.title')}</h1>
              <p className="orders-page__subtitle">{t('orders.list.subtitle')}</p>
            </div>
            <a href="/dashboard" className="orders-page__catalog-btn">
              <ShoppingBag fontSize="small" aria-hidden="true" />
              <span>{t('orders.list.newOrder')}</span>
            </a>
          </header>

          <div className="orders-page__filters" role="tablist" aria-label={t('orders.list.filterLabel')}>
            {FILTER_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeFilter === tab}
                onClick={() => setActiveFilter(tab)}
                className={`orders-filter-pill ${
                  activeFilter === tab ? 'orders-filter-pill--active' : ''
                }`}
              >
                {t(`orders.list.filters.${tab}`)}
              </button>
            ))}
          </div>

          {error && (
            <div className="orders-page__error" role="alert">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="orders-page__loading" role="status">
              {t('orders.list.loading')}
            </div>
          ) : filteredOrders.length === 0 ? (
            <section className="orders-page__empty">
              <ReceiptLong className="orders-page__empty-icon" aria-hidden="true" />
              <h2 className="orders-page__empty-title">{t('orders.list.emptyTitle')}</h2>
              <p className="orders-page__empty-text">{t('orders.list.emptyText')}</p>
              <a href="/dashboard" className="orders-page__empty-btn">
                {t('orders.list.emptyButton')}
              </a>
            </section>
          ) : (
            <div className="orders-grid">
              {filteredOrders.map((order) => (
                <article key={order.id} className="order-card">
                  <div className="order-card__top">
                    <div>
                      <span className="order-card__number">#{order.orderNumber}</span>
                      <time className="order-card__date" dateTime={order.createdAt}>
                        {formatDate(order.createdAt)}
                      </time>
                    </div>
                    <span className={`order-status-badge order-status-badge--${order.status.toLowerCase()}`}>
                      {t(`orders.statuses.${order.status}.label`)}
                    </span>
                  </div>

                  <div className="order-card__items">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <div key={`${item.productId}-${idx}`} className="order-card__item-chip">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="order-card__item-img"
                            width={40}
                            height={40}
                          />
                        )}
                        <span className="order-card__item-text">
                          {item.quantity}× {item.shortName || item.name}
                        </span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <span className="order-card__more-items">
                        +{order.items.length - 3} {t('orders.list.moreItems')}
                      </span>
                    )}
                  </div>

                  <div className="order-card__footer">
                    <div className="order-card__total-wrap">
                      <span className="order-card__total-label">{t('cart.summary.total')}</span>
                      <span className="order-card__total-value">
                        {formatPrice(order.total).formatted}
                      </span>
                    </div>
                    <a href={`/orders/${order.id}`} className="order-card__track-btn">
                      <span>{t('orders.list.trackButton')}</span>
                      <ArrowForward fontSize="small" aria-hidden="true" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
