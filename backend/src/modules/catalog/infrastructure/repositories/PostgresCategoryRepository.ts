import type { Pool } from 'pg';
import { ICategoryRepository } from '../../domain/repositories/ICategoryRepository.js';
import { Category, CategoryFilterQuery } from '../../domain/entities/Category.js';
import { AppError } from '../../../../shared/errors/AppError.js';

function mapRowToCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    icon: row.icon ?? '🍡',
    visible: Boolean(row.visible),
    displayOrder: row.display_order !== null && row.display_order !== undefined ? Number(row.display_order) : 0,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at ? String(row.updated_at) : undefined,
  };
}

export class PostgresCategoryRepository implements ICategoryRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(filters?: CategoryFilterQuery): Promise<Category[]> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.visible !== undefined) {
      params.push(filters.visible);
      conditions.push(`visible = $${params.length}`);
    }

    if (filters?.search && filters.search.trim()) {
      params.push(`%${filters.search.trim().toLowerCase()}%`);
      const idx = params.length;
      conditions.push(`(LOWER(name) LIKE $${idx} OR LOWER(COALESCE(description, '')) LIKE $${idx})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await this.pool.query(
      `SELECT * FROM categories ${whereClause} ORDER BY display_order ASC, created_at ASC`,
      params
    );
    return result.rows.map(mapRowToCategory);
  }

  async findById(id: string): Promise<Category | null> {
    const result = await this.pool.query('SELECT * FROM categories WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0] ? mapRowToCategory(result.rows[0]) : null;
  }

  async findByName(name: string): Promise<Category | null> {
    const normalized = name.trim().toLowerCase();
    const result = await this.pool.query('SELECT * FROM categories WHERE name_normalized = $1 LIMIT 1', [normalized]);
    return result.rows[0] ? mapRowToCategory(result.rows[0]) : null;
  }

  async create(category: Category): Promise<Category> {
    try {
      const result = await this.pool.query(
        `INSERT INTO categories (
          id, name, name_normalized, description, icon, visible, display_order, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          category.id,
          category.name,
          category.name.trim().toLowerCase(),
          category.description ?? '',
          category.icon ?? '🍡',
          Boolean(category.visible),
          category.displayOrder ?? 0,
          category.createdAt,
          category.updatedAt ?? category.createdAt,
        ]
      );
      return mapRowToCategory(result.rows[0]);
    } catch (err: any) {
      if (err?.code === '23505') {
        throw AppError.conflict(`Ya existe una categoría con el nombre '${category.name.trim()}'.`);
      }
      throw AppError.internal(`Error al persistir categoría en PostgreSQL: ${err?.message || err}`);
    }
  }

  async update(id: string, category: Category): Promise<Category> {
    try {
      const result = await this.pool.query(
        `UPDATE categories SET
          name = $2,
          name_normalized = $3,
          description = $4,
          icon = $5,
          visible = $6,
          display_order = $7,
          updated_at = $8
        WHERE id = $1
        RETURNING *`,
        [
          id,
          category.name,
          category.name.trim().toLowerCase(),
          category.description ?? '',
          category.icon ?? '🍡',
          Boolean(category.visible),
          category.displayOrder ?? 0,
          category.updatedAt ?? new Date().toISOString(),
        ]
      );
      if (!result.rows[0]) {
        throw AppError.notFound(`Categoría con ID '${id}' no encontrada.`);
      }
      return mapRowToCategory(result.rows[0]);
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      if (err?.code === '23505') {
        throw AppError.conflict(`Ya existe otra categoría con el nombre '${category.name.trim()}'.`);
      }
      throw AppError.internal(`Error al actualizar categoría en PostgreSQL: ${err?.message || err}`);
    }
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM categories WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async seedIfEmpty(categories: Category[]): Promise<number> {
    const countRes = await this.pool.query('SELECT COUNT(*)::int AS count FROM categories');
    const count = Number(countRes.rows[0]?.count ?? 0);
    if (count > 0) return 0;

    const client = await this.pool.connect();
    let inserted = 0;
    try {
      await client.query('BEGIN');
      for (const category of categories) {
        const res = await client.query(
          `INSERT INTO categories (
            id, name, name_normalized, description, icon, visible, display_order, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO NOTHING`,
          [
            category.id,
            category.name,
            category.name.trim().toLowerCase(),
            category.description ?? '',
            category.icon ?? '🍡',
            Boolean(category.visible),
            category.displayOrder ?? 0,
            category.createdAt,
            category.updatedAt ?? category.createdAt,
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
    // No-op en PostgreSQL; usar MemoryCategoryRepository para pruebas unitarias en memoria.
  }
}
