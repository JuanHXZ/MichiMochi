import { Order, OrderFilterQuery } from '../entities/Order.js';

export interface IOrderRepository {
  create(order: Order): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByUserId(userId: string, filters?: OrderFilterQuery): Promise<Order[]>;
  findAll(filters?: OrderFilterQuery): Promise<Order[]>;
  update(id: string, order: Order): Promise<Order>;
  reset(): void;
}
