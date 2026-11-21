import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../../modules/auth/infrastructure/security/tokenService.js';
import { UserProfile } from '../../modules/auth/domain/entities/User.js';

export interface AuthRequest extends Request {
  user?: UserProfile;
}

const parseCookieValue = (cookieHeader: string | undefined, name: string): string | null => {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [rawKey, ...rest] = part.trim().split('=');
    if (rawKey === name && rest.length > 0) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return null;
};

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const cookieToken = parseCookieValue(req.headers.cookie, 'michimochi_session');
  const token = bearerToken || cookieToken;

  if (!token) {
    res.status(401).json({ ok: false, error: 'Authorization header missing or invalid' });
    return;
  }

  try {
    const decoded = TokenService.verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ ok: false, error: 'Token expired or invalid' });
    return;
  }
};
