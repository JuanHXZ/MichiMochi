export type UserRole = 'customer' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  address?: string;
  city?: string;
  photoURL?: string | null;
  provider: 'password' | 'google';
  createdAt: string;
  updatedAt?: string;
}

export interface AccessTokenPayload {
  uid: string;
  email: string;
  fullName: string;
  provider: 'password' | 'google';
  role: UserRole;
  tokenType: 'access';
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: string;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
}
