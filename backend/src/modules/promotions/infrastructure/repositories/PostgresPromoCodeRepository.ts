import type { Pool } from 'pg';
import { IPromoCodeRepository } from '../../domain/repositories/IPromoCodeRepository.js';
import { PromoCode } from '../../domain/entities/PromoCode.js';
import { AppError } from '../../../../shared/errors/AppError.js';

function mapRowToPromo(row: any): PromoCode {
  return {
    code: String(row.code),
    description: String(row.description),
    discountType: row.discount_type === 'FIXED' ? 'FIXED' : 'PERCENT',
    discountValue: Number(row.discount_value),
    minSubtotal: Number(row.min_subtotal ?? 0),
    maxDiscount: row.max_discount !== null && row.max_discount !== undefined ? Number(row.max_discount) : null,
    maxUses: row.max_uses !== null && row.max_uses !== undefined ? Number(row.max_uses) : null,
    currentUses: Number(row.current_uses ?? 0),
    userId: row.user_id ?? null,
    expiresAt: row.expires_at instanceof Date ? row.expires_at.toISOString() : row.expires_at ? String(row.expires_at) : null,
    active: Boolean(row.active),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  };
}

export class PostgresPromoCodeRepository implements IPromoCodeRepository {
  constructor(private readonly pool: Pool) {}

  async findByCode(code: string): Promise<PromoCode | null> {
    const normalized = code.trim().toUpperCase();
    const res = await this.pool.query('SELECT * FROM promo_codes WHERE code = $1 LIMIT 1', [normalized]);
    return res.rows[0] ? mapRowToPromo(res.rows[0]) : null;
  }

  async findAll(): Promise<PromoCode[]> {
    const res = await this.pool.query('SELECT * FROM promo_codes ORDER BY created_at DESC');
    return res.rows.map(mapRowToPromo);
  }

  async create(promo: PromoCode): Promise<PromoCode> {
    try {
      const res = await this.pool.query(
        `INSERT INTO promo_codes (
          code, description, discount_type, discount_value, min_subtotal,
          max_discount, max_uses, current_uses, user_id, expires_at, active, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          promo.code.trim().toUpperCase(),
          promo.description,
          promo.discountType,
          promo.discountValue,
          promo.minSubtotal,
          promo.maxDiscount ?? null,
          promo.maxUses ?? null,
          promo.currentUses ?? 0,
          promo.userId ?? null,
          promo.expiresAt ?? null,
          promo.active,
          promo.createdAt,
        ]
      );
      return mapRowToPromo(res.rows[0]);
    } catch (err: any) {
      if (err?.code === '23505') {
        throw AppError.conflict(`Ya existe un código promocional '${promo.code}'.`);
      }
      throw AppError.internal(`Error al crear código promocional en PostgreSQL: ${err?.message || err}`);
    }
  }

  async update(code: string, promo: PromoCode): Promise<PromoCode> {
    const normalized = code.trim().toUpperCase();
    const res = await this.pool.query(
      `UPDATE promo_codes SET
        description = $2,
        discount_type = $3,
        discount_value = $4,
        min_subtotal = $5,
        max_discount = $6,
        max_uses = $7,
        expires_at = $8,
        active = $9
      WHERE code = $1
      RETURNING *`,
      [
        normalized,
        promo.description,
        promo.discountType,
        promo.discountValue,
        promo.minSubtotal,
        promo.maxDiscount ?? null,
        promo.maxUses ?? null,
        promo.expiresAt ?? null,
        promo.active,
      ]
    );
    if (!res.rows[0]) {
      throw AppError.notFound(`Código promocional '${normalized}' no encontrado.`);
    }
    return mapRowToPromo(res.rows[0]);
  }

  async delete(code: string): Promise<boolean> {
    const normalized = code.trim().toUpperCase();
    const res = await this.pool.query('DELETE FROM promo_codes WHERE code = $1', [normalized]);
    return (res.rowCount ?? 0) > 0;
  }

  async incrementUses(code: string): Promise<PromoCode | null> {
    const normalized = code.trim().toUpperCase();
    const res = await this.pool.query(
      `UPDATE promo_codes
       SET current_uses = current_uses + 1,
           active = CASE
             WHEN max_uses IS NOT NULL AND current_uses + 1 >= max_uses THEN FALSE
             ELSE active
           END
       WHERE code = $1
       RETURNING *`,
      [normalized]
    );
    return res.rows[0] ? mapRowToPromo(res.rows[0]) : null;
  }

  async seedIfEmpty(promos: PromoCode[]): Promise<number> {
    const countRes = await this.pool.query('SELECT COUNT(*)::int AS count FROM promo_codes');
    if (Number(countRes.rows[0]?.count ?? 0) > 0) {
      return 0;
    }

    let inserted = 0;
    for (const promo of promos) {
      const res = await this.pool.query(
        `INSERT INTO promo_codes (
          code, description, discount_type, discount_value, min_subtotal,
          max_discount, max_uses, current_uses, user_id, expires_at, active, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (code) DO NOTHING`,
        [
          promo.code,
          promo.description,
          promo.discountType,
          promo.discountValue,
          promo.minSubtotal,
          promo.maxDiscount ?? null,
          promo.maxUses ?? null,
          promo.currentUses,
          promo.userId ?? null,
          promo.expiresAt ?? null,
          promo.active,
          promo.createdAt,
        ]
      );
      inserted += res.rowCount ?? 0;
    }
    return inserted;
  }
}
