import { ENV } from '../../../../shared/config/env.js';
import { getPgPool } from '../../../../shared/database/postgres.js';
import { IFavoriteRepository } from '../../domain/repositories/IFavoriteRepository.js';
import { MemoryFavoriteRepository } from './MemoryFavoriteRepository.js';
import { PostgresFavoriteRepository } from './PostgresFavoriteRepository.js';

let activeFavoriteRepository: IFavoriteRepository =
  ENV.NODE_ENV !== 'test' && ENV.PERSISTENCE_MODE === 'postgres'
    ? new PostgresFavoriteRepository(getPgPool())
    : new MemoryFavoriteRepository();

export const getFavoriteRepository = (): IFavoriteRepository => activeFavoriteRepository;

export const setFavoriteRepository = (repo: IFavoriteRepository): void => {
  activeFavoriteRepository = repo;
};

export const favoriteRepository: IFavoriteRepository = {
  findProductIdsByUser: (userId) => activeFavoriteRepository.findProductIdsByUser(userId),
  add: (userId, productId) => activeFavoriteRepository.add(userId, productId),
  remove: (userId, productId) => activeFavoriteRepository.remove(userId, productId),
  reset: () => activeFavoriteRepository.reset?.(),
};
