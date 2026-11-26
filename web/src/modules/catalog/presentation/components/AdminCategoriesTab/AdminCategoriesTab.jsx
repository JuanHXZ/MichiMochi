import React, { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useCategoryStore } from '@modules/catalog/application/stores/categoryStore';
import { useProductStore } from '@modules/catalog/application/stores/productStore';
import { useToastStore } from '@shared/stores/toastStore';
import './AdminCategoriesTab.css';

const CATEGORY_ICON_OPTIONS = [
  { icon: '🍡', label: 'Mochi' },
  { icon: '🍓', label: 'Fresa' },
  { icon: '🥭', label: 'Mango' },
  { icon: '🍵', label: 'Matcha' },
  { icon: '🍫', label: 'Chocolate' },
  { icon: '🌸', label: 'Sakura / Especial' },
  { icon: '🍠', label: 'Taro' },
  { icon: '🫐', label: 'Arándano' },
  { icon: '🍑', label: 'Durazno' },
  { icon: '🍋', label: 'Limón / Yuzu' },
  { icon: '🥥', label: 'Coco' },
  { icon: '🍒', label: 'Cereza' },
  { icon: '🍇', label: 'Uva' },
  { icon: '🍊', label: 'Mandarina' },
  { icon: '🍪', label: 'Galleta' },
  { icon: '🧁', label: 'Postre' },
  { icon: '🍨', label: 'Helado' },
  { icon: '☕', label: 'Café' },
  { icon: '✨', label: 'Premium' },
  { icon: '⭐', label: 'Favorito' },
];

const DEFAULT_CATEGORY_FORM = {
  id: '',
  name: '',
  description: '',
  icon: '🍡',
  displayOrder: 0,
  visible: true,
};

