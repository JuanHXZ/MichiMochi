import { ENV } from '../../../../shared/config/env.js';
import { getPgPool } from '../../../../shared/database/postgres.js';
import { IOrderRepository } from '../../domain/repositories/IOrderRepository.js';
import { MemoryOrderRepository } from './MemoryOrderRepository.js';
import { PostgresOrderRepository } from './PostgresOrderRepository.js';

let activeOrderRepository: IOrderRepository =
  ENV.NODE_ENV !== 'test' && ENV.PERSISTENCE_MODE === 'postgres'
    ? new PostgresOrderRepository(getPgPool())
    : new MemoryOrderRepository();

export const getOrderRepository = (): IOrderRepository => activeOrderRepository;

export const setOrderRepository = (repo: IOrderRepository): void => {
  activeOrderRepository = repo;
};

export const orderRepository: IOrderRepository = {
  create: (order) => activeOrderRepository.create(order),
  findById: (id) => activeOrderRepository.findById(id),
  findByUserId: (userId, filters) => activeOrderRepository.findByUserId(userId, filters),
  findAll: (filters) => activeOrderRepository.findAll(filters),
  update: (id, order) => activeOrderRepository.update(id, order),
  reset: () => activeOrderRepository.reset(),
};
