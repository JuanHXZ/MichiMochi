import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../application/services/auth.service.js';
import { AuthRequest } from '../../../../shared/middlewares/auth.middleware.js';

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

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.forgotPassword(req.body.email);
      res.status(200).json({ ok: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, code } = req.body;
      const result = await AuthService.verifyOtp(email, code);
      res.status(200).json({ ok: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.resetPassword(req.body);
      res.status(200).json({ ok: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
