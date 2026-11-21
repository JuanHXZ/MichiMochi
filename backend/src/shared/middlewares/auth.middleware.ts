import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../../modules/auth/infrastructure/security/tokenService.js';
import { AccessTokenPayload, UserRole } from '../../modules/auth/domain/entities/User.js';
import { userRepository } from '../../modules/auth/infrastructure/repositories/userRepository.factory.js';

export interface AuthRequest extends Request {
  user?: AccessTokenPayload;
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

const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const cookieToken = parseCookieValue(req.headers.cookie, 'michimochi_session');
  return bearerToken || cookieToken;
};

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = extractToken(req);

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
  }
};

export const optionalAuthenticateJWT = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const token = extractToken(req);
  if (!token) {
    req.user = undefined;
    next();
    return;
  }

  try {
    req.user = TokenService.verifyToken(token);
  } catch {
    req.user = undefined;
  }
  next();
};

export const requireRole = (...allowedRoles: UserRole[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user?.uid) {
      res.status(401).json({ ok: false, error: 'No autorizado' });
      return;
    }

    try {
      const dbUser = await userRepository.findById(req.user.uid);
      const effectiveRole: UserRole = dbUser?.role ?? req.user.role;

      if (!allowedRoles.includes(effectiveRole)) {
        res.status(403).json({
          ok: false,
          error: 'Acceso denegado: se requieren permisos de administrador.',
        });
        return;
      }

      req.user = { ...req.user, role: effectiveRole };
      next();
    } catch (err) {
      next(err);
    }
  };
};
