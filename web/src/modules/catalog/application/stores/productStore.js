import { create } from 'zustand';
import productsData from '@/shared/data/products.json';
import { productService } from '../../infrastructure/services/productService';

const PRODUCTS_DATA = productsData.products;

export const useProductStore = create((set, get) => ({
  products: PRODUCTS_DATA,
  filteredProducts: PRODUCTS_DATA,
  selectedCategory: 'All',
  searchQuery: '',
  isLoading: false,
  error: null,

  fetchProducts: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const data = await productService.getProducts(filters);
      set({ products: data, isLoading: false });
      get().applyFilters();
      return data;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return get().products;
    }
  },

  fetchProductById: async (id) => {
    try {
      const product = await productService.getProductById(id);
      if (product) {
        const { products } = get();
        const exists = products.some((p) => String(p.id) === String(product.id));
        if (!exists) {
          const updated = [...products, product];
          set({ products: updated });
          get().applyFilters();
        }
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
      const updated = [created, ...products];
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
      const updated = products.map((p) =>
        String(p.id) === String(id) ? { ...p, ...updatedProduct } : p
      );
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
    return get().products.find((p) => p.featured);
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
