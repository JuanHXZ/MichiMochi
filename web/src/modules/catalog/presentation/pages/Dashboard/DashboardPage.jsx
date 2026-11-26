import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import Navbar from "@shared/components/Navbar/Navbar";
import SideNavBar from "@shared/components/SideNavBar/SideNavBar";
import HeroBanner from "../../components/HeroBanner/HeroBanner";
import ProductCard from "../../components/ProductCard/ProductCard";
import { useCartStore } from "@/modules/cart/application/stores/cartStore";
import { useAuthStore } from "@/modules/auth/application/stores/authStore";
import { useProductStore } from "../../../application/stores/productStore";
import { useCategoryStore } from "../../../application/stores/categoryStore";
import { useTranslatedProducts, useTranslatedFeaturedProduct } from "../../../application/hooks/useTranslatedProducts";
import "./DashboardPage.css";

export default function DashboardPage() {
  const { t } = useTranslation();
  const [sortOption, setSortOption] = useState("Popular");
  const addItem = useCartStore((state) => state.addItem);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const fetchProducts = useProductStore((state) => state.fetchProducts);
  const selectedCategory = useProductStore((state) => state.selectedCategory);
  const setCategory = useProductStore((state) => state.setCategory);
  const isLoading = useProductStore((state) => state.isLoading);
  const hasLoaded = useProductStore((state) => state.hasLoaded);
  const categories = useCategoryStore((state) => state.categories);
  const fetchCategories = useCategoryStore((state) => state.fetchCategories);

  const { filteredProducts } = useTranslatedProducts();
  const featuredProduct = useTranslatedFeaturedProduct();

  useEffect(() => {
    fetchProducts({ inStock: true });
    fetchCategories({ visible: true });
  }, [fetchProducts, fetchCategories]);

  const visibleCategories = useMemo(
    () => categories.filter((c) => c.visible !== false),
    [categories]
  );

  useEffect(() => {
    if (selectedCategory === "All" || visibleCategories.length === 0) return;
    const stillVisible = visibleCategories.some(
      (c) => c.name.toLowerCase() === selectedCategory.toLowerCase()
    );
    if (!stillVisible) {
      setCategory("All");
    }
  }, [selectedCategory, visibleCategories, setCategory]);

  const SORT_OPTIONS = [
    { id: "Popular", label: t('dashboard.filters.popular') },
    { id: "Newest", label: t('dashboard.filters.newest') },
    { id: "Price", label: t('dashboard.filters.price') },
  ];

  const sortedProducts = useMemo(() => {
    const items = filteredProducts.filter((p) => p.inStock !== false);

    if (sortOption === "Price") {
      return items.sort((a, b) => a.price - b.price);
    }

    if (sortOption === "Newest") {
      return items.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (dateA !== dateB) return dateB - dateA;
        const numA = Number(a.id);
        const numB = Number(b.id);
        if (!Number.isNaN(numA) && !Number.isNaN(numB)) return numB - numA;
        return String(b.id).localeCompare(String(a.id));
      });
    }

    return items.sort((a, b) => {
      const scoreA = (a.rating || 0) * 100 + (a.reviewCount || 0);
      const scoreB = (b.rating || 0) * 100 + (b.reviewCount || 0);
      return scoreB - scoreA;
    });
  }, [filteredProducts, sortOption]);

  const userName = isAuthenticated && user
    ? String(user.fullName || "").trim() || String(user.email || "").split("@")[0] || "User"
    : "";

  const handleAddToCart = (product) => {
    const isOutOfStock = product?.inStock === false || (typeof product?.stock === 'number' && product.stock <= 0);
    if (isOutOfStock) return;
    addItem(product);
  };

  const handleOrderNow = () => {
    if (!featuredProduct) return;
    const isOutOfStock = featuredProduct.inStock === false || (typeof featuredProduct.stock === 'number' && featuredProduct.stock <= 0);
    if (isOutOfStock) return;
    addItem(featuredProduct);
  };

  return (
    <div className="dashboard-stitch">
      <Navbar userName={userName} currentPage="catalog" />

      <div className="dashboard-stitch__layout">
        <SideNavBar />

        <main id="main-content" className="dashboard-stitch__main">
          {featuredProduct && (
            <HeroBanner product={featuredProduct} onOrderClick={handleOrderNow} />
          )}

          <section className="dashboard-stitch__filters">
            <div>
              <h2 className="dashboard-stitch__title">{t('dashboard.catalog.title')}</h2>
              <p className="dashboard-stitch__subtitle">
                {t('dashboard.catalog.subtitle')}
              </p>
            </div>
            <div className="dashboard-stitch__filter-pills">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  className={`dashboard-stitch__pill ${
                    sortOption === option.id ? "dashboard-stitch__pill--active" : ""
                  }`}
                  onClick={() => setSortOption(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          {visibleCategories.length > 0 && (
            <div
              className="dashboard-stitch__category-pills"
              role="group"
              aria-label={t('sidebar.title')}
            >
              <button
                type="button"
                aria-pressed={selectedCategory === "All"}
                className={`dashboard-stitch__pill ${
                  selectedCategory === "All" ? "dashboard-stitch__pill--active" : ""
                }`}
                onClick={() => setCategory("All")}
              >
                {t('dashboard.filters.allCategories')}
              </button>
              {visibleCategories.map((cat) => {
                const isActive = selectedCategory.toLowerCase() === cat.name.toLowerCase();
                return (
                  <button
                    key={cat.id}
                    type="button"
                    aria-pressed={isActive}
                    className={`dashboard-stitch__pill ${
                      isActive ? "dashboard-stitch__pill--active" : ""
                    }`}
                    onClick={() => setCategory(cat.name)}
                  >
                    {cat.icon ? `${cat.icon} ` : ""}{cat.name}
                  </button>
                );
              })}
            </div>
          )}

          <div className="dashboard-stitch__grid">
            {sortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>

          {hasLoaded && !isLoading && sortedProducts.length === 0 && (
            <div className="dashboard-stitch__empty">
              <p>{t('dashboard.catalog.empty')}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
