export type DiscountType = 'PERCENT' | 'FIXED';

export interface PromoCode {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minSubtotal: number;
  maxDiscount?: number | null;
  maxUses?: number | null;
  currentUses: number;
  userId?: string | null;
  expiresAt?: string | null;
  active: boolean;
  createdAt: string;
}

export interface PromoValidationResult {
  valid: true;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
}
