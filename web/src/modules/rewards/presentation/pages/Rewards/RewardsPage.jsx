import React, { useEffect } from 'react';
import { CardGiftcard, ContentCopy, Stars, History } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import Navbar from '@shared/components/Navbar/Navbar';
import SideNavBar from '@shared/components/SideNavBar/SideNavBar';
import { useRewardStore } from '@modules/rewards/application/stores/rewardStore';
import { useAuthStore } from '@modules/auth/application/stores/authStore';
import { useCurrency } from '@modules/cart/application/hooks/useCurrency';
import { useToastStore } from '@shared/stores/toastStore';
import './RewardsPage.css';

export default function RewardsPage() {
  const { t } = useTranslation();
  const { format: formatPrice } = useCurrency();
  const showToast = useToastStore((state) => state.showToast);

  const user = useAuthStore((state) => state.user);
  const { summary, isLoading, isRedeeming, fetchSummary, redeemReward } = useRewardStore();

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const userName = user
    ? String(user.fullName || '').trim() || String(user.email || '').split('@')[0] || 'User'
    : 'User';

  const handleRedeem = async (item) => {
    try {
      const result = await redeemReward(item.id);
      showToast({
        message: t('rewards.redeemSuccess', { code: result.promo.code }),
        type: 'success',
      });
    } catch (err) {
      showToast({
        message: err.message || t('rewards.redeemError'),
        type: 'error',
      });
    }
  };

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      showToast({
        message: t('rewards.copiedToast', { code }),
        type: 'info',
      });
    } catch {
      showToast({ message: code, type: 'info' });
    }
  };

  const points = summary?.points ?? 0;
  const lifetimePoints = summary?.lifetimePoints ?? 0;
  const currentTier = summary?.tier?.name || 'Sweet Starter';
  const nextTier = summary?.nextTier;
  const progressPct = nextTier
    ? Math.min(100, Math.round((lifetimePoints / nextTier.minPoints) * 100))
    : 100;

  return (
    <div className="rewards-page">
      <Navbar userName={userName} currentPage="rewards" />

      <div className="rewards-page__layout">
        <SideNavBar />

        <main id="main-content" className="rewards-page__main">
          <header className="rewards-page__header">
            <div>
              <span className="rewards-page__eyebrow">
                <Stars fontSize="small" aria-hidden="true" /> {t('rewards.eyebrow')}
              </span>
              <h1 className="rewards-page__title">{t('rewards.title')}</h1>
              <p className="rewards-page__subtitle">{t('rewards.subtitle')}</p>
            </div>
          </header>

          {/* Balance & Tier Card */}
          <section className="rewards-hero-card" aria-label={t('rewards.balanceLabel')}>
            <div className="rewards-hero-card__balance">
              <span className="rewards-hero-card__label">{t('rewards.balanceLabel')}</span>
              <strong className="rewards-hero-card__points">{points.toLocaleString()} pts</strong>
              <span className="rewards-hero-card__hint">{t('rewards.earnRate')}</span>
            </div>

            <div className="rewards-hero-card__tier">
              <div className="rewards-hero-card__tier-row">
                <span className="rewards-tier-badge">{currentTier}</span>
                {nextTier ? (
                  <span className="rewards-tier-next">
                    {t('rewards.nextTier', {
                      remaining: Math.max(0, nextTier.minPoints - lifetimePoints),
                      tier: nextTier.name,
                    })}
                  </span>
                ) : (
                  <span className="rewards-tier-next">{t('rewards.maxTier')}</span>
                )}
              </div>
              <div className="rewards-progress" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
                <div className="rewards-progress__bar" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          </section>

          {/* Active Reward Coupons */}
          {summary?.activeCoupons?.length > 0 && (
            <section className="rewards-section">
              <h2 className="rewards-section__title">{t('rewards.myCouponsTitle')}</h2>
              <div className="rewards-coupons-grid">
                {summary.activeCoupons.map((coupon) => (
                  <div key={coupon.code} className="reward-coupon-card">
                    <div>
                      <strong className="reward-coupon-card__code">{coupon.code}</strong>
                      <p className="reward-coupon-card__desc">{coupon.description}</p>
                    </div>
                    <button
                      type="button"
                      className="reward-coupon-card__copy"
                      onClick={() => handleCopyCode(coupon.code)}
                    >
                      <ContentCopy fontSize="small" aria-hidden="true" /> {t('rewards.copyCode')}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Redeem Catalog */}
          <section className="rewards-section">
            <h2 className="rewards-section__title">
              <CardGiftcard aria-hidden="true" /> {t('rewards.catalogTitle')}
            </h2>
            {isLoading && !summary ? (
              <p className="rewards-loading">{t('rewards.loading')}</p>
            ) : (
              <div className="rewards-catalog-grid">
                {(summary?.catalog || []).map((item) => {
                  const canRedeem = points >= item.pointsCost && !isRedeeming;
                  return (
                    <article key={item.id} className="reward-tier-card">
                      <span className="reward-tier-card__cost">{item.pointsCost} pts</span>
                      <h3 className="reward-tier-card__title">{item.title}</h3>
                      <p className="reward-tier-card__desc">{item.description}</p>
                      <div className="reward-tier-card__footer">
                        <span className="reward-tier-card__value">
                          {formatPrice(item.discountUsd).formatted}
                        </span>
                        <button
                          type="button"
                          className="reward-tier-card__btn"
                          disabled={!canRedeem}
                          onClick={() => handleRedeem(item)}
                        >
                          {points >= item.pointsCost ? t('rewards.redeemBtn') : t('rewards.insufficientBtn')}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Points History */}
          <section className="rewards-section">
            <h2 className="rewards-section__title">
              <History aria-hidden="true" /> {t('rewards.historyTitle')}
            </h2>
            {!summary?.transactions?.length ? (
              <p className="rewards-empty-history">{t('rewards.emptyHistory')}</p>
            ) : (
              <ul className="rewards-history-list">
                {summary.transactions.map((tx) => (
                  <li key={tx.id} className="rewards-history-item">
                    <div>
                      <strong className="rewards-history-item__desc">{tx.description}</strong>
                      <span className="rewards-history-item__date">
                        {new Date(tx.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <span
                      className={`rewards-history-item__pts ${
                        tx.points >= 0 ? 'rewards-history-item__pts--plus' : 'rewards-history-item__pts--minus'
                      }`}
                    >
                      {tx.points >= 0 ? `+${tx.points}` : tx.points} pts
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
