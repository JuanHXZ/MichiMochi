import crypto from 'node:crypto';
import type { Pool } from 'pg';
import { IOtpRepository, OtpRecord } from '../../domain/repositories/IOtpRepository.js';

export class PostgresOtpRepository implements IOtpRepository {
  constructor(private readonly pool: Pool) {}

  private hashEmail(email: string): string {
    return crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
  }

  async findByEmail(email: string): Promise<OtpRecord | null> {
    const emailHash = this.hashEmail(email);
    const result = await this.pool.query(
      'SELECT code_hash, expires_at, created_at, attempts FROM password_otps WHERE email_hash = $1 LIMIT 1',
      [emailHash]
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      codeHash: row.code_hash,
      expiresAt: new Date(row.expires_at).getTime(),
      createdAt: new Date(row.created_at).getTime(),
      attempts: Number(row.attempts),
    };
  }

  async save(email: string, record: OtpRecord): Promise<void> {
    const emailHash = this.hashEmail(email);
    await this.pool.query(
      `INSERT INTO password_otps (email_hash, code_hash, expires_at, created_at, attempts)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email_hash) DO UPDATE SET
         code_hash = EXCLUDED.code_hash,
         expires_at = EXCLUDED.expires_at,
         created_at = EXCLUDED.created_at,
         attempts = EXCLUDED.attempts`,
      [
        emailHash,
        record.codeHash,
        new Date(record.expiresAt).toISOString(),
        new Date(record.createdAt).toISOString(),
        record.attempts,
      ]
    );
  }

  async incrementAttempts(email: string): Promise<number> {
    const emailHash = this.hashEmail(email);
    const result = await this.pool.query(
      'UPDATE password_otps SET attempts = attempts + 1 WHERE email_hash = $1 RETURNING attempts',
      [emailHash]
    );
    return Number(result.rows[0]?.attempts ?? 0);
  }

  async delete(email: string): Promise<void> {
    const emailHash = this.hashEmail(email);
    await this.pool.query('DELETE FROM password_otps WHERE email_hash = $1', [emailHash]);
  }

  async isResetTokenUsed(jti: string): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT 1 FROM used_reset_tokens WHERE jti = $1 LIMIT 1',
      [jti]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async markResetTokenUsed(jti: string, expiresAt: number): Promise<void> {
    await this.pool.query(
      `INSERT INTO used_reset_tokens (jti, expires_at)
       VALUES ($1, $2)
       ON CONFLICT (jti) DO NOTHING`,
      [jti, new Date(expiresAt).toISOString()]
    );
  }
}
