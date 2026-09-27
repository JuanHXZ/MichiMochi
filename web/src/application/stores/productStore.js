import { create } from 'zustand';
import productsData from '@/shared/data/products.json';

const PRODUCTS_DATA = productsData.products;

export const useProductStore = create((set, get) => ({
  products: PRODUCTS_DATA,
  filteredProducts: PRODUCTS_DATA,
  selectedCategory: 'All',
  searchQuery: '',

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
