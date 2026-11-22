import { z } from 'zod';

export const redeemRewardSchema = z.object({
  rewardId: z.string().trim().min(1, 'El identificador de la recompensa es requerido.'),
});

export type RedeemRewardDTO = z.infer<typeof redeemRewardSchema>;
