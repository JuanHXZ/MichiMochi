import { parseEnv } from '../shared/config/env.js';

describe('Environment Configuration Validation (P0.3)', () => {
  const validProdEnv: Record<string, string> = {
    NODE_ENV: 'production',
    PORT: '5000',
    APP_URL: 'https://api.michimochi.com',
    JWT_SECRET: 'super-secure-production-jwt-secret-key-with-more-than-32-chars',
    JWT_EXPIRES_IN: '7d',
    OTP_PEPPER: 'production-otp-pepper-16chars',
    CORS_ORIGIN: 'https://michimochi.com,https://www.michimochi.com',
    ENABLE_API_DOCS: 'false',
    PERSISTENCE_MODE: 'postgres',
    DATABASE_URL: 'postgres://user:pass@rds.amazonaws.com:5432/michimochi',
    DATABASE_SSL: 'true',
    FIREBASE_PROJECT_ID: 'michimochiapp',
    FIREBASE_API_KEY: 'firebase-web-key-prod',
    FIREBASE_CLIENT_EMAIL: 'firebase-adminsdk@michimochiapp.iam.gserviceaccount.com',
    FIREBASE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n',
    EMAIL_PROVIDER: 'resend',
    RESEND_API_KEY: 're_prod_123456',
    EMAIL_FROM: 'MichiMochi <no-reply@michimochi.com>',
  };

  it('should accept a complete and hardened production config', () => {
    const parsed = parseEnv(validProdEnv);
    expect(parsed.NODE_ENV).toBe('production');
    expect(parsed.ALLOWED_ORIGINS).toEqual(['https://michimochi.com', 'https://www.michimochi.com']);
    expect(parsed.ENABLE_API_DOCS).toBe(false);
    expect(parsed.PERSISTENCE_MODE).toBe('postgres');
    expect(parsed.EMAIL_PROVIDER).toBe('resend');
    expect(parsed.DATABASE_SSL).toBe(true);
  });

  it('should fail in production if JWT_SECRET is missing or weak', () => {
    expect(() => parseEnv({ ...validProdEnv, JWT_SECRET: '' })).toThrow(/JWT_SECRET/);
    expect(() => parseEnv({ ...validProdEnv, JWT_SECRET: 'michimochi-dev-secret-key-2026' })).toThrow(/JWT_SECRET/);
  });

  it('should fail in production if CORS_ORIGIN is wildcard or contains localhost', () => {
    expect(() => parseEnv({ ...validProdEnv, CORS_ORIGIN: '*' })).toThrow(/CORS_ORIGIN/);
    expect(() => parseEnv({ ...validProdEnv, CORS_ORIGIN: 'http://localhost:5173' })).toThrow(/CORS_ORIGIN/);
  });

  it('should fail in production if PERSISTENCE_MODE is memory or DATABASE_URL is missing', () => {
    expect(() => parseEnv({ ...validProdEnv, PERSISTENCE_MODE: 'memory' })).toThrow(/PERSISTENCE_MODE/);
    expect(() => parseEnv({ ...validProdEnv, DATABASE_URL: '' })).toThrow(/DATABASE_URL/);
  });

  it('should fail in production if EMAIL_PROVIDER is console or RESEND_API_KEY is missing', () => {
    expect(() => parseEnv({ ...validProdEnv, EMAIL_PROVIDER: 'console' })).toThrow(/EMAIL_PROVIDER/);
    expect(() => parseEnv({ ...validProdEnv, RESEND_API_KEY: '' })).toThrow(/RESEND_API_KEY/);
  });

  it('should fail in production if Firebase Admin credentials are missing', () => {
    expect(() => parseEnv({ ...validProdEnv, FIREBASE_CLIENT_EMAIL: '' })).toThrow(/FIREBASE_CLIENT_EMAIL/);
  });
});
