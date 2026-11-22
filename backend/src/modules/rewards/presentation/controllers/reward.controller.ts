import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../../shared/middlewares/auth.middleware.js';
import { RewardService } from '../../application/services/reward.service.js';

export class RewardController {
  static async getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await RewardService.getSummary(req.user!.uid);
      res.status(200).json({ ok: true, data: summary });
    } catch (err) {
      next(err);
    }
  }

  static async redeem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await RewardService.redeemReward(req.user!.uid, req.body.rewardId);
      res.status(200).json({
        ok: true,
        message: `¡Canje exitoso! Usa el código ${result.promo.code} en tu próximo pedido.`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
