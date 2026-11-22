export type RewardTransactionType = 'EARN' | 'REDEEM' | 'BONUS';

export interface RewardBalance {
  userId: string;
  points: number;
  lifetimePoints: number;
  updatedAt: string;
}

export interface RewardTransaction {
  id: string;
  userId: string;
  type: RewardTransactionType;
  points: number;
  orderId?: string | null;
  description: string;
  createdAt: string;
}

export interface RewardCatalogItem {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  discountUsd: number;
  minSubtotal: number;
}

export const REWARD_CATALOG: readonly RewardCatalogItem[] = [
  {
    id: 'reward_3usd',
    title: 'Cupón Dulce $3.00 USD',
    description: 'Descuento directo de $3.00 USD en compras desde $8.00 USD',
    pointsCost: 500,
    discountUsd: 3,
    minSubtotal: 8,
  },
  {
    id: 'reward_7usd',
    title: 'Cupón Mochi Lover $7.00 USD',
    description: 'Descuento directo de $7.00 USD en compras desde $15.00 USD',
    pointsCost: 1000,
    discountUsd: 7,
    minSubtotal: 15,
  },
  {
    id: 'reward_12usd',
    title: 'Caja Artesanal $12.00 USD',
    description: 'Descuento de $12.00 USD en pedidos desde $20.00 USD',
    pointsCost: 1500,
    discountUsd: 12,
    minSubtotal: 20,
  },
];

export interface RewardTierInfo {
  name: 'Sweet Starter' | 'Mochi Lover' | 'Master Artisan';
  minPoints: number;
}

export const REWARD_TIERS: readonly RewardTierInfo[] = [
  { name: 'Sweet Starter', minPoints: 0 },
  { name: 'Mochi Lover', minPoints: 500 },
  { name: 'Master Artisan', minPoints: 1500 },
];
