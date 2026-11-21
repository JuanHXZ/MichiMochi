import type { Pool } from 'pg';
import { IUserRepository } from '../../domain/repositories/IUserRepository.js';
import { UserProfile, UserRole } from '../../domain/entities/User.js';
import { AppError } from '../../../../shared/errors/AppError.js';

function mapRowToUser(row: any): UserProfile {
  return {
    uid: row.uid,
    email: row.email,
    fullName: row.full_name,
    role: row.role === 'admin' ? 'admin' : 'customer',
    phone: row.phone || '',
    address: row.address || '',
    city: row.city || '',
    photoURL: row.photo_url ?? null,
    provider: row.provider === 'google' ? 'google' : 'password',
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at ? String(row.updated_at) : undefined,
  };
}

export class PostgresUserRepository implements IUserRepository {
  constructor(private readonly pool: Pool) {}

  async findById(uid: string): Promise<UserProfile | null> {
    const result = await this.pool.query('SELECT * FROM users WHERE uid = $1 LIMIT 1', [uid]);
    return result.rows[0] ? mapRowToUser(result.rows[0]) : null;
  }

  async findByEmail(email: string): Promise<UserProfile | null> {
    const normalized = email.trim().toLowerCase();
    const result = await this.pool.query('SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1', [normalized]);
    return result.rows[0] ? mapRowToUser(result.rows[0]) : null;
  }

  async save(user: UserProfile): Promise<UserProfile> {
    try {
      const now = user.updatedAt ?? new Date().toISOString();
      const result = await this.pool.query(
        `INSERT INTO users (
          uid, email, full_name, role, phone, address, city, photo_url, provider, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (uid) DO UPDATE SET
          email = EXCLUDED.email,
          full_name = EXCLUDED.full_name,
          role = EXCLUDED.role,
          phone = EXCLUDED.phone,
          address = EXCLUDED.address,
          city = EXCLUDED.city,
          photo_url = EXCLUDED.photo_url,
          provider = EXCLUDED.provider,
          updated_at = EXCLUDED.updated_at
        RETURNING *`,
        [
          user.uid,
          user.email.trim().toLowerCase(),
          user.fullName,
          user.role,
          user.phone || '',
          user.address || '',
          user.city || '',
          user.photoURL ?? null,
          user.provider,
          user.createdAt,
          now,
        ]
      );
      return mapRowToUser(result.rows[0]);
    } catch (err: any) {
      throw AppError.internal(`Error al persistir usuario en PostgreSQL: ${err?.message || err}`);
    }
  }

  async updateRole(uid: string, role: UserRole): Promise<UserProfile | null> {
    const result = await this.pool.query(
      'UPDATE users SET role = $2, updated_at = NOW() WHERE uid = $1 RETURNING *',
      [uid, role]
    );
    return result.rows[0] ? mapRowToUser(result.rows[0]) : null;
  }

  async delete(uid: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM users WHERE uid = $1', [uid]);
    return (result.rowCount ?? 0) > 0;
  }
}
