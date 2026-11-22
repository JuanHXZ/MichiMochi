import { IFavoriteRepository } from '../../domain/repositories/IFavoriteRepository.js';

export class MemoryFavoriteRepository implements IFavoriteRepository {
  private store = new Map<string, string[]>();

  async findProductIdsByUser(userId: string): Promise<string[]> {
    return [...(this.store.get(userId) ?? [])];
  }

  async add(userId: string, productId: string): Promise<string[]> {
    const current = this.store.get(userId) ?? [];
    if (!current.includes(productId)) {
      const updated = [productId, ...current];
      this.store.set(userId, updated);
      return [...updated];
    }
    return [...current];
  }

  async remove(userId: string, productId: string): Promise<string[]> {
    const current = this.store.get(userId) ?? [];
    const updated = current.filter((id) => id !== productId);
    this.store.set(userId, updated);
    return [...updated];
  }

  reset(): void {
    this.store.clear();
  }
}
