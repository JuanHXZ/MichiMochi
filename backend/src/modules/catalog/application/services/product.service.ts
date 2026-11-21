import { productRepository } from '../../infrastructure/repositories/MemoryProductRepository.js';
import { Product, ProductFilterQuery } from '../../domain/entities/Product.js';
import { AppError } from '../../../../shared/errors/AppError.js';
import { CreateProductDTO, UpdateProductDTO } from '../dtos/product.dto.js';

export class ProductService {
  /**
   * Obtiene todos los productos con filtros opcionales (categoría, búsqueda, featured, inStock)
   */
  static async getAll(filters?: ProductFilterQuery): Promise<Product[]> {
    return productRepository.findAll(filters);
  }

  /**
   * Obtiene un producto por su ID
   * @throws 404 si el producto no existe
   */
  static async getById(id: string): Promise<Product> {
    const product = await productRepository.findById(id);
    if (!product) {
      throw AppError.notFound(`Producto con ID '${id}' no encontrado en el catálogo.`);
    }
    return product;
  }

  /**
   * Agrega un nuevo producto al catálogo
   */
  static async create(data: CreateProductDTO): Promise<Product> {
    const id = data.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const existingById = await productRepository.findById(id);
    if (existingById) {
      throw AppError.conflict(`Ya existe un producto con el ID '${id}'.`);
    }

    // Validar duplicidad por nombre (case-insensitive y trim)
    const existingByName = await productRepository.findByName(data.name);
    if (existingByName) {
      throw AppError.conflict(`Ya existe un producto con el nombre '${data.name.trim()}'.`);
    }

    const now = new Date().toISOString();
    const newProduct: Product = {
      ...data,
      name: data.name.trim(),
      id,
      inStock: data.inStock !== undefined ? data.inStock : true,
      stock: data.stock !== undefined ? data.stock : 10,
      rating: data.rating ?? 5.0,
      reviewCount: data.reviewCount ?? 0,
      createdAt: now,
      updatedAt: now,
    };

    return productRepository.create(newProduct);
  }

  /**
   * Actualiza un producto existente por su ID
   * @throws 404 si el producto no existe
   */
  static async update(id: string, data: UpdateProductDTO): Promise<Product> {
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw AppError.notFound(`Producto con ID '${id}' no encontrado en el catálogo.`);
    }

    // Validar duplicidad si se actualiza el nombre
    if (data.name && data.name.trim()) {
      const existingByName = await productRepository.findByName(data.name);
      if (existingByName && existingByName.id !== id) {
        throw AppError.conflict(`Ya existe otro producto con el nombre '${data.name.trim()}'.`);
      }
    }

    const updatedProduct: Product = {
      ...existing,
      ...data,
      ...(data.name && { name: data.name.trim() }),
      id: existing.id, // ID inmutable
      createdAt: existing.createdAt, // createdAt inmutable
      updatedAt: new Date().toISOString(),
    };

    return productRepository.update(id, updatedProduct);
  }

  /**
   * Elimina un producto por su ID
   * @throws 404 si el producto no existe
   */
  static async delete(id: string): Promise<{ id: string; name: string }> {
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw AppError.notFound(`Producto con ID '${id}' no encontrado en el catálogo.`);
    }

    await productRepository.delete(id);
    return { id, name: existing.name };
  }

  /**
   * Reinicia el catálogo a su estado base (útil para pruebas unitarias)
   */
  static resetToInitial(): void {
    productRepository.resetToInitial();
  }
}
