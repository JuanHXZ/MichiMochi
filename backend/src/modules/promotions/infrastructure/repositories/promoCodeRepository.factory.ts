import { ENV } from '../../../../shared/config/env.js';
import { getPgPool } from '../../../../shared/database/postgres.js';
import { IPromoCodeRepository } from '../../domain/repositories/IPromoCodeRepository.js';
import { MemoryPromoCodeRepository } from './MemoryPromoCodeRepository.js';
import { PostgresPromoCodeRepository } from './PostgresPromoCodeRepository.js';

let activePromoCodeRepository: IPromoCodeRepository =
  ENV.NODE_ENV !== 'test' && ENV.PERSISTENCE_MODE === 'postgres'
    ? new PostgresPromoCodeRepository(getPgPool())
    : new MemoryPromoCodeRepository();

export const getPromoCodeRepository = (): IPromoCodeRepository => activePromoCodeRepository;

export const setPromoCodeRepository = (repo: IPromoCodeRepository): void => {
  activePromoCodeRepository = repo;
};

export const promoCodeRepository: IPromoCodeRepository = {
  findByCode: (code) => activePromoCodeRepository.findByCode(code),
  findAll: () => activePromoCodeRepository.findAll(),
  create: (promo) => activePromoCodeRepository.create(promo),
  update: (code, promo) => activePromoCodeRepository.update(code, promo),
  delete: (code) => activePromoCodeRepository.delete(code),
  incrementUses: (code) => activePromoCodeRepository.incrementUses(code),
  seedIfEmpty: (promos) =>
    activePromoCodeRepository.seedIfEmpty
      ? activePromoCodeRepository.seedIfEmpty(promos)
      : Promise.resolve(0),
  resetToInitial: () => activePromoCodeRepository.resetToInitial?.(),
};
