import { ENV } from '../../../../shared/config/env.js';
import { getPgPool } from '../../../../shared/database/postgres.js';
import { IRewardRepository } from '../../domain/repositories/IRewardRepository.js';
import { MemoryRewardRepository } from './MemoryRewardRepository.js';
import { PostgresRewardRepository } from './PostgresRewardRepository.js';

let activeRewardRepository: IRewardRepository =
  ENV.NODE_ENV !== 'test' && ENV.PERSISTENCE_MODE === 'postgres'
    ? new PostgresRewardRepository(getPgPool())
    : new MemoryRewardRepository();

export const getRewardRepository = (): IRewardRepository => activeRewardRepository;

export const setRewardRepository = (repo: IRewardRepository): void => {
  activeRewardRepository = repo;
};

export const rewardRepository: IRewardRepository = {
  getBalance: (userId) => activeRewardRepository.getBalance(userId),
  getTransactions: (userId) => activeRewardRepository.getTransactions(userId),
  addPoints: (userId, points, tx) => activeRewardRepository.addPoints(userId, points, tx),
  deductPoints: (userId, pointsCost, tx) => activeRewardRepository.deductPoints(userId, pointsCost, tx),
  reset: () => activeRewardRepository.reset?.(),
};
