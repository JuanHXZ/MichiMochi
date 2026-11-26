import { Category, CategoryFilterQuery } from '../entities/Category.js';

export interface ICategoryRepository {
  findAll(filters?: CategoryFilterQuery): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  findByName(name: string): Promise<Category | null>;
  create(category: Category): Promise<Category>;
  update(id: string, category: Category): Promise<Category>;
  delete(id: string): Promise<boolean>;
  seedIfEmpty?(categories: Category[]): Promise<number>;
  resetToInitial(): void;
}
