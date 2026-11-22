import { IPromoCodeRepository } from '../../domain/repositories/IPromoCodeRepository.js';
import { PromoCode } from '../../domain/entities/PromoCode.js';
import { INITIAL_PROMOTIONS } from './initialPromotions.js';

export class MemoryPromoCodeRepository implements IPromoCodeRepository {
  private store = new Map<string, PromoCode>(
    INITIAL_PROMOTIONS.map((p) => [p.code, structuredClone(p)])
  );

  private normalize(code: string): string {
    return code.trim().toUpperCase();
  }

  async findByCode(code: string): Promise<PromoCode | null> {
    const found = this.store.get(this.normalize(code));
    return found ? structuredClone(found) : null;
  }

  async findAll(): Promise<PromoCode[]> {
    return Array.from(this.store.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((p) => structuredClone(p));
  }

  async create(promo: PromoCode): Promise<PromoCode> {
    const key = this.normalize(promo.code);
    const saved = { ...promo, code: key };
    this.store.set(key, structuredClone(saved));
    return structuredClone(saved);
  }

  async update(code: string, promo: PromoCode): Promise<PromoCode> {
    const key = this.normalize(code);
    const saved = { ...promo, code: key };
    this.store.set(key, structuredClone(saved));
    return structuredClone(saved);
  }

  async delete(code: string): Promise<boolean> {
    return this.store.delete(this.normalize(code));
  }

  async incrementUses(code: string): Promise<PromoCode | null> {
    const key = this.normalize(code);
    const existing = this.store.get(key);
    if (!existing) return null;
    const nextUses = existing.currentUses + 1;
    const stillActive =
      existing.maxUses !== null && existing.maxUses !== undefined && nextUses >= existing.maxUses
        ? false
        : existing.active;
    const updated: PromoCode = {
      ...existing,
      currentUses: nextUses,
      active: stillActive,
    };
    this.store.set(key, structuredClone(updated));
    return structuredClone(updated);
  }

  async seedIfEmpty(promos: PromoCode[]): Promise<number> {
    if (this.store.size > 0) return 0;
    for (const promo of promos) {
      this.store.set(this.normalize(promo.code), structuredClone(promo));
    }
    return promos.length;
  }

  resetToInitial(): void {
    this.store.clear();
    for (const promo of INITIAL_PROMOTIONS) {
      this.store.set(promo.code, structuredClone(promo));
    }
  }
}
