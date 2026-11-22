import { apiClient } from '@/shared/services/apiClient';
import productsData from '@/shared/data/products.json';

/**
 * Servicio de infraestructura para catálogo de productos
 * Consume la API real en /api/products con fallback a datos locales.
 */
export const productService = {
  async getProducts(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters?.category && filters.category !== 'All') {
        params.append('category', filters.category);
      }
      if (filters?.search && filters.search.trim()) {
        params.append('search', filters.search.trim());
      }
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const response = await apiClient(`/products${queryStr}`, { requiresAuth: false });
      if (response?.ok && Array.isArray(response.data)) {
        return response.data;
      }
      return productsData.products || [];
    } catch (err) {
      console.warn('[productService] Fallo al consultar API /products, usando fallback local:', err.message);
      return productsData.products || [];
    }
  },

  async getProductById(id) {
    try {
      const response = await apiClient(`/products/${id}`, { requiresAuth: false });
      if (response?.ok && response.data) {
        return response.data;
      }
      const products = productsData.products || [];
      return products.find((p) => String(p.id) === String(id)) || null;
    } catch (err) {
      console.warn(`[productService] Fallo al consultar API /products/${id}, usando fallback local:`, err.message);
      const products = productsData.products || [];
      return products.find((p) => String(p.id) === String(id)) || null;
    }
  },

  async createProduct(productData) {
    const response = await apiClient('/products', {
      method: 'POST',
      body: productData,
      requiresAuth: true,
    });
    return response.data;
  },

  async updateProduct(id, productData) {
    const response = await apiClient(`/products/${id}`, {
      method: 'PUT',
      body: productData,
      requiresAuth: true,
    });
    return response.data;
  },

  async deleteProduct(id) {
    const response = await apiClient(`/products/${id}`, {
      method: 'DELETE',
      requiresAuth: true,
    });
    return response.ok;
  },

  async uploadProductImages(files) {
    const formData = new FormData();
    for (const file of files) {
      formData.append('images', file);
    }
    const response = await apiClient('/products/upload-images', {
      method: 'POST',
      body: formData,
      requiresAuth: true,
    });
    return response.data?.urls || [];
  },
};
