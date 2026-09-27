import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json({ ok: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      res.status(200).json({ ok: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async googleLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { idToken, oauthToken } = req.body;
      const result = await AuthService.loginWithGoogle(idToken, oauthToken);
      res.status(200).json({ ok: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user?.uid) {
        res.status(401).json({ ok: false, error: 'Unauthorized' });
        return;
      }
      const user = await AuthService.getProfile(req.user.uid, req.user);
      res.status(200).json({ ok: true, data: { user } });
    } catch (err) {
      next(err);
    }
  }
}
