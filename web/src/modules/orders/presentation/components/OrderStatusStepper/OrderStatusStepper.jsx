import React, { useMemo } from 'react';
import {
  ReceiptLong,
  Restaurant,
  LocalShipping,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import './OrderStatusStepper.css';

const STEPS = [
  { key: 'RECEIVED', Icon: ReceiptLong },
  { key: 'PREPARING', Icon: Restaurant },
  { key: 'SHIPPED', Icon: LocalShipping },
  { key: 'DELIVERED', Icon: CheckCircle },
];

export default function OrderStatusStepper({ order }) {
  const { t, i18n } = useTranslation();

  const historyMap = useMemo(() => {
    const map = new Map();
    for (const evt of order?.statusHistory || []) {
      map.set(evt.status, evt);
    }
    return map;
  }, [order?.statusHistory]);

  const formatTimestamp = (iso) => {
    if (!iso) return null;
    try {
      const locale = i18n.language?.startsWith('es') ? 'es-CO' : 'en-US';
      return new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short',
      }).format(new Date(iso));
    } catch {
      return null;
    }
  };

  if (!order) return null;

  const isCancelled = order.status === 'CANCELLED';
  const currentIndex = STEPS.findIndex((step) => step.key === order.status);
  const progressValue = isCancelled ? 0 : Math.max(1, currentIndex + 1);
  const currentStatusLabel = t(`orders.statuses.${order.status}.label`);

  if (isCancelled) {
    const cancelEvent = historyMap.get('CANCELLED');
    return (
      <section className="order-stepper order-stepper--cancelled" aria-label={t('orders.tracking.progressLabel')}>
        <p className="visually-hidden" role="status" aria-live="polite">
          {t('orders.tracking.liveAnnouncement', { status: currentStatusLabel })}
        </p>
        <div className="order-stepper__cancelled-banner">
          <Cancel className="order-stepper__cancelled-icon" aria-hidden="true" />
          <div>
            <h2 className="order-stepper__cancelled-title">
              {t('orders.statuses.CANCELLED.label')}
            </h2>
            <p className="order-stepper__cancelled-desc">
              {t('orders.statuses.CANCELLED.description')}
            </p>
            {cancelEvent?.timestamp && (
              <p className="order-stepper__cancelled-time">
                {formatTimestamp(cancelEvent.timestamp)}
              </p>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="order-stepper" aria-label={t('orders.tracking.progressLabel')}>
      <p className="visually-hidden" role="status" aria-live="polite">
        {t('orders.tracking.liveAnnouncement', { status: currentStatusLabel })}
      </p>

      <div className="order-stepper__progress-wrap">
        <div className="order-stepper__progress-header">
          <span className="order-stepper__progress-label">
            {t('orders.tracking.progressLabel')}
          </span>
          <span className="order-stepper__progress-count">
            {progressValue} / {STEPS.length}
          </span>
        </div>
        <progress
          className="order-stepper__progress"
          value={progressValue}
          max={STEPS.length}
          aria-label={t('orders.tracking.progressAria', {
            step: progressValue,
            total: STEPS.length,
            status: currentStatusLabel,
          })}
        />
      </div>

      <ol className="order-stepper__steps">
        {STEPS.map((step, index) => {
          const IconComponent = step.Icon;
          const isCompleted = index < currentIndex || order.status === 'DELIVERED';
          const isCurrent = index === currentIndex && order.status !== 'DELIVERED';
          const event = historyMap.get(step.key);
          const timestamp = formatTimestamp(event?.timestamp);

          return (
            <li
              key={step.key}
              className={`order-stepper__step ${
                isCompleted
                  ? 'order-stepper__step--done'
                  : isCurrent
                    ? 'order-stepper__step--current'
                    : 'order-stepper__step--pending'
              }`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div className="order-stepper__icon-wrap">
                <IconComponent className="order-stepper__icon" aria-hidden="true" />
              </div>
              <div className="order-stepper__step-body">
                <h3 className="order-stepper__step-title">
                  {t(`orders.statuses.${step.key}.label`)}
                </h3>
                <p className="order-stepper__step-desc">
                  {t(`orders.statuses.${step.key}.description`)}
                </p>
                {timestamp && (
                  <time className="order-stepper__step-time" dateTime={event.timestamp}>
                    {timestamp}
                  </time>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
