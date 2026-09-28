export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  city?: string;
  photoURL?: string | null;
  provider: 'password' | 'google';
  createdAt: string;
  updatedAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: string;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
}
