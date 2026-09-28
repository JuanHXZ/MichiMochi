import productsData from '@/shared/data/products.json';

/**
 * Servicio de infraestructura para catálogo de productos
 */
export const productService = {
  async getProducts() {
    return productsData.products || [];
  },

  async getProductById(id) {
    const products = productsData.products || [];
    return products.find((p) => String(p.id) === String(id)) || null;
  },
};
