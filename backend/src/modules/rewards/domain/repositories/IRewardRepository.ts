import { RewardBalance, RewardTransaction } from '../entities/Reward.js';

export interface IRewardRepository {
  getBalance(userId: string): Promise<RewardBalance>;
  getTransactions(userId: string): Promise<RewardTransaction[]>;
  addPoints(
    userId: string,
    points: number,
    tx: Omit<RewardTransaction, 'id' | 'userId' | 'createdAt'>
  ): Promise<RewardBalance>;
  deductPoints(
    userId: string,
    pointsCost: number,
    tx: Omit<RewardTransaction, 'id' | 'userId' | 'createdAt'>
  ): Promise<RewardBalance>;
  reset?(): void;
}
