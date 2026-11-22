import { PromoCode } from '../entities/PromoCode.js';

export interface IPromoCodeRepository {
  findByCode(code: string): Promise<PromoCode | null>;
  findAll(): Promise<PromoCode[]>;
  create(promo: PromoCode): Promise<PromoCode>;
  update(code: string, promo: PromoCode): Promise<PromoCode>;
  delete(code: string): Promise<boolean>;
  incrementUses(code: string): Promise<PromoCode | null>;
  seedIfEmpty?(promos: PromoCode[]): Promise<number>;
  resetToInitial?(): void;
}
