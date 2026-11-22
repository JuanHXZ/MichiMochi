import crypto from 'node:crypto';
import { IRewardRepository } from '../../domain/repositories/IRewardRepository.js';
import { RewardBalance, RewardTransaction } from '../../domain/entities/Reward.js';
import { AppError } from '../../../../shared/errors/AppError.js';

export class MemoryRewardRepository implements IRewardRepository {
  private balances = new Map<string, RewardBalance>();
  private transactions = new Map<string, RewardTransaction[]>();

  async getBalance(userId: string): Promise<RewardBalance> {
    const existing = this.balances.get(userId);
    if (existing) return { ...existing };
    return {
      userId,
      points: 0,
      lifetimePoints: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  async getTransactions(userId: string): Promise<RewardTransaction[]> {
    return [...(this.transactions.get(userId) ?? [])];
  }

  async addPoints(
    userId: string,
    points: number,
    tx: Omit<RewardTransaction, 'id' | 'userId' | 'createdAt'>
  ): Promise<RewardBalance> {
    const now = new Date().toISOString();
    const current = await this.getBalance(userId);
    const updated: RewardBalance = {
      userId,
      points: current.points + points,
      lifetimePoints: current.lifetimePoints + points,
      updatedAt: now,
    };
    this.balances.set(userId, updated);

    const list = this.transactions.get(userId) ?? [];
    list.unshift({
      id: `rtx_${crypto.randomUUID()}`,
      userId,
      ...tx,
      createdAt: now,
    });
    this.transactions.set(userId, list);
    return { ...updated };
  }

  async deductPoints(
    userId: string,
    pointsCost: number,
    tx: Omit<RewardTransaction, 'id' | 'userId' | 'createdAt'>
  ): Promise<RewardBalance> {
    const now = new Date().toISOString();
    const current = await this.getBalance(userId);
    if (current.points < pointsCost) {
      throw AppError.badRequest(
        `Puntos insuficientes. Tienes ${current.points} pts y necesitas ${pointsCost} pts.`
      );
    }

    const updated: RewardBalance = {
      userId,
      points: current.points - pointsCost,
      lifetimePoints: current.lifetimePoints,
      updatedAt: now,
    };
    this.balances.set(userId, updated);

    const list = this.transactions.get(userId) ?? [];
    list.unshift({
      id: `rtx_${crypto.randomUUID()}`,
      userId,
      ...tx,
      createdAt: now,
    });
    this.transactions.set(userId, list);
    return { ...updated };
  }

  reset(): void {
    this.balances.clear();
    this.transactions.clear();
  }
}