export default function AdminCategoriesTab() {
  const { t } = useTranslation();
  const showToast = useToastStore((state) => state.showToast);

  const {
    categories,
    isLoading,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useCategoryStore();
  const products = useProductStore((state) => state.products);
  const fetchProducts = useProductStore((state) => state.fetchProducts);

  const [search, setSearch] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [formData, setFormData] = useState(DEFAULT_CATEGORY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const drawerRef = useRef(null);
  const deleteDialogRef = useRef(null);

  const productCountByCategory = useMemo(() => {
    const map = new Map();
    for (const prod of products) {
      const key = String(prod.category || '').trim().toLowerCase();
      if (!key) continue;
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [products]);

  const totalCount = categories.length;
  const visibleCount = categories.filter((c) => c.visible !== false).length;
  const hiddenCount = totalCount - visibleCount;

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      if (visibilityFilter === 'visible' && cat.visible === false) return false;
      if (visibilityFilter === 'hidden' && cat.visible !== false) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchName = cat.name?.toLowerCase().includes(q);
        const matchDesc = cat.description?.toLowerCase().includes(q);
        if (!matchName && !matchDesc) return false;
      }

      return true;
    });
  }, [categories, visibilityFilter, search]);

  const handleOpenCreate = () => {
    const nextOrder = categories.reduce((max, c) => Math.max(max, Number(c.displayOrder) || 0), 0) + 1;
    setFormData({
      ...DEFAULT_CATEGORY_FORM,
      displayOrder: nextOrder,
    });
    drawerRef.current?.showModal();
  };

  const handleOpenEdit = (cat) => {
    setFormData({
      id: cat.id,
      name: cat.name || '',
      description: cat.description || '',
      icon: cat.icon || '🍡',
      displayOrder: Number(cat.displayOrder) || 0,
      visible: cat.visible !== false,
    });
    drawerRef.current?.showModal();
  };

  const handleToggleVisible = async (cat) => {
    try {
      await updateCategory(cat.id, { visible: !cat.visible });
    } catch (err) {
      showToast({ message: `Error al actualizar visibilidad: ${err.message}`, type: 'error' });
    }
  };

  const handleConfirmDelete = (cat) => {
    setCategoryToDelete(cat);
    deleteDialogRef.current?.showModal();
  };

  const handleDeleteDialogClose = async () => {
    const dialog = deleteDialogRef.current;
    const choice = dialog?.returnValue || '';
    if (dialog) dialog.returnValue = '';

    const target = categoryToDelete;
    setCategoryToDelete(null);
    if (choice !== 'confirm' || !target) return;

    try {
      await deleteCategory(target.id);
      showToast({
        message: `Categoría "${target.name}" eliminada correctamente.`,
        type: 'success',
      });
    } catch (err) {
      showToast({ message: err.message || 'Error al eliminar categoría.', type: 'error' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        icon: formData.icon.trim() || '🍡',
        displayOrder: Math.max(0, parseInt(formData.displayOrder, 10) || 0),
        visible: Boolean(formData.visible),
      };

      if (formData.id) {
        const previous = categories.find((c) => String(c.id) === String(formData.id));
        const updated = await updateCategory(formData.id, payload);
        if (previous && previous.name !== updated.name) {
          await fetchProducts();
        }
        showToast({
          message: `Categoría "${updated.name}" actualizada exitosamente.`,
          type: 'success',
        });
      } else {
        const created = await addCategory(payload);
        showToast({
          message: `Categoría "${created.name}" creada exitosamente.`,
          type: 'success',
        });
      }

      drawerRef.current?.close();
    } catch (err) {
      showToast({ message: `Error al guardar categoría: ${err.message}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-categories">
      <div className="admin-categories__top-actions">
        <div>
          <h2 className="admin-categories__heading">{t('admin.categories.title')}</h2>
          <p className="admin-categories__subheading">{t('admin.categories.subtitle')}</p>
        </div>
        <button
          type="button"
          className="admin-catalog__btn-primary"
          onClick={handleOpenCreate}
        >
          <span aria-hidden="true">+</span>
          <span>{t('admin.categories.newCategory')}</span>
        </button>
      </div>

      {/* KPIs */}
      <section className="admin-catalog__kpis" aria-label="Categories metrics">
        <div className="admin-kpi-card">
          <div className="admin-kpi-card__icon admin-kpi-card__icon--brown" aria-hidden="true">🏷️</div>
          <div className="admin-kpi-card__content">
            <span className="admin-kpi-card__value">{totalCount}</span>
            <span className="admin-kpi-card__label">{t('admin.categories.metrics.total')}</span>
          </div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-card__icon admin-kpi-card__icon--green" aria-hidden="true">👁️</div>
          <div className="admin-kpi-card__content">
            <span className="admin-kpi-card__value">{visibleCount}</span>
            <span className="admin-kpi-card__label">{t('admin.categories.metrics.visible')}</span>
          </div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-card__icon admin-kpi-card__icon--rose" aria-hidden="true">🙈</div>
          <div className="admin-kpi-card__content">
            <span className="admin-kpi-card__value">{hiddenCount}</span>
            <span className="admin-kpi-card__label">{t('admin.categories.metrics.hidden')}</span>
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <search className="admin-catalog__toolbar">
        <div className="admin-catalog__search-box">
          <span aria-hidden="true">🔍</span>
          <label htmlFor="admin-categories-search" className="visually-hidden">
            {t('admin.categories.searchPlaceholder')}
          </label>
          <input
            id="admin-categories-search"
            type="search"
            className="admin-catalog__search-input"
            placeholder={t('admin.categories.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="admin-catalog__categories">
          {[
            { id: 'all', label: t('admin.categories.filters.all') },
            { id: 'visible', label: t('admin.categories.filters.visible') },
            { id: 'hidden', label: t('admin.categories.filters.hidden') },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              aria-pressed={visibilityFilter === opt.id}
              className={`admin-catalog__cat-pill ${
                visibilityFilter === opt.id ? 'admin-catalog__cat-pill--active' : ''
              }`}
              onClick={() => setVisibilityFilter(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </search>

      {/* Table */}
      <section className="admin-catalog__table-card">
        <div
          tabIndex={0}
          role="region"
          aria-labelledby="admin-categories-caption"
          className="admin-catalog__table-wrapper"
        >
          <table className="admin-table">
            <caption id="admin-categories-caption" className="visually-hidden">
              {t('admin.categories.title')}
            </caption>
            <thead>
              <tr>
                <th scope="col">{t('admin.categories.table.category')}</th>
                <th scope="col">{t('admin.categories.table.products')}</th>
                <th scope="col">{t('admin.categories.table.order')}</th>
                <th scope="col">{t('admin.table.visibility')}</th>
                <th scope="col" style={{ textAlign: 'right' }}>{t('admin.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((cat) => {
                const count = productCountByCategory.get(String(cat.name || '').trim().toLowerCase()) || 0;
                return (
                  <tr key={cat.id}>
                    <td data-label={t('admin.categories.table.category')}>
                      <div className="admin-category-cell">
                        <span className="admin-category-cell__icon" aria-hidden="true">
                          {cat.icon || '🍡'}
                        </span>
                        <div className="admin-product-info">
                          <span className="admin-product-name">{cat.name}</span>
                          <span className="admin-product-desc">
                            {cat.description || '—'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td data-label={t('admin.categories.table.products')}>
                      <span className="admin-category-badge">{count}</span>
                    </td>
                    <td data-label={t('admin.categories.table.order')}>
                      <span>#{cat.displayOrder ?? 0}</span>
                    </td>
                    <td data-label={t('admin.table.visibility')}>
                      <input
                        type="checkbox"
                        {...({ switch: '' })}
                        className="admin-switch-input"
                        aria-label={`Toggle visibility for ${cat.name}`}
                        checked={cat.visible !== false}
                        onChange={() => handleToggleVisible(cat)}
                      />
                    </td>
                    <td data-label={t('admin.table.actions')}>
                      <div className="admin-actions-cell" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="admin-action-btn"
                          onClick={() => handleOpenEdit(cat)}
                          aria-label={`${t('admin.table.edit')} ${cat.name}`}
                        >
                          <span aria-hidden="true">✏️</span> {t('admin.table.edit')}
                        </button>
                        <button
                          type="button"
                          className="admin-action-btn admin-action-btn--delete"
                          onClick={() => handleConfirmDelete(cat)}
                          aria-label={`${t('admin.table.delete')} ${cat.name}`}
                        >
                          <span aria-hidden="true">🗑️</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!isLoading && filteredCategories.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                      {t('admin.categories.empty')}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Create / Edit Drawer */}
      <dialog
        ref={drawerRef}
        className="admin-drawer"
        closedby="any"
        aria-labelledby="admin-category-drawer-title"
      >
        <div className="admin-drawer__header">
          <h2 id="admin-category-drawer-title" className="admin-drawer__title">
            {formData.id ? t('admin.categories.form.titleEdit') : t('admin.categories.form.titleNew')}
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
            <label htmlFor="admin-cat-name" className="admin-form-label">
              {t('admin.categories.form.name')}
            </label>
            <input
              id="admin-cat-name"
              name="name"
              type="text"
              required
              minLength={2}
              autoFocus
              className="admin-form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej. Taro, Sakura, Temporada"
            />
          </div>

          <div className="admin-form-group">
            <span id="admin-cat-icon-label" className="admin-form-label">
              {t('admin.categories.form.icon')}
            </span>
            <div
              className="admin-icon-picker"
              role="radiogroup"
              aria-labelledby="admin-cat-icon-label"
            >
              {CATEGORY_ICON_OPTIONS.map((opt) => {
                const isSelected = formData.icon === opt.icon;
                return (
                  <button
                    key={opt.icon}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={opt.label}
                    title={opt.label}
                    className={`admin-icon-picker__btn ${
                      isSelected ? 'admin-icon-picker__btn--active' : ''
                    }`}
                    onClick={() => setFormData({ ...formData, icon: opt.icon })}
                  >
                    <span aria-hidden="true">{opt.icon}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="admin-form-group">
            <label htmlFor="admin-cat-order" className="admin-form-label">
              {t('admin.categories.form.order')}
            </label>
            <input
              id="admin-cat-order"
              name="displayOrder"
              type="number"
              min="0"
              className="admin-form-input"
              value={formData.displayOrder}
              onChange={(e) =>
                setFormData({ ...formData, displayOrder: parseInt(e.target.value, 10) || 0 })
              }
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="admin-cat-desc" className="admin-form-label">
              {t('admin.categories.form.description')}
            </label>
            <textarea
              id="admin-cat-desc"
              name="description"
              rows={3}
              className="admin-form-textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción breve de la categoría..."
            />
          </div>

          <label htmlFor="admin-cat-visible" className="admin-form-checkbox">
            <input
              id="admin-cat-visible"
              name="visible"
              type="checkbox"
              checked={formData.visible}
              onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
            />
            <span>{t('admin.categories.form.visible')}</span>
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
              disabled={isSubmitting || isLoading}
              className="admin-catalog__btn-primary"
              style={{ padding: '0.65rem 1.5rem' }}
            >
              {isSubmitting
                ? 'Guardando...'
                : formData.id
                ? t('admin.form.saveChanges')
                : t('admin.categories.form.save')}
            </button>
          </div>
        </form>
      </dialog>

      {/* Delete Confirmation Dialog */}
      <dialog
        ref={deleteDialogRef}
        className="admin-confirm-dialog"
        closedby="any"
        aria-labelledby="delete-category-dialog-title"
        onClose={handleDeleteDialogClose}
      >
        <h2 id="delete-category-dialog-title" className="admin-confirm-dialog__title">
          {t('admin.table.delete')}
        </h2>
        <p className="admin-confirm-dialog__text">
          {t('admin.categories.deleteConfirm', { name: categoryToDelete?.name || '' })}
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
