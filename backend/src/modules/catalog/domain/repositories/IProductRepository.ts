import { Product, ProductFilterQuery } from '../entities/Product.js';

export interface IProductRepository {
  findAll(filters?: ProductFilterQuery): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  findByName(name: string): Promise<Product | null>;
  create(product: Product): Promise<Product>;
  update(id: string, product: Product): Promise<Product>;
  clearFeatured(excludeId?: string): Promise<void>;
  countByCategory?(categoryName: string): Promise<number>;
  renameCategory?(oldName: string, newName: string): Promise<number>;
  delete(id: string): Promise<boolean>;
  seedIfEmpty?(products: Product[]): Promise<number>;
  resetToInitial(): void;
}
