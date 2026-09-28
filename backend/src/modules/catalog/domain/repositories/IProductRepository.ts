import { Product, ProductFilterQuery } from '../entities/Product.js';

export interface IProductRepository {
  findAll(filters?: ProductFilterQuery): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  findByName(name: string): Promise<Product | null>;
  create(product: Product): Promise<Product>;
  update(id: string, product: Product): Promise<Product>;
  delete(id: string): Promise<boolean>;
  resetToInitial(): void;
}
