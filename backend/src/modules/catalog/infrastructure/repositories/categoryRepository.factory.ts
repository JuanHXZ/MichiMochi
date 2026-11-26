import { ENV } from '../../../../shared/config/env.js';
import { getPgPool } from '../../../../shared/database/postgres.js';
import { ICategoryRepository } from '../../domain/repositories/ICategoryRepository.js';
import { MemoryCategoryRepository } from './MemoryCategoryRepository.js';
import { PostgresCategoryRepository } from './PostgresCategoryRepository.js';

let activeCategoryRepository: ICategoryRepository =
  ENV.NODE_ENV !== 'test' && ENV.PERSISTENCE_MODE === 'postgres'
    ? new PostgresCategoryRepository(getPgPool())
    : new MemoryCategoryRepository();

export const getCategoryRepository = (): ICategoryRepository => activeCategoryRepository;

export const setCategoryRepository = (repo: ICategoryRepository): void => {
  activeCategoryRepository = repo;
};

export const categoryRepository: ICategoryRepository = {
  findAll: (filters) => activeCategoryRepository.findAll(filters),
  findById: (id) => activeCategoryRepository.findById(id),
  findByName: (name) => activeCategoryRepository.findByName(name),
  create: (category) => activeCategoryRepository.create(category),
  update: (id, category) => activeCategoryRepository.update(id, category),
  delete: (id) => activeCategoryRepository.delete(id),
  seedIfEmpty: (categories) =>
    activeCategoryRepository.seedIfEmpty
      ? activeCategoryRepository.seedIfEmpty(categories)
      : Promise.resolve(0),
  resetToInitial: () => activeCategoryRepository.resetToInitial(),
};
