import { create } from 'zustand';
import { productService } from '../../infrastructure/services/productService';

export const useProductStore = create((set, get) => ({
  products: [],
  filteredProducts: [],
  selectedCategory: 'All',
  searchQuery: '',
  isLoading: false,
  hasLoaded: false,
  error: null,

  fetchProducts: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const data = await productService.getProducts(filters);
      set({ products: data, isLoading: false, hasLoaded: true });
      get().applyFilters();
      return data;
    } catch (err) {
      set({ error: err.message, isLoading: false, hasLoaded: true });
      return get().products;
    }
  },

  fetchProductById: async (id) => {
    try {
      const product = await productService.getProductById(id);
      if (product) {
        const { products } = get();
        const exists = products.some((p) => String(p.id) === String(product.id));
        const updated = exists
          ? products.map((p) => (String(p.id) === String(product.id) ? product : p))
          : [...products, product];
        set({ products: updated });
        get().applyFilters();
      }
      return product;
    } catch (err) {
      console.warn(`[productStore] Error fetching product ${id}:`, err);
      return get().getProductById(id);
    }
  },

  addProduct: async (productData) => {
    set({ isLoading: true, error: null });
    try {
      const created = await productService.createProduct(productData);
      const { products } = get();
      const baseProducts = created?.featured
        ? products.map((p) => (p.featured ? { ...p, featured: false } : p))
        : products;
      const updated = [created, ...baseProducts];
      set({ products: updated, isLoading: false });
      get().applyFilters();
      return created;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updateProduct: async (id, productData) => {
    set({ isLoading: true, error: null });
    try {
      const updatedProduct = await productService.updateProduct(id, productData);
      const { products } = get();
      const isNowFeatured = Boolean(updatedProduct?.featured);
      const updated = products.map((p) => {
        if (String(p.id) === String(id)) {
          return { ...p, ...updatedProduct };
        }
        return isNowFeatured && p.featured ? { ...p, featured: false } : p;
      });
      set({ products: updated, isLoading: false });
      get().applyFilters();
      return updatedProduct;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  deleteProduct: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await productService.deleteProduct(id);
      const { products } = get();
      const updated = products.filter((p) => String(p.id) !== String(id));
      set({ products: updated, isLoading: false });
      get().applyFilters();
      return true;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  setCategory: (category) => {
    set({ selectedCategory: category });
    get().applyFilters();
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().applyFilters();
  },

  applyFilters: () => {
    const { products, selectedCategory, searchQuery } = get();
    let filtered = products;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(
        (p) => p.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.longDescription?.toLowerCase().includes(query) ||
          p.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    set({ filteredProducts: filtered });
  },

  getFeaturedProduct: () => {
    const featuredItems = get().products.filter((p) => p.featured && p.inStock !== false);
    if (featuredItems.length <= 1) {
      return featuredItems[0];
    }
    return [...featuredItems].sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    })[0];
  },

  getProductById: (id) => {
    return get().products.find((p) => String(p.id) === String(id));
  },

  getProductsByCategory: (category) => {
    const { products } = get();
    if (category === 'All') return products;
    return products.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase()
    );
  },
}));
