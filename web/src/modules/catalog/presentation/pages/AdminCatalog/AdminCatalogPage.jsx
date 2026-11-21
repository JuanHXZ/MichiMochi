import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '@shared/components/Navbar/Navbar';
import SideNavBar from '@shared/components/SideNavBar/SideNavBar';
import { useProductStore } from '@modules/catalog/application/stores/productStore';
import { useAuthStore } from '@/modules/auth/application/stores/authStore';
import { useCurrency } from '@/modules/cart/application/hooks/useCurrency';
import { useToastStore } from '@shared/stores/toastStore';
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
  const hydrateSession = useAuthStore((state) => state.hydrateSession);

  const {
    products,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    isLoading,
  } = useProductStore();

  const showToast = useToastStore((state) => state.showToast);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [stockFilter, setStockFilter] = useState('all');
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const drawerDialogRef = useRef(null);
  const deleteDialogRef = useRef(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const freshUser = await hydrateSession();
      const effectiveUser = freshUser || user;
      if (!active) return;
      if (!effectiveUser) {
        window.location.replace('/login');
        return;
      }
      if (effectiveUser.role !== 'admin') {
        showToast({
          message: 'Acceso denegado: se requieren permisos de administrador.',
          type: 'error',
        });
        window.location.replace('/dashboard');
        return;
      }
      fetchProducts();
    })();
    return () => {
      active = false;
    };
  }, [fetchProducts, hydrateSession]);

  // Safari fallback for closedby="any"
  useEffect(() => {
    if ('closedBy' in HTMLDialogElement.prototype) return;

    const cleanups = [drawerDialogRef.current, deleteDialogRef.current]
      .filter(Boolean)
      .map((dialog) => {
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
      });

    return () => cleanups.forEach((fn) => fn());
  }, []);

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
    drawerDialogRef.current?.showModal();
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
    drawerDialogRef.current?.showModal();
  };

  const handleToggleVisibility = async (prod) => {
    try {
      await updateProduct(prod.id, { inStock: !prod.inStock });
    } catch (err) {
      showToast({
        message: `Error al actualizar estado: ${err.message}`,
        type: 'error',
      });
    }
  };

  const handleDelete = (prod) => {
    setProductToDelete(prod);
    deleteDialogRef.current?.showModal();
  };

  const handleDeleteDialogClose = async () => {
    const dialog = deleteDialogRef.current;
    const choice = dialog?.returnValue || '';
    if (dialog) {
      dialog.returnValue = '';
    }

    const target = productToDelete;
    setProductToDelete(null);

    if (choice !== 'confirm' || !target) return;

    try {
      await deleteProduct(target.id);
      showToast({
        message: `Producto "${target.name}" eliminado correctamente.`,
        type: 'success',
      });
    } catch (err) {
      showToast({
        message: `Error al eliminar: ${err.message}`,
        type: 'error',
      });
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
        showToast({
          message: `Producto "${payload.name}" actualizado exitosamente.`,
          type: 'success',
        });
      } else {
        await addProduct(payload);
        showToast({
          message: `Producto "${payload.name}" creado exitosamente.`,
          type: 'success',
        });
      }

      drawerDialogRef.current?.close();
    } catch (err) {
      showToast({
        message: `Error al guardar: ${err.message}`,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated || !user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="admin-catalog">
      <Navbar userName={userName} currentPage="admin-catalog" />

      <div className="admin-catalog__layout">
        <SideNavBar />

        <main id="main-content" className="admin-catalog__main">
          {/* Header */}
          <div className="admin-catalog__header">
            <div className="admin-catalog__header-titles">
              <span className="admin-catalog__badge"><span aria-hidden="true">👑</span> Portal de Administración</span>
              <h1 className="admin-catalog__title">{t('admin.title')}</h1>
              <p className="admin-catalog__subtitle">{t('admin.subtitle')}</p>
            </div>

            <button
              type="button"
              className="admin-catalog__btn-primary"
              onClick={handleOpenCreate}
            >
              <span aria-hidden="true">+</span>
              <span>{t('admin.newProduct')}</span>
            </button>
          </div>

          {/* Metric KPI Cards */}
          <section className="admin-catalog__kpis" aria-label="Catalog metrics">
            <div className="admin-kpi-card">
              <div className="admin-kpi-card__icon admin-kpi-card__icon--brown" aria-hidden="true">🍡</div>
              <div className="admin-kpi-card__content">
                <span className="admin-kpi-card__value">{totalCount}</span>
                <span className="admin-kpi-card__label">{t('admin.metrics.totalProducts')}</span>
              </div>
            </div>

            <div className="admin-kpi-card">
              <div className="admin-kpi-card__icon admin-kpi-card__icon--gold" aria-hidden="true">⭐</div>
              <div className="admin-kpi-card__content">
                <span className="admin-kpi-card__value">{featuredCount}</span>
                <span className="admin-kpi-card__label">{t('admin.metrics.featured')}</span>
              </div>
            </div>

            <div className="admin-kpi-card">
              <div className="admin-kpi-card__icon admin-kpi-card__icon--rose" aria-hidden="true">🏷️</div>
              <div className="admin-kpi-card__content">
                <span className="admin-kpi-card__value">{discountCount}</span>
                <span className="admin-kpi-card__label">{t('admin.metrics.activeDiscounts')}</span>
              </div>
            </div>

            <div className="admin-kpi-card">
              <div className="admin-kpi-card__icon admin-kpi-card__icon--green" aria-hidden="true">📦</div>
              <div className="admin-kpi-card__content">
                <span className="admin-kpi-card__value">{totalInventory}</span>
                <span className="admin-kpi-card__label">{t('admin.metrics.totalInventory')}</span>
              </div>
            </div>
          </section>

          {/* Filter Toolbar */}
          <search className="admin-catalog__toolbar">
            <div className="admin-catalog__search-box">
              <span aria-hidden="true">🔍</span>
              <label htmlFor="admin-catalog-search" className="visually-hidden">
                {t('admin.filters.searchPlaceholder')}
              </label>
              <input
                id="admin-catalog-search"
                name="search"
                type="search"
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
                  aria-pressed={selectedCat === cat}
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
              <label htmlFor="admin-stock-filter" className="visually-hidden">
                {t('admin.filters.allStatuses')}
              </label>
              <select
                id="admin-stock-filter"
                name="stockFilter"
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
          </search>

          {/* Product Data Table */}
          <section className="admin-catalog__table-card">
            <div
              tabIndex={0}
              role="region"
              aria-labelledby="admin-products-caption"
              className="admin-catalog__table-wrapper"
            >
              <table className="admin-table">
                <caption id="admin-products-caption" className="visually-hidden">
                  {t('admin.title')}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">{t('admin.table.product')}</th>
                    <th scope="col">{t('admin.table.category')}</th>
                    <th scope="col">{t('admin.table.price')}</th>
                    <th scope="col">{t('admin.table.stock')}</th>
                    <th scope="col">{t('admin.table.visibility')}</th>
                    <th scope="col" style={{ textAlign: 'right' }}>{t('admin.table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((prod) => {
                    const hasDiscount = Number(prod.discount) > 0;
                    return (
                      <tr key={prod.id}>
                        <td data-label={t('admin.table.product')}>
                          <div className="admin-product-cell">
                            <img
                              src={prod.image || '/assets/strawberry1.png'}
                              alt={prod.name}
                              className="admin-product-thumb"
                              width={56}
                              height={56}
                              loading="lazy"
                              decoding="async"
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
                        <td data-label={t('admin.table.category')}>
                          <span className="admin-category-badge">{prod.category}</span>
                        </td>
                        <td data-label={t('admin.table.price')}>
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
                        <td data-label={t('admin.table.stock')}>
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
                        <td data-label={t('admin.table.visibility')}>
                          <input
                            type="checkbox"
                            {...({ switch: '' })}
                            className="admin-switch-input"
                            aria-label={`Toggle visibility for ${prod.name}`}
                            checked={Boolean(prod.inStock)}
                            onChange={() => handleToggleVisibility(prod)}
                          />
                        </td>
                        <td data-label={t('admin.table.actions')}>
                          <div
                            className="admin-actions-cell"
                            style={{ justifyContent: 'flex-end' }}
                          >
                            <button
                              type="button"
                              className="admin-action-btn"
                              onClick={() => handleOpenEdit(prod)}
                              aria-label={`${t('admin.table.edit')} ${prod.name}`}
                            >
                              <span aria-hidden="true">✏️</span> {t('admin.table.edit')}
                            </button>
                            <button
                              type="button"
                              className="admin-action-btn admin-action-btn--delete"
                              onClick={() => handleDelete(prod)}
                              aria-label={`${t('admin.table.delete')} ${prod.name}`}
                            >
                              <span aria-hidden="true">🗑️</span>
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
      <dialog
        ref={drawerDialogRef}
        className="admin-drawer"
        closedby="any"
        aria-labelledby="admin-drawer-title"
      >
        <div className="admin-drawer__header">
          <h2 id="admin-drawer-title" className="admin-drawer__title">
            {formData.id ? t('admin.form.titleEdit') : t('admin.form.titleNew')}
          </h2>
          <button
            type="button"
            className="admin-drawer__close"
            onClick={() => drawerDialogRef.current?.close()}
            aria-label={t('admin.form.cancel')}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="admin-drawer__body">
          <div className="admin-form-group">
            <label htmlFor="admin-prod-name" className="admin-form-label">{t('admin.form.name')}</label>
            <input
              id="admin-prod-name"
              name="name"
              type="text"
              required
              autoFocus
              className="admin-form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej. Blueberry Dream Mochi"
            />
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label htmlFor="admin-prod-short-name" className="admin-form-label">{t('admin.form.shortName')}</label>
              <input
                id="admin-prod-short-name"
                name="shortName"
                type="text"
                className="admin-form-input"
                value={formData.shortName}
                onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                placeholder="Ej. Blueberry Dream"
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="admin-prod-category" className="admin-form-label">{t('admin.form.category')}</label>
              <select
                id="admin-prod-category"
                name="category"
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
              <label htmlFor="admin-prod-price" className="admin-form-label">{t('admin.form.price')}</label>
              <input
                id="admin-prod-price"
                name="price"
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
              <label htmlFor="admin-prod-discount" className="admin-form-label">{t('admin.form.discount')}</label>
              <input
                id="admin-prod-discount"
                name="discount"
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
              <label htmlFor="admin-prod-stock" className="admin-form-label">{t('admin.form.stock')}</label>
              <input
                id="admin-prod-stock"
                name="stock"
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
              <label htmlFor="admin-prod-image" className="admin-form-label">{t('admin.form.image')}</label>
              <input
                id="admin-prod-image"
                name="image"
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
            <label htmlFor="admin-prod-desc" className="admin-form-label">{t('admin.form.description')}</label>
            <input
              id="admin-prod-desc"
              name="description"
              type="text"
              required
              className="admin-form-input"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción resumida del producto"
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="admin-prod-long-desc" className="admin-form-label">{t('admin.form.longDescription')}</label>
            <textarea
              id="admin-prod-long-desc"
              name="longDescription"
              rows={3}
              className="admin-form-textarea"
              value={formData.longDescription}
              onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
              placeholder="Historia, origen y detalles del postre..."
            />
          </div>

          <label htmlFor="admin-prod-featured" className="admin-form-checkbox">
            <input
              id="admin-prod-featured"
              name="featured"
              type="checkbox"
              checked={formData.featured}
              onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
            />
            <span>{t('admin.form.featured')}</span>
          </label>

          <label htmlFor="admin-prod-instock" className="admin-form-checkbox">
            <input
              id="admin-prod-instock"
              name="inStock"
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
              onClick={() => drawerDialogRef.current?.close()}
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
      </dialog>

      {/* Delete Confirmation Dialog */}
      <dialog
        ref={deleteDialogRef}
        className="admin-confirm-dialog"
        closedby="any"
        aria-labelledby="delete-dialog-title"
        onClose={handleDeleteDialogClose}
      >
        <h2 id="delete-dialog-title" className="admin-confirm-dialog__title">
          {t('admin.table.delete')}
        </h2>
        <p className="admin-confirm-dialog__text">
          {t('admin.table.deleteConfirm') ||
            `¿Eliminar permanentemente "${productToDelete?.name || ''}" del catálogo?`}
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
