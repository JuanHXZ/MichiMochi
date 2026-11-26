import type { Pool } from 'pg';
import { IProductRepository } from '../../domain/repositories/IProductRepository.js';
import { Product, ProductFilterQuery } from '../../domain/entities/Product.js';
import { AppError } from '../../../../shared/errors/AppError.js';

function mapRowToProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name ?? undefined,
    description: row.description,
    longDescription: row.long_description ?? undefined,
    price: Number(row.price),
    originalPrice: row.original_price !== null && row.original_price !== undefined ? Number(row.original_price) : undefined,
    discount: row.discount !== null && row.discount !== undefined ? Number(row.discount) : undefined,
    category: row.category,
    image: row.image ?? undefined,
    images: Array.isArray(row.images) ? row.images : undefined,
    featured: Boolean(row.featured),
    inStock: Boolean(row.in_stock),
    stock: row.stock !== null && row.stock !== undefined ? Number(row.stock) : 0,
    rating: row.rating !== null && row.rating !== undefined ? Number(row.rating) : undefined,
    reviewCount: row.review_count !== null && row.review_count !== undefined ? Number(row.review_count) : undefined,
    flavors: Array.isArray(row.flavors) ? row.flavors : undefined,
    ingredients: Array.isArray(row.ingredients) ? row.ingredients : undefined,
    allergens: Array.isArray(row.allergens) ? row.allergens : undefined,
    nutritionalInfo: row.nutritional_info ?? undefined,
    tags: Array.isArray(row.tags) ? row.tags : undefined,
    preparationTime: row.preparation_time ?? undefined,
    bestServedAt: row.best_served_at ?? undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at ? String(row.updated_at) : undefined,
  };
}

