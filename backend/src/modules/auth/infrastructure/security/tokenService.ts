import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { ENV } from '../../../../shared/config/env.js';
import { AccessTokenPayload, UserProfile } from '../../domain/entities/User.js';

export interface PasswordResetTokenPayload {
  email: string;
  purpose: 'password_reset';
  tokenType: 'password_reset';
  jti: string;
  exp?: number;
}

export class TokenService {
  static generateAccessToken(user: UserProfile): string {
    const payload: AccessTokenPayload = {
      uid: user.uid,
      email: user.email,
      fullName: user.fullName,
      provider: user.provider,
      role: user.role,
      tokenType: 'access',
    };

    return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES_IN as any });
  }

  static verifyToken(token: string): AccessTokenPayload {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
    if (
      !decoded ||
      decoded.tokenType !== 'access' ||
      typeof decoded.uid !== 'string' ||
      !decoded.uid ||
      (decoded.role !== 'customer' && decoded.role !== 'admin')
    ) {
      throw new Error('Token de acceso inválido');
    }
    return decoded as AccessTokenPayload;
  }

  static generatePasswordResetToken(email: string): string {
    return jwt.sign(
      {
        email: email.trim().toLowerCase(),
        purpose: 'password_reset',
        tokenType: 'password_reset',
        jti: crypto.randomUUID(),
      },
      ENV.JWT_SECRET,
      { expiresIn: '15m' }
    );
  }

  static verifyPasswordResetToken(token: string): PasswordResetTokenPayload {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
    if (
      !decoded ||
      decoded.purpose !== 'password_reset' ||
      decoded.tokenType !== 'password_reset' ||
      typeof decoded.jti !== 'string' ||
      !decoded.jti
    ) {
      throw new Error('Token inválido para restablecimiento de contraseña');
    }
    return decoded as PasswordResetTokenPayload;
  }
}
