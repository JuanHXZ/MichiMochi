import { ENV } from '../../../../shared/config/env.js';
import { getPgPool } from '../../../../shared/database/postgres.js';
import { IProductRepository } from '../../domain/repositories/IProductRepository.js';
import { MemoryProductRepository } from './MemoryProductRepository.js';
import { PostgresProductRepository } from './PostgresProductRepository.js';

let activeProductRepository: IProductRepository =
  ENV.NODE_ENV !== 'test' && ENV.PERSISTENCE_MODE === 'postgres'
    ? new PostgresProductRepository(getPgPool())
    : new MemoryProductRepository();

export const getProductRepository = (): IProductRepository => activeProductRepository;

export const setProductRepository = (repo: IProductRepository): void => {
  activeProductRepository = repo;
};

export const productRepository: IProductRepository = {
  findAll: (filters) => activeProductRepository.findAll(filters),
  findById: (id) => activeProductRepository.findById(id),
  findByName: (name) => activeProductRepository.findByName(name),
  create: (product) => activeProductRepository.create(product),
  update: (id, product) => activeProductRepository.update(id, product),
  clearFeatured: (excludeId) => activeProductRepository.clearFeatured(excludeId),
  countByCategory: (categoryName) =>
    activeProductRepository.countByCategory ? activeProductRepository.countByCategory(categoryName) : Promise.resolve(0),
  renameCategory: (oldName, newName) =>
    activeProductRepository.renameCategory
      ? activeProductRepository.renameCategory(oldName, newName)
      : Promise.resolve(0),
  delete: (id) => activeProductRepository.delete(id),
  seedIfEmpty: (products) =>
    activeProductRepository.seedIfEmpty ? activeProductRepository.seedIfEmpty(products) : Promise.resolve(0),
  resetToInitial: () => activeProductRepository.resetToInitial(),
};
