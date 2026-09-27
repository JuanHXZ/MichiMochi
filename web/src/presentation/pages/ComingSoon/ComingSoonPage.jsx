import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '@/presentation/components/layout/Navbar/Navbar';
import SideNavBar from '@/presentation/components/layout/SideNavBar/SideNavBar';
import { useAuthStore } from '@/application/stores/authStore';
import './ComingSoonPage.css';

export default function ComingSoonPage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const userName = useMemo(() => {
    if (!user) return "Usuario";
    return String(user.fullName || "").trim() ||
           String(user.email || "").split("@")[0] ||
           "Usuario";
  }, [user]);

  return (
    <div className="coming-soon">
      <Navbar userName={userName} />
      
      <div className="coming-soon__layout">
        <SideNavBar />
        
        <main className="coming-soon__main">
          <div className="coming-soon__content">
            <div className="coming-soon__icon-container">
              <span className="coming-soon__icon">🎉</span>
              <div className="coming-soon__icon-decoration">
                <span>🍡</span>
                <span>🍨</span>
                <span>☕</span>
                <span>🌸</span>
              </div>
            </div>

            <h1 className="coming-soon__title">
              {t('comingSoon.title')}
            </h1>
            
            <p className="coming-soon__subtitle">
              {t('comingSoon.subtitle')}
            </p>

            <p className="coming-soon__description">
              {t('comingSoon.description')}
            </p>

            <div className="coming-soon__features">
              <div className="coming-soon__feature-card">
                <span className="coming-soon__feature-icon">🍡</span>
                <h3 className="coming-soon__feature-title">
                  {t('comingSoon.features.newFlavors.title')}
                </h3>
                <p className="coming-soon__feature-text">
                  {t('comingSoon.features.newFlavors.text')}
                </p>
              </div>

              <div className="coming-soon__feature-card">
                <span className="coming-soon__feature-icon">⭐</span>
                <h3 className="coming-soon__feature-title">
                  {t('comingSoon.features.rewards.title')}
                </h3>
                <p className="coming-soon__feature-text">
                  {t('comingSoon.features.rewards.text')}
                </p>
              </div>

              <div className="coming-soon__feature-card">
                <span className="coming-soon__feature-icon">📦</span>
                <h3 className="coming-soon__feature-title">
                  {t('comingSoon.features.tracking.title')}
                </h3>
                <p className="coming-soon__feature-text">
                  {t('comingSoon.features.tracking.text')}
                </p>
              </div>
            </div>

            <button 
              className="coming-soon__cta"
              onClick={() => window.location.href = '/dashboard'}
            >
              {t('comingSoon.backToCatalog')}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
