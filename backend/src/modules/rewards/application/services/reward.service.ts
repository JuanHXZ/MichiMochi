import { rewardRepository } from '../../infrastructure/repositories/rewardRepository.factory.js';
import {
  REWARD_CATALOG,
  REWARD_TIERS,
  RewardCatalogItem,
  RewardTierInfo,
  RewardTransaction,
} from '../../domain/entities/Reward.js';
import { PromoCode } from '../../../promotions/domain/entities/PromoCode.js';
import { promoCodeRepository } from '../../../promotions/infrastructure/repositories/promoCodeRepository.factory.js';
import { PromoService } from '../../../promotions/application/services/promo.service.js';
import { AppError } from '../../../../shared/errors/AppError.js';

export const POINTS_PER_USD = 10;

export interface RewardSummary {
  points: number;
  lifetimePoints: number;
  tier: RewardTierInfo;
  nextTier: RewardTierInfo | null;
  catalog: readonly RewardCatalogItem[];
  transactions: RewardTransaction[];
  activeCoupons: PromoCode[];
}

export class RewardService {
  private static resolveTier(lifetimePoints: number): {
    tier: RewardTierInfo;
    nextTier: RewardTierInfo | null;
  } {
    let current = REWARD_TIERS[0];
    let next: RewardTierInfo | null = null;
    for (let i = 0; i < REWARD_TIERS.length; i += 1) {
      if (lifetimePoints >= REWARD_TIERS[i].minPoints) {
        current = REWARD_TIERS[i];
        next = REWARD_TIERS[i + 1] ?? null;
      }
    }
    return { tier: current, nextTier: next };
  }

  static async getSummary(userId: string): Promise<RewardSummary> {
    const [balance, transactions, allPromos] = await Promise.all([
      rewardRepository.getBalance(userId),
      rewardRepository.getTransactions(userId),
      promoCodeRepository.findAll(),
    ]);

    const { tier, nextTier } = RewardService.resolveTier(balance.lifetimePoints);
    const activeCoupons = allPromos.filter(
      (p) =>
        p.userId === userId &&
        p.active &&
        (!p.expiresAt || new Date(p.expiresAt).getTime() > Date.now()) &&
        (p.maxUses === null || p.maxUses === undefined || p.currentUses < p.maxUses)
    );

    return {
      points: balance.points,
      lifetimePoints: balance.lifetimePoints,
      tier,
      nextTier,
      catalog: REWARD_CATALOG,
      transactions,
      activeCoupons,
    };
  }

  static async earnFromOrder(
    userId: string,
    orderId: string,
    orderNumber: string,
    subtotal: number
  ): Promise<number> {
    const earned = Math.floor(Math.max(0, subtotal) * POINTS_PER_USD);
    if (earned <= 0) return 0;

    await rewardRepository.addPoints(userId, earned, {
      type: 'EARN',
      points: earned,
      orderId,
      description: `Compra confirmada (${orderNumber})`,
    });
    return earned;
  }

  static async redeemReward(
    userId: string,
    rewardId: string
  ): Promise<{ promo: PromoCode; summary: RewardSummary }> {
    const rewardItem = REWARD_CATALOG.find((item) => item.id === rewardId);
    if (!rewardItem) {
      throw AppError.notFound(`La recompensa '${rewardId}' no existe.`);
    }

    await rewardRepository.deductPoints(userId, rewardItem.pointsCost, {
      type: 'REDEEM',
      points: -rewardItem.pointsCost,
      orderId: null,
      description: `Canje: ${rewardItem.title}`,
    });

    const promo = await PromoService.createRewardPromo(
      userId,
      rewardItem.discountUsd,
      rewardItem.minSubtotal,
      `Canje de recompensa (${rewardItem.title})`
    );

    const summary = await RewardService.getSummary(userId);
    return { promo, summary };
  }
}