export class PostgresProductRepository implements IProductRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(filters?: ProductFilterQuery): Promise<Product[]> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.category && filters.category !== 'All') {
      params.push(filters.category.trim().toLowerCase());
      conditions.push(`LOWER(category) = $${params.length}`);
    }

    if (filters?.featured !== undefined) {
      params.push(filters.featured);
      conditions.push(`featured = $${params.length}`);
    }

    if (filters?.inStock !== undefined) {
      params.push(filters.inStock);
      conditions.push(`in_stock = $${params.length}`);
    }

    if (filters?.search && filters.search.trim()) {
      params.push(`%${filters.search.trim().toLowerCase()}%`);
      const idx = params.length;
      conditions.push(
        `(LOWER(name) LIKE $${idx} OR LOWER(description) LIKE $${idx} OR LOWER(COALESCE(long_description, '')) LIKE $${idx} OR LOWER(tags::text) LIKE $${idx})`
      );
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await this.pool.query(
      `SELECT * FROM products ${whereClause} ORDER BY created_at ASC`,
      params
    );
    return result.rows.map(mapRowToProduct);
  }

  async findById(id: string): Promise<Product | null> {
    const result = await this.pool.query('SELECT * FROM products WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0] ? mapRowToProduct(result.rows[0]) : null;
  }

  async findByName(name: string): Promise<Product | null> {
    const normalized = name.trim().toLowerCase();
    const result = await this.pool.query('SELECT * FROM products WHERE name_normalized = $1 LIMIT 1', [normalized]);
    return result.rows[0] ? mapRowToProduct(result.rows[0]) : null;
  }

  async create(product: Product): Promise<Product> {
    try {
      const result = await this.pool.query(
        `INSERT INTO products (
          id, name, name_normalized, short_name, description, long_description,
          price, original_price, discount, category, image, images,
          featured, in_stock, stock, rating, review_count,
          flavors, ingredients, allergens, nutritional_info, tags,
          preparation_time, best_served_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12::jsonb,
          $13, $14, $15, $16, $17,
          $18::jsonb, $19::jsonb, $20::jsonb, $21::jsonb, $22::jsonb,
          $23, $24, $25, $26
        ) RETURNING *`,
        [
          product.id,
          product.name,
          product.name.trim().toLowerCase(),
          product.shortName ?? null,
          product.description,
          product.longDescription ?? null,
          product.price,
          product.originalPrice ?? null,
          product.discount ?? 0,
          product.category,
          product.image ?? null,
          JSON.stringify(product.images ?? []),
          Boolean(product.featured),
          product.inStock ?? true,
          product.stock ?? 0,
          product.rating ?? 5.0,
          product.reviewCount ?? 0,
          JSON.stringify(product.flavors ?? []),
          JSON.stringify(product.ingredients ?? []),
          JSON.stringify(product.allergens ?? []),
          product.nutritionalInfo ? JSON.stringify(product.nutritionalInfo) : null,
          JSON.stringify(product.tags ?? []),
          product.preparationTime ?? null,
          product.bestServedAt ?? null,
          product.createdAt,
          product.updatedAt ?? product.createdAt,
        ]
      );
      return mapRowToProduct(result.rows[0]);
    } catch (err: any) {
      if (err?.code === '23505') {
        throw AppError.conflict(`Ya existe un producto con el nombre o ID proporcionado.`);
      }
      throw AppError.internal(`Error al persistir producto en PostgreSQL: ${err?.message || err}`);
    }
  }

  async update(id: string, product: Product): Promise<Product> {
    try {
      const result = await this.pool.query(
        `UPDATE products SET
          name = $2,
          name_normalized = $3,
          short_name = $4,
          description = $5,
          long_description = $6,
          price = $7,
          original_price = $8,
          discount = $9,
          category = $10,
          image = $11,
          images = $12::jsonb,
          featured = $13,
          in_stock = $14,
          stock = $15,
          rating = $16,
          review_count = $17,
          flavors = $18::jsonb,
          ingredients = $19::jsonb,
          allergens = $20::jsonb,
          nutritional_info = $21::jsonb,
          tags = $22::jsonb,
          preparation_time = $23,
          best_served_at = $24,
          updated_at = $25
        WHERE id = $1
        RETURNING *`,
        [
          id,
          product.name,
          product.name.trim().toLowerCase(),
          product.shortName ?? null,
          product.description,
          product.longDescription ?? null,
          product.price,
          product.originalPrice ?? null,
          product.discount ?? 0,
          product.category,
          product.image ?? null,
          JSON.stringify(product.images ?? []),
          Boolean(product.featured),
          product.inStock ?? true,
          product.stock ?? 0,
          product.rating ?? 5.0,
          product.reviewCount ?? 0,
          JSON.stringify(product.flavors ?? []),
          JSON.stringify(product.ingredients ?? []),
          JSON.stringify(product.allergens ?? []),
          product.nutritionalInfo ? JSON.stringify(product.nutritionalInfo) : null,
          JSON.stringify(product.tags ?? []),
          product.preparationTime ?? null,
          product.bestServedAt ?? null,
          product.updatedAt ?? new Date().toISOString(),
        ]
      );
      if (!result.rows[0]) {
        throw AppError.notFound(`Producto con ID '${id}' no encontrado en el catálogo.`);
      }
      return mapRowToProduct(result.rows[0]);
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      if (err?.code === '23505') {
        throw AppError.conflict(`Ya existe otro producto con el nombre '${product.name.trim()}'.`);
      }
      throw AppError.internal(`Error al actualizar producto en PostgreSQL: ${err?.message || err}`);
    }
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM products WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async clearFeatured(excludeId?: string): Promise<void> {
    if (excludeId) {
      await this.pool.query(
        'UPDATE products SET featured = FALSE WHERE featured = TRUE AND id <> $1',
        [excludeId]
      );
      return;
    }
    await this.pool.query('UPDATE products SET featured = FALSE WHERE featured = TRUE');
  }

  async seedIfEmpty(products: Product[]): Promise<number> {
    const countRes = await this.pool.query('SELECT COUNT(*)::int AS count FROM products');
    const count = Number(countRes.rows[0]?.count ?? 0);
    if (count > 0) {
      return 0;
    }

    const client = await this.pool.connect();
    let inserted = 0;
    try {
      await client.query('BEGIN');
      for (const product of products) {
        const res = await client.query(
          `INSERT INTO products (
            id, name, name_normalized, short_name, description, long_description,
            price, original_price, discount, category, image, images,
            featured, in_stock, stock, rating, review_count,
            flavors, ingredients, allergens, nutritional_info, tags,
            preparation_time, best_served_at, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11, $12::jsonb,
            $13, $14, $15, $16, $17,
            $18::jsonb, $19::jsonb, $20::jsonb, $21::jsonb, $22::jsonb,
            $23, $24, $25, $26
          ) ON CONFLICT (id) DO NOTHING`,
          [
            product.id,
            product.name,
            product.name.trim().toLowerCase(),
            product.shortName ?? null,
            product.description,
            product.longDescription ?? null,
            product.price,
            product.originalPrice ?? null,
            product.discount ?? 0,
            product.category,
            product.image ?? null,
            JSON.stringify(product.images ?? []),
            Boolean(product.featured),
            product.inStock ?? true,
            product.stock ?? 0,
            product.rating ?? 5.0,
            product.reviewCount ?? 0,
            JSON.stringify(product.flavors ?? []),
            JSON.stringify(product.ingredients ?? []),
            JSON.stringify(product.allergens ?? []),
            product.nutritionalInfo ? JSON.stringify(product.nutritionalInfo) : null,
            JSON.stringify(product.tags ?? []),
            product.preparationTime ?? null,
            product.bestServedAt ?? null,
            product.createdAt,
            product.updatedAt ?? product.createdAt,
          ]
        );
        inserted += res.rowCount ?? 0;
      }
      await client.query('COMMIT');
      return inserted;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  resetToInitial(): void {
    // No-op en PostgreSQL; usar MemoryProductRepository para pruebas unitarias en memoria.
  }
}
