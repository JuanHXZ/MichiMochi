import { z } from 'zod';

export const validatePromoSchema = z.object({
  code: z.string().trim().min(1, 'Ingresa un código promocional.'),
  subtotal: z.number().nonnegative('El subtotal debe ser mayor o igual a 0.'),
});

export const createPromoSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,30}$/, 'El código debe tener entre 3 y 30 caracteres (solo letras, números, - o _).'),
    description: z.string().trim().min(3, 'La descripción debe tener al menos 3 caracteres.').max(200),
    discountType: z.enum(['PERCENT', 'FIXED']),
    discountValue: z.number().positive('El valor de descuento debe ser mayor a 0.'),
    minSubtotal: z.number().nonnegative().optional().default(0),
    maxDiscount: z.number().positive().nullable().optional(),
    maxUses: z.number().int().positive().nullable().optional(),
    expiresAt: z.string().datetime({ offset: true }).nullable().optional().or(z.literal('')).or(z.null()),
    active: z.boolean().optional().default(true),
  })
  .refine((data) => (data.discountType === 'PERCENT' ? data.discountValue <= 100 : true), {
    message: 'Un descuento porcentual no puede superar el 100%.',
    path: ['discountValue'],
  });

export const updatePromoSchema = z
  .object({
    description: z.string().trim().min(3).max(200).optional(),
    discountType: z.enum(['PERCENT', 'FIXED']).optional(),
    discountValue: z.number().positive().optional(),
    minSubtotal: z.number().nonnegative().optional(),
    maxDiscount: z.number().positive().nullable().optional(),
    maxUses: z.number().int().positive().nullable().optional(),
    expiresAt: z.string().datetime({ offset: true }).nullable().optional().or(z.literal('')).or(z.null()),
    active: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.discountType === 'PERCENT' && data.discountValue !== undefined
        ? data.discountValue <= 100
        : true,
    {
      message: 'Un descuento porcentual no puede superar el 100%.',
      path: ['discountValue'],
    }
  );

export type ValidatePromoDTO = z.infer<typeof validatePromoSchema>;
export type CreatePromoDTO = z.infer<typeof createPromoSchema>;
export type UpdatePromoDTO = z.infer<typeof updatePromoSchema>;
