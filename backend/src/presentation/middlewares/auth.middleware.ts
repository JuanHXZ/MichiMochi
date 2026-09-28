import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../../infrastructure/security/tokenService.js';
import { UserProfile } from '../../domain/entities/User.js';

export interface AuthRequest extends Request {
  user?: UserProfile;
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ ok: false, error: 'Authorization header missing or invalid' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = TokenService.verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ ok: false, error: 'Token expired or invalid' });
    return;
  }
};
