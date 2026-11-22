import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../../../shared/middlewares/auth.middleware.js';
import { PromoService } from '../../application/services/promo.service.js';

export class PromoController {
  static async validate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, subtotal } = req.body;
      const result = await PromoService.validatePromo(code, subtotal, req.user?.uid);
      res.status(200).json({ ok: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const promotions = await PromoService.listAll();
      res.status(200).json({ ok: true, data: promotions, total: promotions.length });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const created = await PromoService.createPromo(req.body);
      res.status(201).json({
        ok: true,
        message: 'Código promocional creado exitosamente.',
        data: created,
      });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await PromoService.updatePromo(req.params.code, req.body);
      res.status(200).json({
        ok: true,
        message: 'Código promocional actualizado exitosamente.',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  static async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deleted = await PromoService.deletePromo(req.params.code);
      res.status(200).json({
        ok: true,
        message: 'Código promocional eliminado exitosamente.',
        data: deleted,
      });
    } catch (err) {
      next(err);
    }
  }
}
