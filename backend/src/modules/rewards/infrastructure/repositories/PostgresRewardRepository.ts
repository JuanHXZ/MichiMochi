import crypto from 'node:crypto';
import type { Pool } from 'pg';
import { IRewardRepository } from '../../domain/repositories/IRewardRepository.js';
import { RewardBalance, RewardTransaction } from '../../domain/entities/Reward.js';
import { AppError } from '../../../../shared/errors/AppError.js';

function mapBalance(userId: string, row?: any): RewardBalance {
  if (!row) {
    return {
      userId,
      points: 0,
      lifetimePoints: 0,
      updatedAt: new Date().toISOString(),
    };
  }
  return {
    userId: String(row.user_id),
    points: Number(row.points ?? 0),
    lifetimePoints: Number(row.lifetime_points ?? 0),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

function mapTransaction(row: any): RewardTransaction {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    type: row.type,
    points: Number(row.points),
    orderId: row.order_id ?? null,
    description: String(row.description),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  };
}

export class PostgresRewardRepository implements IRewardRepository {
  constructor(private readonly pool: Pool) {}

  async getBalance(userId: string): Promise<RewardBalance> {
    const res = await this.pool.query('SELECT * FROM user_rewards WHERE user_id = $1 LIMIT 1', [userId]);
    return mapBalance(userId, res.rows[0]);
  }

  async getTransactions(userId: string): Promise<RewardTransaction[]> {
    const res = await this.pool.query(
      'SELECT * FROM reward_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    return res.rows.map(mapTransaction);
  }

  async addPoints(
    userId: string,
    points: number,
    tx: Omit<RewardTransaction, 'id' | 'userId' | 'createdAt'>
  ): Promise<RewardBalance> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const balanceRes = await client.query(
        `INSERT INTO user_rewards (user_id, points, lifetime_points, updated_at)
         VALUES ($1, $2, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE SET
           points = user_rewards.points + $2,
           lifetime_points = user_rewards.lifetime_points + $2,
           updated_at = NOW()
         RETURNING *`,
        [userId, points]
      );

      await client.query(
        `INSERT INTO reward_transactions (id, user_id, type, points, order_id, description)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [`rtx_${crypto.randomUUID()}`, userId, tx.type, tx.points, tx.orderId ?? null, tx.description]
      );

      await client.query('COMMIT');
      return mapBalance(userId, balanceRes.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async deductPoints(
    userId: string,
    pointsCost: number,
    tx: Omit<RewardTransaction, 'id' | 'userId' | 'createdAt'>
  ): Promise<RewardBalance> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const curRes = await client.query(
        'SELECT points FROM user_rewards WHERE user_id = $1 FOR UPDATE',
        [userId]
      );
      const currentPoints = Number(curRes.rows[0]?.points ?? 0);
      if (currentPoints < pointsCost) {
        throw AppError.badRequest(
          `Puntos insuficientes. Tienes ${currentPoints} pts y necesitas ${pointsCost} pts.`
        );
      }

      const balanceRes = await client.query(
        `UPDATE user_rewards
         SET points = points - $2, updated_at = NOW()
         WHERE user_id = $1
         RETURNING *`,
        [userId, pointsCost]
      );

      await client.query(
        `INSERT INTO reward_transactions (id, user_id, type, points, order_id, description)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [`rtx_${crypto.randomUUID()}`, userId, tx.type, tx.points, tx.orderId ?? null, tx.description]
      );

      await client.query('COMMIT');
      return mapBalance(userId, balanceRes.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
