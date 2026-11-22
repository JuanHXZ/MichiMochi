import { z } from 'zod';

export const createOrderItemSchema = z.object({
  productId: z.string().min(1, 'El identificador del producto es requerido.'),
  quantity: z.number().int().min(1, 'La cantidad mínima es 1.').max(99, 'La cantidad máxima por producto es 99.'),
  flavor: z.string().trim().max(100).optional(),
});

export const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(2, 'El nombre completo es requerido.').max(120),
  phone: z.string().trim().min(7, 'El teléfono de contacto es requerido.').max(25),
  address: z.string().trim().min(5, 'La dirección de entrega es requerida.').max(300),
  city: z.string().trim().min(2, 'La ciudad de entrega es requerida.').max(100),
  notes: z.string().trim().max(300).optional(),
});

export const paymentSimulationSchema = z.object({
  method: z.enum(['card', 'nequi', 'pse', 'cash_on_delivery']),
  cardLast4: z.string().regex(/^\d{4}$/, 'Los últimos 4 dígitos deben ser numéricos.').optional(),
  cardHolder: z.string().trim().max(100).optional(),
  simulateOutcome: z.enum(['approved', 'declined']).optional().default('approved'),
});

export const createOrderSchema = z.object({
  items: z.array(createOrderItemSchema).min(1, 'El carrito debe contener al menos un producto.'),
  shippingAddress: shippingAddressSchema,
  payment: paymentSimulationSchema,
  currency: z.enum(['USD', 'COP']).optional().default('USD'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['RECEIVED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  note: z.string().trim().max(250).optional(),
});

export const orderFilterSchema = z.object({
  status: z.enum(['RECEIVED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  scope: z.enum(['mine', 'all']).optional(),
});

export type CreateOrderDTO = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusDTO = z.infer<typeof updateOrderStatusSchema>;
export type OrderListQueryDTO = z.infer<typeof orderFilterSchema>;
