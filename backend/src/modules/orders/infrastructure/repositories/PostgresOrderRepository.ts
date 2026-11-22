import type { Pool } from 'pg';
import { IOrderRepository } from '../../domain/repositories/IOrderRepository.js';
import { Order, OrderFilterQuery } from '../../domain/entities/Order.js';
import { AppError } from '../../../../shared/errors/AppError.js';

function mapRowToOrder(row: any): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    items: Array.isArray(row.items) ? row.items : [],
    shippingAddress: row.shipping_address,
    payment: row.payment,
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    tax: Number(row.tax),
    savings: Number(row.savings ?? 0),
    ...(row.promo_code ? { promoCode: String(row.promo_code) } : {}),
    discountAmount: Number(row.discount_amount ?? 0),
    total: Number(row.total),
    currency: row.currency === 'COP' ? 'COP' : 'USD',
    status: row.status,
    statusHistory: Array.isArray(row.status_history) ? row.status_history : [],
    estimatedDelivery: row.estimated_delivery ?? '25-35 min',
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

export class PostgresOrderRepository implements IOrderRepository {
  constructor(private readonly pool: Pool) {}

  async create(order: Order): Promise<Order> {
    try {
      const result = await this.pool.query(
        `INSERT INTO orders (
          id, order_number, user_id, customer_name, customer_email,
          items, shipping_address, payment,
          subtotal, shipping, tax, savings, promo_code, discount_amount, total, currency,
          status, status_history, estimated_delivery, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6::jsonb, $7::jsonb, $8::jsonb,
          $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18::jsonb, $19, $20, $21
        ) RETURNING *`,
        [
          order.id,
          order.orderNumber,
          order.userId,
          order.customerName,
          order.customerEmail,
          JSON.stringify(order.items),
          JSON.stringify(order.shippingAddress),
          JSON.stringify(order.payment),
          order.subtotal,
          order.shipping,
          order.tax,
          order.savings,
          order.promoCode ?? null,
          order.discountAmount ?? 0,
          order.total,
          order.currency,
          order.status,
          JSON.stringify(order.statusHistory),
          order.estimatedDelivery,
          order.createdAt,
          order.updatedAt,
        ]
      );
      return mapRowToOrder(result.rows[0]);
    } catch (err: any) {
      if (err?.code === '23505') {
        throw AppError.conflict('Ya existe un pedido con ese identificador o número de orden.');
      }
      throw AppError.internal(`Error al persistir pedido en PostgreSQL: ${err?.message || err}`);
    }
  }

  async findById(id: string): Promise<Order | null> {
    const result = await this.pool.query('SELECT * FROM orders WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0] ? mapRowToOrder(result.rows[0]) : null;
  }

  async findByUserId(userId: string, filters?: OrderFilterQuery): Promise<Order[]> {
    const conditions: string[] = ['user_id = $1'];
    const params: any[] = [userId];

    if (filters?.status) {
      params.push(filters.status);
      conditions.push(`status = $${params.length}`);
    }

    const result = await this.pool.query(
      `SELECT * FROM orders WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`,
      params
    );
    return result.rows.map(mapRowToOrder);
  }

  async findAll(filters?: OrderFilterQuery): Promise<Order[]> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.status) {
      params.push(filters.status);
      conditions.push(`status = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await this.pool.query(
      `SELECT * FROM orders ${whereClause} ORDER BY created_at DESC`,
      params
    );
    return result.rows.map(mapRowToOrder);
  }

  async update(id: string, order: Order): Promise<Order> {
    const result = await this.pool.query(
      `UPDATE orders SET
        status = $2,
        status_history = $3::jsonb,
        estimated_delivery = $4,
        updated_at = $5
      WHERE id = $1
      RETURNING *`,
      [
        id,
        order.status,
        JSON.stringify(order.statusHistory),
        order.estimatedDelivery,
        order.updatedAt,
      ]
    );

    if (!result.rows[0]) {
      throw AppError.notFound(`Pedido con ID '${id}' no encontrado.`);
    }

    return mapRowToOrder(result.rows[0]);
  }

  reset(): void {
    // No-op en PostgreSQL; usar MemoryOrderRepository para pruebas unitarias en memoria.
  }
}
