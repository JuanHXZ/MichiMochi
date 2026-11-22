import type { Pool } from 'pg';
import { IFavoriteRepository } from '../../domain/repositories/IFavoriteRepository.js';

export class PostgresFavoriteRepository implements IFavoriteRepository {
  constructor(private readonly pool: Pool) {}

  async findProductIdsByUser(userId: string): Promise<string[]> {
    const res = await this.pool.query(
      'SELECT product_id FROM user_favorites WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return res.rows.map((row) => String(row.product_id));
  }

  async add(userId: string, productId: string): Promise<string[]> {
    await this.pool.query(
      `INSERT INTO user_favorites (user_id, product_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, product_id) DO NOTHING`,
      [userId, productId]
    );
    return this.findProductIdsByUser(userId);
  }

  async remove(userId: string, productId: string): Promise<string[]> {
    await this.pool.query(
      'DELETE FROM user_favorites WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );
    return this.findProductIdsByUser(userId);
  }
}
