import { Pool } from 'pg';
import { ENV } from '../config/env.js';

let pool: Pool | null = null;

export function getPgPool(): Pool {
  if (!pool) {
    if (!ENV.DATABASE_URL) {
      throw new Error('DATABASE_URL no está configurado.');
    }
    pool = new Pool({
      connectionString: ENV.DATABASE_URL,
      ssl: ENV.DATABASE_SSL ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }
  return pool;
}

export async function closePgPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
