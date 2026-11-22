import { IOrderRepository } from '../../domain/repositories/IOrderRepository.js';
import { Order, OrderFilterQuery } from '../../domain/entities/Order.js';

export class MemoryOrderRepository implements IOrderRepository {
  private ordersStore = new Map<string, Order>();

  private sortNewestFirst(orders: Order[]): Order[] {
    return [...orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async create(order: Order): Promise<Order> {
    const cloned = structuredClone(order);
    this.ordersStore.set(order.id, cloned);
    return structuredClone(cloned);
  }

  async findById(id: string): Promise<Order | null> {
    const order = this.ordersStore.get(id);
    return order ? structuredClone(order) : null;
  }

  async findByUserId(userId: string, filters?: OrderFilterQuery): Promise<Order[]> {
    let orders = Array.from(this.ordersStore.values()).filter((o) => o.userId === userId);
    if (filters?.status) {
      orders = orders.filter((o) => o.status === filters.status);
    }
    return this.sortNewestFirst(orders).map((o) => structuredClone(o));
  }

  async findAll(filters?: OrderFilterQuery): Promise<Order[]> {
    let orders = Array.from(this.ordersStore.values());
    if (filters?.status) {
      orders = orders.filter((o) => o.status === filters.status);
    }
    return this.sortNewestFirst(orders).map((o) => structuredClone(o));
  }

  async update(id: string, order: Order): Promise<Order> {
    const cloned = structuredClone(order);
    this.ordersStore.set(id, cloned);
    return structuredClone(cloned);
  }

  reset(): void {
    this.ordersStore.clear();
  }
}
