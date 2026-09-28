import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
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
}
