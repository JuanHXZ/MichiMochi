import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../../shared/middlewares/auth.middleware.js';
import { FavoriteService } from '../../application/services/favorite.service.js';

export class FavoriteController {
  static async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await FavoriteService.getUserFavorites(req.user!.uid);
      res.status(200).json({ ok: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async add(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await FavoriteService.addFavorite(req.user!.uid, req.params.productId);
      res.status(200).json({ ok: true, message: 'Producto agregado a favoritos.', data });
    } catch (err) {
      next(err);
    }
  }

  static async remove(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await FavoriteService.removeFavorite(req.user!.uid, req.params.productId);
      res.status(200).json({ ok: true, message: 'Producto eliminado de favoritos.', data });
    } catch (err) {
      next(err);
    }
  }
}
