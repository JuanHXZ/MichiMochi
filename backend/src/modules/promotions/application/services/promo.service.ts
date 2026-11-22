import crypto from 'node:crypto';
import { promoCodeRepository } from '../../infrastructure/repositories/promoCodeRepository.factory.js';
import { PromoCode, PromoValidationResult } from '../../domain/entities/PromoCode.js';
import { AppError } from '../../../../shared/errors/AppError.js';
import { CreatePromoDTO, UpdatePromoDTO } from '../dtos/promo.dto.js';

const round2 = (value: number): number => Math.round(value * 100) / 100;

export class PromoService {
  static async validatePromo(
    rawCode: string,
    subtotal: number,
    userId?: string
  ): Promise<PromoValidationResult> {
    const code = rawCode.trim().toUpperCase();
    if (!code) {
      throw AppError.badRequest('Ingresa un código promocional.');
    }

    const promo = await promoCodeRepository.findByCode(code);
    if (!promo) {
      throw AppError.notFound(`El código promocional '${code}' no existe.`);
    }

    if (!promo.active) {
      throw AppError.badRequest(`El código '${code}' ya no está activo.`);
    }

    if (promo.expiresAt && new Date(promo.expiresAt).getTime() < Date.now()) {
      throw AppError.badRequest(`El código '${code}' ha expirado.`);
    }

    if (promo.maxUses !== null && promo.maxUses !== undefined && promo.currentUses >= promo.maxUses) {
      throw AppError.badRequest(`El código '${code}' alcanzó su límite máximo de usos.`);
    }

    if (promo.userId && promo.userId !== userId) {
      throw AppError.forbidden('Este cupón pertenece a otra cuenta.');
    }

    if (subtotal < promo.minSubtotal) {
      throw AppError.badRequest(
        `El código '${code}' requiere un subtotal mínimo de $${promo.minSubtotal.toFixed(2)} USD.`
      );
    }

    let discountAmount =
      promo.discountType === 'PERCENT'
        ? (subtotal * promo.discountValue) / 100
        : promo.discountValue;

    if (promo.maxDiscount !== null && promo.maxDiscount !== undefined) {
      discountAmount = Math.min(discountAmount, promo.maxDiscount);
    }

    discountAmount = round2(Math.min(discountAmount, subtotal));

    return {
      valid: true,
      code: promo.code,
      description: promo.description,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discountAmount,
    };
  }

  static async consumePromo(
    rawCode: string,
    subtotal: number,
    userId: string
  ): Promise<PromoValidationResult> {
    const validation = await PromoService.validatePromo(rawCode, subtotal, userId);
    await promoCodeRepository.incrementUses(validation.code);
    return validation;
  }

  static async createRewardPromo(
    userId: string,
    amountUsd: number,
    minSubtotal: number,
    description: string
  ): Promise<PromoCode> {
    const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

    return promoCodeRepository.create({
      code: `REWARD-${suffix}`,
      description,
      discountType: 'FIXED',
      discountValue: amountUsd,
      minSubtotal,
      maxDiscount: null,
      maxUses: 1,
      currentUses: 0,
      userId,
      expiresAt,
      active: true,
      createdAt: new Date().toISOString(),
    });
  }

  static async listAll(): Promise<PromoCode[]> {
    return promoCodeRepository.findAll();
  }

  static async createPromo(data: CreatePromoDTO): Promise<PromoCode> {
    const code = data.code.trim().toUpperCase();
    const existing = await promoCodeRepository.findByCode(code);
    if (existing) {
      throw AppError.conflict(`Ya existe un código promocional '${code}'.`);
    }

    const promo: PromoCode = {
      code,
      description: data.description.trim(),
      discountType: data.discountType,
      discountValue: data.discountValue,
      minSubtotal: data.minSubtotal ?? 0,
      maxDiscount: data.maxDiscount ?? null,
      maxUses: data.maxUses ?? null,
      currentUses: 0,
      userId: null,
      expiresAt: data.expiresAt ? data.expiresAt : null,
      active: data.active ?? true,
      createdAt: new Date().toISOString(),
    };

    return promoCodeRepository.create(promo);
  }

  static async updatePromo(rawCode: string, data: UpdatePromoDTO): Promise<PromoCode> {
    const code = rawCode.trim().toUpperCase();
    const existing = await promoCodeRepository.findByCode(code);
    if (!existing) {
      throw AppError.notFound(`Código promocional '${code}' no encontrado.`);
    }

    const nextType = data.discountType ?? existing.discountType;
    const nextValue = data.discountValue ?? existing.discountValue;
    if (nextType === 'PERCENT' && nextValue > 100) {
      throw AppError.badRequest('Un descuento porcentual no puede superar el 100%.');
    }

    const updated: PromoCode = {
      ...existing,
      ...(data.description !== undefined ? { description: data.description.trim() } : {}),
      ...(data.discountType !== undefined ? { discountType: data.discountType } : {}),
      ...(data.discountValue !== undefined ? { discountValue: data.discountValue } : {}),
      ...(data.minSubtotal !== undefined ? { minSubtotal: data.minSubtotal } : {}),
      ...(data.maxDiscount !== undefined ? { maxDiscount: data.maxDiscount } : {}),
      ...(data.maxUses !== undefined ? { maxUses: data.maxUses } : {}),
      ...(data.expiresAt !== undefined ? { expiresAt: data.expiresAt ? data.expiresAt : null } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
    };

    return promoCodeRepository.update(code, updated);
  }

  static async deletePromo(rawCode: string): Promise<{ code: string }> {
    const code = rawCode.trim().toUpperCase();
    const deleted = await promoCodeRepository.delete(code);
    if (!deleted) {
      throw AppError.notFound(`Código promocional '${code}' no encontrado.`);
    }
    return { code };
  }

  static resetToInitial(): void {
    promoCodeRepository.resetToInitial?.();
  }
}
