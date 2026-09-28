import { z } from 'zod';

const flavorSchema = z.object({
  id: z.string().min(1, 'El ID del sabor es requerido'),
  name: z.string().min(1, 'El nombre del sabor es requerido'),
  description: z.string().optional(),
  color: z.string().optional(),
});

const nutritionalInfoSchema = z.object({
  calories: z.number().nonnegative().optional(),
  protein: z.string().optional(),
  carbs: z.string().optional(),
  fat: z.string().optional(),
  sugar: z.string().optional(),
});

export const createProductSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'El nombre del producto debe tener al menos 2 caracteres'),
  description: z.string().min(5, 'La descripción debe tener al menos 5 caracteres'),
  price: z.number().positive('El precio debe ser un número positivo mayor a 0'),
  category: z.string().min(2, 'La categoría es requerida'),
  shortName: z.string().optional(),
  longDescription: z.string().optional(),
  originalPrice: z.number().positive().optional(),
  discount: z.number().min(0).max(100).optional(),
  image: z.string().optional(),
  images: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  inStock: z.boolean().optional(),
  stock: z.number().int().nonnegative().optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().nonnegative().optional(),
  flavors: z.array(flavorSchema).optional(),
  ingredients: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  nutritionalInfo: nutritionalInfoSchema.optional(),
  tags: z.array(z.string()).optional(),
  preparationTime: z.string().optional(),
  bestServedAt: z.string().optional(),
});

export type CreateProductDTO = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial();

export type UpdateProductDTO = z.infer<typeof updateProductSchema>;

export const productFilterSchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  featured: z.preprocess((val) => (val === 'true' ? true : val === 'false' ? false : val), z.boolean().optional()),
  inStock: z.preprocess((val) => (val === 'true' ? true : val === 'false' ? false : val), z.boolean().optional()),
});

export type ProductFilterDTO = z.infer<typeof productFilterSchema>;
