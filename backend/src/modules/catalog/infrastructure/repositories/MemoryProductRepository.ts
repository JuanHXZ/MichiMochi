import { IProductRepository } from '../../domain/repositories/IProductRepository.js';
import { Product, ProductFilterQuery } from '../../domain/entities/Product.js';
import { INITIAL_PRODUCTS } from './initialProducts.js';

export class MemoryProductRepository implements IProductRepository {
  private productsStore = new Map<string, Product>(INITIAL_PRODUCTS.map((p) => [p.id, { ...p }]));

  async findAll(filters?: ProductFilterQuery): Promise<Product[]> {
    let products = Array.from(this.productsStore.values());

    if (filters?.category && filters.category !== 'All') {
      const cat = filters.category.toLowerCase();
      products = products.filter((p) => p.category.toLowerCase() === cat);
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.longDescription?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (filters?.featured !== undefined) {
      products = products.filter((p) => Boolean(p.featured) === filters.featured);
    }

    if (filters?.inStock !== undefined) {
      products = products.filter((p) => Boolean(p.inStock) === filters.inStock);
    }

    return products;
  }

  async findById(id: string): Promise<Product | null> {
    return this.productsStore.get(id) || null;
  }

  async findByName(name: string): Promise<Product | null> {
    const normalized = name.trim().toLowerCase();
    for (const p of this.productsStore.values()) {
      if (p.name.trim().toLowerCase() === normalized) {
        return p;
      }
    }
    return null;
  }

  async create(product: Product): Promise<Product> {
    this.productsStore.set(product.id, product);
    return product;
  }

  async update(id: string, product: Product): Promise<Product> {
    this.productsStore.set(id, product);
    return product;
  }

  async clearFeatured(excludeId?: string): Promise<void> {
    for (const [id, product] of this.productsStore.entries()) {
      if (id !== excludeId && product.featured) {
        this.productsStore.set(id, { ...product, featured: false });
      }
    }
  }

  async countByCategory(categoryName: string): Promise<number> {
    const normalized = categoryName.trim().toLowerCase();
    let count = 0;
    for (const product of this.productsStore.values()) {
      if (product.category.trim().toLowerCase() === normalized) {
        count += 1;
      }
    }
    return count;
  }

  async renameCategory(oldName: string, newName: string): Promise<number> {
    const normalizedOld = oldName.trim().toLowerCase();
    let updated = 0;
    for (const [id, product] of this.productsStore.entries()) {
      if (product.category.trim().toLowerCase() === normalizedOld) {
        this.productsStore.set(id, { ...product, category: newName, updatedAt: new Date().toISOString() });
        updated += 1;
      }
    }
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.productsStore.delete(id);
  }

  async seedIfEmpty(products: Product[]): Promise<number> {
    if (this.productsStore.size > 0) return 0;
    for (const p of products) {
      this.productsStore.set(p.id, { ...p });
    }
    return products.length;
  }

  resetToInitial(): void {
    this.productsStore.clear();
    for (const p of INITIAL_PRODUCTS) {
      this.productsStore.set(p.id, { ...p });
    }
  }
}
