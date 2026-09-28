import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '@shared/components/Navbar/Navbar';
import SideNavBar from '@shared/components/SideNavBar/SideNavBar';
import { useProductStore } from '@modules/catalog/application/stores/productStore';
import { useAuthStore } from '@/modules/auth/application/stores/authStore';
import { useCurrency } from '@/modules/cart/application/hooks/useCurrency';
import './AdminCatalogPage.css';

const DEFAULT_FORM = {
  id: '',
  name: '',
  shortName: '',
  category: 'Strawberry',
  price: 4.5,
  originalPrice: 4.5,
  discount: 0,
  stock: 25,
  inStock: true,
  featured: false,
  description: '',
  longDescription: '',
  image: '/assets/strawberry1.png',
  images: ['/assets/strawberry1.png'],
};

export default function AdminCatalogPage() {
  const { t } = useTranslation();
  const { format: formatPrice } = useCurrency();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const {
    products,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    isLoading,
  } = useProductStore();

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [stockFilter, setStockFilter] = useState('all');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const userName =
    String(user?.fullName || '').trim() ||
    String(user?.email || '').split('@')[0] ||
    'Admin';

  const CATEGORIES = ['All', 'Strawberry', 'Mango', 'Matcha', 'Chocolate', 'Special'];

  // Metrics
  const totalCount = products.length;
  const featuredCount = products.filter((p) => p.featured).length;
  const discountCount = products.filter((p) => (p.discount || 0) > 0).length;
  const totalInventory = products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);

  // Filtered Products
  const filteredList = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCat !== 'All' && p.category?.toLowerCase() !== selectedCat.toLowerCase()) {
        return false;
      }
      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = p.name?.toLowerCase().includes(q);
        const matchCat = p.category?.toLowerCase().includes(q);
        const matchDesc = p.description?.toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchDesc) return false;
      }
      // Stock filter
      if (stockFilter === 'inStock' && (!p.inStock || p.stock <= 0)) return false;
      if (stockFilter === 'outOfStock' && (p.inStock && p.stock > 0)) return false;

      return true;
    });
  }, [products, selectedCat, search, stockFilter]);

  const handleOpenCreate = () => {
    setFormData({
      ...DEFAULT_FORM,
      id: '',
      image: '/assets/strawberry1.png',
      images: ['/assets/strawberry1.png'],
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setFormData({
      id: prod.id,
      name: prod.name || '',
      shortName: prod.shortName || '',
      category: prod.category || 'Strawberry',
      price: Number(prod.price) || 0,
      originalPrice: Number(prod.originalPrice) || Number(prod.price) || 0,
      discount: Number(prod.discount) || 0,
      stock: Number(prod.stock) || 0,
      inStock: prod.inStock ?? true,
      featured: prod.featured ?? false,
      description: prod.description || '',
      longDescription: prod.longDescription || '',
      image: prod.image || '/assets/strawberry1.png',
      images: prod.images?.length ? prod.images : [prod.image || '/assets/strawberry1.png'],
    });
    setIsDrawerOpen(true);
  };

  const handleToggleVisibility = async (prod) => {
    try {
      await updateProduct(prod.id, { inStock: !prod.inStock });
    } catch (err) {
      alert(`Error al actualizar estado: ${err.message}`);
    }
  };

  const handleDelete = async (prod) => {
    const confirmDelete = window.confirm(
      t('admin.table.deleteConfirm') || `¿Eliminar permanentemente "${prod.name}" del catálogo?`
    );
    if (!confirmDelete) return;

    try {
      await deleteProduct(prod.id);
      setFeedbackMsg(`Producto "${prod.name}" eliminado correctamente.`);
      setTimeout(() => setFeedbackMsg(''), 4000);
    } catch (err) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        shortName: formData.shortName.trim() || formData.name.trim(),
        category: formData.category,
        price: Number(formData.price),
        originalPrice: Number(formData.originalPrice) || Number(formData.price),
        discount: Number(formData.discount) || 0,
        stock: Number(formData.stock) || 0,
        inStock: Boolean(formData.inStock),
        featured: Boolean(formData.featured),
        description: formData.description.trim() || 'Artesanal y delicioso mochi tradicional.',
        longDescription: formData.longDescription.trim() || formData.description.trim(),
        image: formData.image || '/assets/strawberry1.png',
        images: formData.images || [formData.image || '/assets/strawberry1.png'],
      };

      if (formData.id) {
        await updateProduct(formData.id, payload);
        setFeedbackMsg(`Producto "${payload.name}" actualizado exitosamente.`);
      } else {
        await addProduct(payload);
        setFeedbackMsg(`Producto "${payload.name}" creado exitosamente.`);
      }

      setIsDrawerOpen(false);
      setTimeout(() => setFeedbackMsg(''), 4000);
    } catch (err) {
      alert(`Error al guardar: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated && !user) {
    return null;
  }

  return (
    <div className="admin-catalog">
      <Navbar userName={userName} currentPage="admin-catalog" />

      <div className="admin-catalog__layout">
        <SideNavBar />

        <main className="admin-catalog__main">
          {/* Header */}
          <div className="admin-catalog__header">
            <div className="admin-catalog__header-titles">
              <span className="admin-catalog__badge">👑 Portal de Administración</span>
              <h1 className="admin-catalog__title">{t('admin.title')}</h1>
              <p className="admin-catalog__subtitle">{t('admin.subtitle')}</p>
            </div>

            <button
              type="button"
              className="admin-catalog__btn-primary"
              onClick={handleOpenCreate}
            >
              <span>+</span>
              <span>{t('admin.newProduct')}</span>
            </button>
          </div>

          {feedbackMsg && (
            <div
              style={{
                background: '#dcfce7',
                color: '#15803d',
                padding: '0.85rem 1.25rem',
                borderRadius: '0.75rem',
                marginBottom: '1.5rem',
                fontWeight: 500,
                border: '1px solid #bbf7d0',
              }}
            >
              ✓ {feedbackMsg}
            </div>
          )}

          {/* Metric KPI Cards */}
          <section className="admin-catalog__kpis">
            <div className="admin-kpi-card">
              <div className="admin-kpi-card__icon admin-kpi-card__icon--brown">🍡</div>
              <div className="admin-kpi-card__content">
                <span className="admin-kpi-card__value">{totalCount}</span>
                <span className="admin-kpi-card__label">{t('admin.metrics.totalProducts')}</span>
              </div>
            </div>

            <div className="admin-kpi-card">
              <div className="admin-kpi-card__icon admin-kpi-card__icon--gold">⭐</div>
              <div className="admin-kpi-card__content">
                <span className="admin-kpi-card__value">{featuredCount}</span>
                <span className="admin-kpi-card__label">{t('admin.metrics.featured')}</span>
              </div>
            </div>

            <div className="admin-kpi-card">
              <div className="admin-kpi-card__icon admin-kpi-card__icon--rose">🏷️</div>
              <div className="admin-kpi-card__content">
                <span className="admin-kpi-card__value">{discountCount}</span>
                <span className="admin-kpi-card__label">{t('admin.metrics.activeDiscounts')}</span>
              </div>
            </div>

            <div className="admin-kpi-card">
              <div className="admin-kpi-card__icon admin-kpi-card__icon--green">📦</div>
              <div className="admin-kpi-card__content">
                <span className="admin-kpi-card__value">{totalInventory}</span>
                <span className="admin-kpi-card__label">{t('admin.metrics.totalInventory')}</span>
              </div>
            </div>
          </section>

          {/* Filter Toolbar */}
          <section className="admin-catalog__toolbar">
            <div className="admin-catalog__search-box">
              <span>🔍</span>
              <input
                type="text"
                placeholder={t('admin.filters.searchPlaceholder')}
                className="admin-catalog__search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="admin-catalog__categories">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`admin-catalog__cat-pill ${
                    selectedCat === cat ? 'admin-catalog__cat-pill--active' : ''
                  }`}
                  onClick={() => setSelectedCat(cat)}
                >
                  {cat === 'All' ? t('admin.filters.allCategories') : cat}
                </button>
              ))}
            </div>

            <div>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="admin-form-select"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                <option value="all">{t('admin.filters.allStatuses')}</option>
                <option value="inStock">{t('admin.filters.inStock')}</option>
                <option value="outOfStock">{t('admin.filters.outOfStock')}</option>
              </select>
            </div>
          </section>

          {/* Product Data Table */}
          <section className="admin-catalog__table-card">
            <div className="admin-catalog__table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t('admin.table.product')}</th>
                    <th>{t('admin.table.category')}</th>
                    <th>{t('admin.table.price')}</th>
                    <th>{t('admin.table.stock')}</th>
                    <th>{t('admin.table.visibility')}</th>
                    <th style={{ textAlign: 'right' }}>{t('admin.table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((prod) => {
                    const hasDiscount = Number(prod.discount) > 0;
                    return (
                      <tr key={prod.id}>
                        <td>
                          <div className="admin-product-cell">
                            <img
                              src={prod.image || '/assets/strawberry1.png'}
                              alt={prod.name}
                              className="admin-product-thumb"
                              onError={(e) => {
                                e.target.src = '/assets/strawberry1.png';
                              }}
                            />
                            <div className="admin-product-info">
                              <span className="admin-product-name">{prod.name}</span>
                              <span className="admin-product-desc">
                                {prod.description || prod.shortName}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="admin-category-badge">{prod.category}</span>
                        </td>
                        <td>
                          <div className="admin-price-cell">
                            <span className="admin-price-final">
                              {formatPrice(prod.price).formatted}
                            </span>
                            {hasDiscount && (
                              <>
                                <span className="admin-price-original">
                                  {formatPrice(prod.originalPrice || prod.price).formatted}
                                </span>
                                <span className="admin-discount-badge">
                                  -{prod.discount}% OFF
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="admin-stock-indicator">
                            <span
                              className={`admin-stock-dot ${
                                prod.stock <= 0
                                  ? 'admin-stock-dot--out'
                                  : prod.stock < 15
                                  ? 'admin-stock-dot--low'
                                  : ''
                              }`}
                            />
                            <span>{prod.stock || 0} u.</span>
                          </div>
                        </td>
                        <td>
                          <label className="admin-switch" title="Activar/Ocultar producto">
                            <input
                              type="checkbox"
                              checked={Boolean(prod.inStock)}
                              onChange={() => handleToggleVisibility(prod)}
                            />
                            <span className="admin-switch__slider" />
                          </label>
                        </td>
                        <td>
                          <div
                            className="admin-actions-cell"
                            style={{ justifyContent: 'flex-end' }}
                          >
                            <button
                              type="button"
                              className="admin-action-btn"
                              onClick={() => handleOpenEdit(prod)}
                              title={t('admin.table.edit')}
                            >
                              ✏️ {t('admin.table.edit')}
                            </button>
                            <button
                              type="button"
                              className="admin-action-btn admin-action-btn--delete"
                              onClick={() => handleDelete(prod)}
                              title={t('admin.table.delete')}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredList.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                          No se encontraron productos coincidentes.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {/* Slide-over Drawer (Create / Edit Form) */}
      {isDrawerOpen && (
        <div className="admin-drawer-overlay" onClick={() => setIsDrawerOpen(false)}>
          <div className="admin-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="admin-drawer__header">
              <h2 className="admin-drawer__title">
                {formData.id ? t('admin.form.titleEdit') : t('admin.form.titleNew')}
              </h2>
              <button
                type="button"
                className="admin-drawer__close"
                onClick={() => setIsDrawerOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="admin-drawer__body">
              <div className="admin-form-group">
                <label className="admin-form-label">{t('admin.form.name')}</label>
                <input
                  type="text"
                  required
                  className="admin-form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej. Blueberry Dream Mochi"
                />
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">{t('admin.form.shortName')}</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={formData.shortName}
                    onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                    placeholder="Ej. Blueberry Dream"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">{t('admin.form.category')}</label>
                  <select
                    className="admin-form-select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Strawberry">Strawberry</option>
                    <option value="Mango">Mango</option>
                    <option value="Matcha">Matcha</option>
                    <option value="Chocolate">Chocolate</option>
                    <option value="Special">Special / Seasonal</option>
                  </select>
                </div>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">{t('admin.form.price')}</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    required
                    className="admin-form-input"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">{t('admin.form.discount')}</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="admin-form-input"
                    value={formData.discount}
                    onChange={(e) =>
                      setFormData({ ...formData, discount: parseInt(e.target.value, 10) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">{t('admin.form.stock')}</label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="admin-form-input"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })
                    }
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">{t('admin.form.image')}</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={formData.image}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        image: e.target.value,
                        images: [e.target.value],
                      })
                    }
                    placeholder="/assets/strawberry1.png"
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">{t('admin.form.description')}</label>
                <input
                  type="text"
                  required
                  className="admin-form-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción resumida del producto"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">{t('admin.form.longDescription')}</label>
                <textarea
                  rows={3}
                  className="admin-form-textarea"
                  value={formData.longDescription}
                  onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
                  placeholder="Historia, origen y detalles del postre..."
                />
              </div>

              <label className="admin-form-checkbox">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                />
                <span>{t('admin.form.featured')}</span>
              </label>

              <label className="admin-form-checkbox">
                <input
                  type="checkbox"
                  checked={formData.inStock}
                  onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                />
                <span>{t('admin.form.inStock')}</span>
              </label>

              <div className="admin-drawer__footer">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setIsDrawerOpen(false)}
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
                    : t('admin.form.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
