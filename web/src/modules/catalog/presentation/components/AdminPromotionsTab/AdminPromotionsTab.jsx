import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { promoService } from '@modules/cart/infrastructure/services/promoService';
import { useCurrency } from '@/modules/cart/application/hooks/useCurrency';
import { useToastStore } from '@shared/stores/toastStore';
import './AdminPromotionsTab.css';

const DEFAULT_PROMO_FORM = {
  isEdit: false,
  code: '',
  description: '',
  discountType: 'PERCENT',
  discountValue: 10,
  minSubtotal: 0,
  maxDiscount: '',
  maxUses: '',
  expiresAt: '',
  active: true,
};

export default function AdminPromotionsTab() {
  const { t } = useTranslation();
  const { format: formatPrice } = useCurrency();
  const showToast = useToastStore((state) => state.showToast);

  const [promotions, setPromotions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [formData, setFormData] = useState(DEFAULT_PROMO_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promoToDelete, setPromoToDelete] = useState(null);

  const drawerRef = useRef(null);
  const deleteDialogRef = useRef(null);

  const loadPromotions = async () => {
    setIsLoading(true);
    try {
      const data = await promoService.getPromotions();
      setPromotions(data);
    } catch (err) {
      showToast({
        message: `Error al cargar cupones: ${err.message}`,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPromotions();
  }, []);

  const totalCount = promotions.length;
  const activeCount = promotions.filter((p) => p.active).length;
  const totalUses = promotions.reduce((sum, p) => sum + (Number(p.currentUses) || 0), 0);

  const filteredPromotions = useMemo(() => {
    return promotions.filter((promo) => {
      if (scopeFilter === 'global' && promo.userId) return false;
      if (scopeFilter === 'rewards' && !promo.userId) return false;
      if (scopeFilter === 'active' && !promo.active) return false;
      if (scopeFilter === 'inactive' && promo.active) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchCode = promo.code?.toLowerCase().includes(q);
        const matchDesc = promo.description?.toLowerCase().includes(q);
        if (!matchCode && !matchDesc) return false;
      }

      return true;
    });
  }, [promotions, scopeFilter, search]);

  const handleOpenCreate = () => {
    setFormData(DEFAULT_PROMO_FORM);
    drawerRef.current?.showModal();
  };

  const handleOpenEdit = (promo) => {
    setFormData({
      isEdit: true,
      code: promo.code,
      description: promo.description || '',
      discountType: promo.discountType || 'PERCENT',
      discountValue: Number(promo.discountValue) || 10,
      minSubtotal: Number(promo.minSubtotal) || 0,
      maxDiscount: promo.maxDiscount !== null && promo.maxDiscount !== undefined ? String(promo.maxDiscount) : '',
      maxUses: promo.maxUses !== null && promo.maxUses !== undefined ? String(promo.maxUses) : '',
      expiresAt: promo.expiresAt ? promo.expiresAt.slice(0, 10) : '',
      active: Boolean(promo.active),
    });
    drawerRef.current?.showModal();
  };

  const handleToggleActive = async (promo) => {
    try {
      const updated = await promoService.updatePromotion(promo.code, { active: !promo.active });
      setPromotions((prev) => prev.map((p) => (p.code === promo.code ? updated : p)));
    } catch (err) {
      showToast({ message: `Error al actualizar estado: ${err.message}`, type: 'error' });
    }
  };

  const handleConfirmDelete = (promo) => {
    setPromoToDelete(promo);
    deleteDialogRef.current?.showModal();
  };

  const handleDeleteDialogClose = async () => {
    const dialog = deleteDialogRef.current;
    const choice = dialog?.returnValue || '';
    if (dialog) dialog.returnValue = '';

    const target = promoToDelete;
    setPromoToDelete(null);
    if (choice !== 'confirm' || !target) return;

    try {
      await promoService.deletePromotion(target.code);
      setPromotions((prev) => prev.filter((p) => p.code !== target.code));
      showToast({ message: `Cupón "${target.code}" eliminado.`, type: 'success' });
    } catch (err) {
      showToast({ message: `Error al eliminar cupón: ${err.message}`, type: 'error' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const basePayload = {
        description: formData.description.trim(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minSubtotal: Number(formData.minSubtotal) || 0,
        maxDiscount: formData.maxDiscount !== '' ? Number(formData.maxDiscount) : null,
        maxUses: formData.maxUses !== '' ? parseInt(formData.maxUses, 10) : null,
        expiresAt: formData.expiresAt ? new Date(`${formData.expiresAt}T23:59:59.000Z`).toISOString() : null,
        active: Boolean(formData.active),
      };

      if (formData.isEdit) {
        const updated = await promoService.updatePromotion(formData.code, basePayload);
        setPromotions((prev) => prev.map((p) => (p.code === updated.code ? updated : p)));
        showToast({ message: `Cupón "${updated.code}" actualizado.`, type: 'success' });
      } else {
        const created = await promoService.createPromotion({
          ...basePayload,
          code: formData.code.trim().toUpperCase(),
        });
        setPromotions((prev) => [created, ...prev]);
        showToast({ message: `Cupón "${created.code}" creado exitosamente.`, type: 'success' });
      }

      drawerRef.current?.close();
    } catch (err) {
      showToast({ message: `Error al guardar cupón: ${err.message}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-promos">
      <div className="admin-promos__top-actions">
        <div>
          <h2 className="admin-promos__heading">{t('admin.promotions.title')}</h2>
          <p className="admin-promos__subheading">{t('admin.promotions.subtitle')}</p>
        </div>
        <button
          type="button"
          className="admin-catalog__btn-primary"
          onClick={handleOpenCreate}
        >
          <span aria-hidden="true">+</span>
          <span>{t('admin.promotions.newPromo')}</span>
        </button>
      </div>

      {/* KPIs */}
      <section className="admin-catalog__kpis" aria-label="Promotions metrics">
        <div className="admin-kpi-card">
          <div className="admin-kpi-card__icon admin-kpi-card__icon--brown" aria-hidden="true">🎟️</div>
          <div className="admin-kpi-card__content">
            <span className="admin-kpi-card__value">{totalCount}</span>
            <span className="admin-kpi-card__label">{t('admin.promotions.metrics.total')}</span>
          </div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-card__icon admin-kpi-card__icon--green" aria-hidden="true">✅</div>
          <div className="admin-kpi-card__content">
            <span className="admin-kpi-card__value">{activeCount}</span>
            <span className="admin-kpi-card__label">{t('admin.promotions.metrics.active')}</span>
          </div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-card__icon admin-kpi-card__icon--gold" aria-hidden="true">🔥</div>
          <div className="admin-kpi-card__content">
            <span className="admin-kpi-card__value">{totalUses}</span>
            <span className="admin-kpi-card__label">{t('admin.promotions.metrics.uses')}</span>
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <search className="admin-catalog__toolbar">
        <div className="admin-catalog__search-box">
          <span aria-hidden="true">🔍</span>
          <label htmlFor="admin-promos-search" className="visually-hidden">
            {t('admin.promotions.searchPlaceholder')}
          </label>
          <input
            id="admin-promos-search"
            type="search"
            className="admin-catalog__search-input"
            placeholder={t('admin.promotions.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="admin-catalog__categories">
          {[
            { id: 'all', label: t('admin.promotions.filters.all') },
            { id: 'global', label: t('admin.promotions.filters.global') },
            { id: 'rewards', label: t('admin.promotions.filters.rewards') },
            { id: 'active', label: t('admin.promotions.filters.active') },
            { id: 'inactive', label: t('admin.promotions.filters.inactive') },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              aria-pressed={scopeFilter === opt.id}
              className={`admin-catalog__cat-pill ${
                scopeFilter === opt.id ? 'admin-catalog__cat-pill--active' : ''
              }`}
              onClick={() => setScopeFilter(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </search>

      {/* Table */}
      <section className="admin-catalog__table-card">
        <div className="admin-catalog__table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">{t('admin.promotions.table.code')}</th>
                <th scope="col">{t('admin.promotions.table.discount')}</th>
                <th scope="col">{t('admin.promotions.table.minSubtotal')}</th>
                <th scope="col">{t('admin.promotions.table.uses')}</th>
                <th scope="col">{t('admin.promotions.table.active')}</th>
                <th scope="col" style={{ textAlign: 'right' }}>{t('admin.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredPromotions.map((promo) => (
                <tr key={promo.code}>
                  <td data-label={t('admin.promotions.table.code')}>
                    <div className="admin-promo-code-cell">
                      <strong className="admin-promo-code">{promo.code}</strong>
                      <span className="admin-promo-desc">{promo.description}</span>
                      <span className={`admin-promo-scope ${promo.userId ? 'admin-promo-scope--reward' : ''}`}>
                        {promo.userId ? 'Recompensa personal' : 'Global'}
                      </span>
                    </div>
                  </td>
                  <td data-label={t('admin.promotions.table.discount')}>
                    <span className="admin-category-badge">
                      {promo.discountType === 'PERCENT'
                        ? `${promo.discountValue}%${promo.maxDiscount ? ` (tope ${formatPrice(promo.maxDiscount).formatted})` : ''}`
                        : formatPrice(promo.discountValue).formatted}
                    </span>
                  </td>
                  <td data-label={t('admin.promotions.table.minSubtotal')}>
                    {promo.minSubtotal > 0 ? formatPrice(promo.minSubtotal).formatted : 'Sin mínimo'}
                  </td>
                  <td data-label={t('admin.promotions.table.uses')}>
                    {promo.currentUses} / {promo.maxUses ?? '∞'}
                  </td>
                  <td data-label={t('admin.promotions.table.active')}>
                    <input
                      type="checkbox"
                      {...({ switch: '' })}
                      className="admin-switch-input"
                      aria-label={`Toggle active for ${promo.code}`}
                      checked={Boolean(promo.active)}
                      onChange={() => handleToggleActive(promo)}
                    />
                  </td>
                  <td data-label={t('admin.table.actions')}>
                    <div className="admin-actions-cell" style={{ justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="admin-action-btn"
                        onClick={() => handleOpenEdit(promo)}
                      >
                        <span aria-hidden="true">✏️</span> {t('admin.table.edit')}
                      </button>
                      <button
                        type="button"
                        className="admin-action-btn admin-action-btn--delete"
                        onClick={() => handleConfirmDelete(promo)}
                        aria-label={`${t('admin.table.delete')} ${promo.code}`}
                      >
                        <span aria-hidden="true">🗑️</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && filteredPromotions.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                      {t('admin.promotions.empty')}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Create / Edit Promo Drawer */}
      <dialog ref={drawerRef} className="admin-drawer" closedby="any" aria-labelledby="promo-drawer-title">
        <div className="admin-drawer__header">
          <h2 id="promo-drawer-title" className="admin-drawer__title">
            {formData.isEdit ? t('admin.promotions.form.titleEdit') : t('admin.promotions.form.titleNew')}
          </h2>
          <button
            type="button"
            className="admin-drawer__close"
            onClick={() => drawerRef.current?.close()}
            aria-label={t('admin.form.cancel')}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="admin-drawer__body">
          <div className="admin-form-group">
            <label htmlFor="promo-code-input" className="admin-form-label">
              {t('admin.promotions.form.code')}
            </label>
            <input
              id="promo-code-input"
              type="text"
              required
              disabled={formData.isEdit}
              pattern="[A-Za-z0-9_-]{3,30}"
              className="admin-form-input"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="Ej. VERANO20"
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="promo-desc-input" className="admin-form-label">
              {t('admin.promotions.form.description')}
            </label>
            <input
              id="promo-desc-input"
              type="text"
              required
              className="admin-form-input"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="20% de descuento en mochis de temporada"
            />
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label htmlFor="promo-type-select" className="admin-form-label">
                {t('admin.promotions.form.discountType')}
              </label>
              <select
                id="promo-type-select"
                className="admin-form-select"
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
              >
                <option value="PERCENT">Porcentaje (%)</option>
                <option value="FIXED">Monto fijo ($ USD)</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label htmlFor="promo-value-input" className="admin-form-label">
                {t('admin.promotions.form.discountValue')}
              </label>
              <input
                id="promo-value-input"
                type="number"
                step="0.01"
                min="0.1"
                max={formData.discountType === 'PERCENT' ? 100 : undefined}
                required
                className="admin-form-input"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label htmlFor="promo-min-input" className="admin-form-label">
                {t('admin.promotions.form.minSubtotal')}
              </label>
              <input
                id="promo-min-input"
                type="number"
                step="0.5"
                min="0"
                className="admin-form-input"
                value={formData.minSubtotal}
                onChange={(e) => setFormData({ ...formData, minSubtotal: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="promo-cap-input" className="admin-form-label">
                {t('admin.promotions.form.maxDiscount')}
              </label>
              <input
                id="promo-cap-input"
                type="number"
                step="0.5"
                min="0.5"
                className="admin-form-input"
                value={formData.maxDiscount}
                onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label htmlFor="promo-max-uses" className="admin-form-label">
                {t('admin.promotions.form.maxUses')}
              </label>
              <input
                id="promo-max-uses"
                type="number"
                min="1"
                className="admin-form-input"
                value={formData.maxUses}
                onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                placeholder="Ilimitado"
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="promo-expires-at" className="admin-form-label">
                {t('admin.promotions.form.expiresAt')}
              </label>
              <input
                id="promo-expires-at"
                type="date"
                className="admin-form-input"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              />
            </div>
          </div>

          <label htmlFor="promo-active-checkbox" className="admin-form-checkbox">
            <input
              id="promo-active-checkbox"
              type="checkbox"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
            />
            <span>{t('admin.promotions.form.active')}</span>
          </label>

          <div className="admin-drawer__footer">
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={() => drawerRef.current?.close()}
            >
              {t('admin.form.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="admin-catalog__btn-primary"
              style={{ padding: '0.65rem 1.5rem' }}
            >
              {isSubmitting ? 'Guardando...' : t('admin.promotions.form.save')}
            </button>
          </div>
        </form>
      </dialog>

      {/* Delete Confirmation */}
      <dialog
        ref={deleteDialogRef}
        className="admin-confirm-dialog"
        closedby="any"
        aria-labelledby="delete-promo-title"
        onClose={handleDeleteDialogClose}
      >
        <h2 id="delete-promo-title" className="admin-confirm-dialog__title">
          {t('admin.table.delete')}
        </h2>
        <p className="admin-confirm-dialog__text">
          {`¿Eliminar permanentemente el cupón "${promoToDelete?.code || ''}"?`}
        </p>
        <form method="dialog" className="admin-confirm-dialog__actions">
          <button type="submit" value="cancel" className="admin-btn-secondary" autoFocus>
            {t('admin.form.cancel')}
          </button>
          <button type="submit" value="confirm" className="admin-btn-danger">
            {t('admin.table.delete')}
          </button>
        </form>
      </dialog>
    </div>
  );
}
