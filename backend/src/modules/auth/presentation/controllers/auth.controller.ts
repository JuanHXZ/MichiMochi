import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../application/services/auth.service.js';
import { AuthRequest } from '../../../../shared/middlewares/auth.middleware.js';
import { ENV } from '../../../../shared/config/env.js';

const SESSION_COOKIE_NAME = 'michimochi_session';

const setSessionCookie = (res: Response, token?: string) => {
  if (!token) return;
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: ENV.NODE_ENV === 'production',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      setSessionCookie(res, result?.tokens?.accessToken);
      res.status(201).json({ ok: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      setSessionCookie(res, result?.tokens?.accessToken);
      res.status(200).json({ ok: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async googleLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { idToken, oauthToken } = req.body;
      const result = await AuthService.loginWithGoogle(idToken, oauthToken);
      setSessionCookie(res, result?.tokens?.accessToken);
      res.status(200).json({ ok: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async logout(_req: Request, res: Response) {
    res.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax',
      secure: ENV.NODE_ENV === 'production',
      path: '/',
    });
    res.setHeader('Clear-Site-Data', '"cookies", "storage", "cache"');
    res.status(200).json({ ok: true });
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
