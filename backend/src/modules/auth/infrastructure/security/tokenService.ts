import jwt from 'jsonwebtoken';
import { ENV } from '../../../../shared/config/env.js';
import { UserProfile } from '../../domain/entities/User.js';

export class TokenService {
  static generateAccessToken(user: UserProfile): string {
    return jwt.sign(
      {
        uid: user.uid,
        email: user.email,
        fullName: user.fullName,
        provider: user.provider,
      },
      ENV.JWT_SECRET,
      { expiresIn: ENV.JWT_EXPIRES_IN as any }
    );
  }

  static verifyToken(token: string): UserProfile {
    return jwt.verify(token, ENV.JWT_SECRET) as UserProfile;
  }

  static generatePasswordResetToken(email: string): string {
    return jwt.sign(
      {
        email: email.trim().toLowerCase(),
        purpose: 'password_reset',
      },
      ENV.JWT_SECRET,
      { expiresIn: '15m' }
    );
  }

  static verifyPasswordResetToken(token: string): { email: string; purpose: string } {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
    if (decoded.purpose !== 'password_reset') {
      throw new Error('Token inválido para restablecimiento de contraseña');
    }
    return decoded;
  }
}
