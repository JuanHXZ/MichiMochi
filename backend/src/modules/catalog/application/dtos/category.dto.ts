import { z } from 'zod';

export const ALLOWED_CATEGORY_ICONS = [
  '🍡', '🍓', '🥭', '🍵', '🍫', '🌸', '🍠', '🫐', '🍑', '🍋',
  '🥥', '🍒', '🍇', '🍊', '🍪', '🧁', '🍨', '☕', '✨', '⭐',
] as const;

export const createCategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, 'El nombre de la categoría debe tener al menos 2 caracteres'),
  description: z.string().trim().max(240).optional(),
  icon: z.enum(ALLOWED_CATEGORY_ICONS, {
    errorMap: () => ({ message: 'Selecciona un ícono válido de la lista disponible.' }),
  }).optional(),
  visible: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

export type CreateCategoryDTO = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = createCategorySchema.partial();

export type UpdateCategoryDTO = z.infer<typeof updateCategorySchema>;

export const categoryFilterSchema = z.object({
  visible: z.preprocess((val) => (val === 'true' ? true : val === 'false' ? false : val), z.boolean().optional()),
  search: z.string().optional(),
});

export type CategoryFilterDTO = z.infer<typeof categoryFilterSchema>;
