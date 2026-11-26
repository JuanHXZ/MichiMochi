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
    title: 'Cupón Dulce $12.900 COP COP',
    description: 'Descuento directo de $12.900 COP en compras desde $60.000 COP',
    pointsCost: 500,
    discountUsd: 3,
    minSubtotal: 8,
  },
  {
    id: 'reward_7usd',
    title: 'Cupón Mochi Lover $30.100 COP',
    description: 'Descuento directo de $30.100 COP en compras desde $100.000 COP',
    pointsCost: 1000,
    discountUsd: 7,
    minSubtotal: 15,
  },
  {
    id: 'reward_10COP',
    title: 'Caja Artesanal $51.600 COP',
    description: 'Descuento de $51.600 COP en pedidos desde $250.000 COP',
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
