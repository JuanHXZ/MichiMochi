import { categoryRepository } from '../../infrastructure/repositories/categoryRepository.factory.js';
import { productRepository } from '../../infrastructure/repositories/productRepository.factory.js';
import { Category, CategoryFilterQuery } from '../../domain/entities/Category.js';
import { AppError } from '../../../../shared/errors/AppError.js';
import { CreateCategoryDTO, UpdateCategoryDTO } from '../dtos/category.dto.js';

export class CategoryService {
  static async getAll(filters?: CategoryFilterQuery): Promise<Category[]> {
    return categoryRepository.findAll(filters);
  }

  static async getById(id: string): Promise<Category> {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw AppError.notFound(`Categoría con ID '${id}' no encontrada.`);
    }
    return category;
  }

  static async create(data: CreateCategoryDTO): Promise<Category> {
    const trimmedName = data.name.trim();
    const id = data.id || `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const existingById = await categoryRepository.findById(id);
    if (existingById) {
      throw AppError.conflict(`Ya existe una categoría con el ID '${id}'.`);
    }

    const existingByName = await categoryRepository.findByName(trimmedName);
    if (existingByName) {
      throw AppError.conflict(`Ya existe una categoría con el nombre '${trimmedName}'.`);
    }

    const all = await categoryRepository.findAll();
    const nextOrder =
      data.displayOrder !== undefined
        ? data.displayOrder
        : all.reduce((max, item) => Math.max(max, item.displayOrder || 0), 0) + 1;

    const now = new Date().toISOString();
    const newCategory: Category = {
      id,
      name: trimmedName,
      description: data.description?.trim() ?? '',
      icon: data.icon?.trim() || '🍡',
      visible: data.visible !== undefined ? Boolean(data.visible) : true,
      displayOrder: nextOrder,
      createdAt: now,
      updatedAt: now,
    };

    return categoryRepository.create(newCategory);
  }

  static async update(id: string, data: UpdateCategoryDTO): Promise<Category> {
    const existing = await categoryRepository.findById(id);
    if (!existing) {
      throw AppError.notFound(`Categoría con ID '${id}' no encontrada.`);
    }

    const nextName = data.name !== undefined ? data.name.trim() : existing.name;
    if (data.name !== undefined) {
      const existingByName = await categoryRepository.findByName(nextName);
      if (existingByName && existingByName.id !== id) {
        throw AppError.conflict(`Ya existe otra categoría con el nombre '${nextName}'.`);
      }
    }

    const updatedCategory: Category = {
      ...existing,
      ...(data.description !== undefined && { description: data.description.trim() }),
      ...(data.icon !== undefined && { icon: data.icon.trim() || '🍡' }),
      ...(data.visible !== undefined && { visible: Boolean(data.visible) }),
      ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
      name: nextName,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    const saved = await categoryRepository.update(id, updatedCategory);

    if (existing.name.trim().toLowerCase() !== saved.name.trim().toLowerCase() || existing.name !== saved.name) {
      await productRepository.renameCategory?.(existing.name, saved.name);
    }

    return saved;
  }

  static async delete(id: string): Promise<{ id: string; name: string }> {
    const existing = await categoryRepository.findById(id);
    if (!existing) {
      throw AppError.notFound(`Categoría con ID '${id}' no encontrada.`);
    }

    const productCount = (await productRepository.countByCategory?.(existing.name)) ?? 0;
    if (productCount > 0) {
      throw AppError.conflict(
        `No se puede eliminar la categoría '${existing.name}' porque tiene ${productCount} producto(s) asociado(s). Ocúltala o reasigna esos productos primero.`
      );
    }

    await categoryRepository.delete(id);
    return { id, name: existing.name };
  }

  static resetToInitial(): void {
    categoryRepository.resetToInitial();
  }
}
