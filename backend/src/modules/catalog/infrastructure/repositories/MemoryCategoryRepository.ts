import { ICategoryRepository } from '../../domain/repositories/ICategoryRepository.js';
import { Category, CategoryFilterQuery } from '../../domain/entities/Category.js';
import { INITIAL_CATEGORIES } from './initialCategories.js';

export class MemoryCategoryRepository implements ICategoryRepository {
  private categoriesStore = new Map<string, Category>(
    INITIAL_CATEGORIES.map((c) => [c.id, { ...c }])
  );

  async findAll(filters?: CategoryFilterQuery): Promise<Category[]> {
    let categories = Array.from(this.categoriesStore.values());

    if (filters?.visible !== undefined) {
      categories = categories.filter((c) => Boolean(c.visible) === filters.visible);
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      categories = categories.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q))
      );
    }

    return categories.sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
      return a.createdAt.localeCompare(b.createdAt);
    });
  }

  async findById(id: string): Promise<Category | null> {
    return this.categoriesStore.get(id) || null;
  }

  async findByName(name: string): Promise<Category | null> {
    const normalized = name.trim().toLowerCase();
    for (const c of this.categoriesStore.values()) {
      if (c.name.trim().toLowerCase() === normalized) {
        return c;
      }
    }
    return null;
  }

  async create(category: Category): Promise<Category> {
    this.categoriesStore.set(category.id, category);
    return category;
  }

  async update(id: string, category: Category): Promise<Category> {
    this.categoriesStore.set(id, category);
    return category;
  }

  async delete(id: string): Promise<boolean> {
    return this.categoriesStore.delete(id);
  }

  async seedIfEmpty(categories: Category[]): Promise<number> {
    if (this.categoriesStore.size > 0) return 0;
    for (const c of categories) {
      this.categoriesStore.set(c.id, { ...c });
    }
    return categories.length;
  }

  resetToInitial(): void {
    this.categoriesStore.clear();
    for (const c of INITIAL_CATEGORIES) {
      this.categoriesStore.set(c.id, { ...c });
    }
  }
}
