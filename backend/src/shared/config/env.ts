import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const KNOWN_WEAK_SECRETS = new Set([
  'michimochi-dev-secret-key-2026',
  'michimochi-development-super-secret-key-2026',
  'secret',
  'changeme',
  'dev-secret',
]);

const optionalBool = (raw: string | undefined, defaultVal: boolean): boolean => {
  if (raw === undefined || raw.trim() === '') return defaultVal;
  return raw.trim().toLowerCase() === 'true';
};

const parseOrigins = (raw: string): string[] =>
  raw
    .replace(/['"]/g, '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  JWT_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  OTP_PEPPER: z.string().optional(),
  APP_URL: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
  ENABLE_API_DOCS: z.string().optional(),
  PERSISTENCE_MODE: z.enum(['postgres', 'memory']).optional(),
  DATABASE_URL: z.string().optional(),
  DATABASE_SSL: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_API_KEY: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  EMAIL_PROVIDER: z.enum(['resend', 'console']).optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().optional(),
  S3_PUBLIC_BASE_URL: z.string().optional(),
});

export interface AppEnv {
  PORT: string;
  NODE_ENV: 'development' | 'test' | 'production';
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  OTP_PEPPER: string;
  APP_URL: string;
  CORS_ORIGIN: string;
  ALLOWED_ORIGINS: string[];
  ENABLE_API_DOCS: boolean;
  PERSISTENCE_MODE: 'postgres' | 'memory';
  DATABASE_URL: string;
  DATABASE_SSL: boolean;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_API_KEY: string;
  FIREBASE_CLIENT_EMAIL: string;
  FIREBASE_PRIVATE_KEY: string;
  EMAIL_PROVIDER: 'resend' | 'console';
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
  AWS_REGION: string;
  S3_BUCKET: string;
  S3_PUBLIC_BASE_URL: string;
}

export function parseEnv(rawEnv: Record<string, string | undefined> = process.env): AppEnv {
  const parsed = envSchema.parse(rawEnv);
  const nodeEnv = parsed.NODE_ENV;
  const isProd = nodeEnv === 'production';

  const jwtSecret = parsed.JWT_SECRET?.trim() || (isProd ? '' : 'michimochi-local-dev-jwt-secret-key-min-32-chars');
  if (isProd) {
    if (!jwtSecret || jwtSecret.length < 32 || KNOWN_WEAK_SECRETS.has(jwtSecret)) {
      throw new Error('Configuración inválida en producción: JWT_SECRET es obligatorio, mínimo 32 caracteres y no puede ser un secreto por defecto.');
    }
  }

  const otpPepper = parsed.OTP_PEPPER?.trim() || (isProd ? '' : 'michimochi-local-dev-otp-pepper');
  if (isProd && (!otpPepper || otpPepper.length < 16)) {
    throw new Error('Configuración inválida en producción: OTP_PEPPER es obligatorio (mínimo 16 caracteres).');
  }

  const appUrl = parsed.APP_URL?.trim() || (isProd ? '' : 'http://localhost:5000');
  if (isProd && (!appUrl || !appUrl.startsWith('https://'))) {
    throw new Error('Configuración inválida en producción: APP_URL es obligatorio y debe iniciar con https://.');
  }

  const rawCors =
    parsed.CORS_ORIGIN?.trim() ||
    (isProd ? '' : 'http://localhost:5173,http://localhost:4173,http://localhost:8081');
  const allowedOrigins = parseOrigins(rawCors);

  if (isProd) {
    if (!rawCors || rawCors === '*' || allowedOrigins.includes('*') || allowedOrigins.length === 0) {
      throw new Error('Configuración inválida en producción: CORS_ORIGIN es obligatorio y no puede ser "*".');
    }
    for (const origin of allowedOrigins) {
      let url: URL;
      try {
        url = new URL(origin);
      } catch {
        throw new Error(`Configuración inválida en producción: origen CORS inválido "${origin}".`);
      }
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        throw new Error(`Configuración inválida en producción: CORS_ORIGIN no puede incluir "${origin}".`);
      }
    }
  }

  const databaseUrl = parsed.DATABASE_URL?.trim() || '';
  const persistenceMode: 'postgres' | 'memory' =
    parsed.PERSISTENCE_MODE ||
    (isProd ? 'postgres' : nodeEnv === 'test' ? 'memory' : databaseUrl ? 'postgres' : 'memory');

  if (isProd && persistenceMode !== 'postgres') {
    throw new Error('Configuración inválida en producción: PERSISTENCE_MODE debe ser "postgres".');
  }
  if (persistenceMode === 'postgres' && !databaseUrl) {
    throw new Error('Configuración inválida: DATABASE_URL es obligatorio cuando PERSISTENCE_MODE es "postgres".');
  }

  const firebaseProjectId = parsed.FIREBASE_PROJECT_ID?.trim() || (isProd ? '' : 'michimochiapp');
  const firebaseApiKey = parsed.FIREBASE_API_KEY?.trim() || (nodeEnv === 'test' ? 'test-firebase-api-key' : '');
  const firebaseClientEmail = parsed.FIREBASE_CLIENT_EMAIL?.trim() || '';
  const firebasePrivateKey = parsed.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '';

  if (isProd) {
    if (!firebaseProjectId || !firebaseApiKey || !firebaseClientEmail || !firebasePrivateKey) {
      throw new Error(
        'Configuración inválida en producción: FIREBASE_PROJECT_ID, FIREBASE_API_KEY, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY son obligatorios.'
      );
    }
  }

  const emailProvider: 'resend' | 'console' =
    parsed.EMAIL_PROVIDER || (isProd ? 'resend' : 'console');

  if (isProd && emailProvider !== 'resend') {
    throw new Error('Configuración inválida en producción: EMAIL_PROVIDER debe ser "resend" (console no está permitido).');
  }

  const resendApiKey = parsed.RESEND_API_KEY?.trim() || '';
  const emailFrom = parsed.EMAIL_FROM?.trim() || (isProd ? '' : 'MichiMochi <no-reply@michimochi.local>');

  if (emailProvider === 'resend' && (!resendApiKey || !emailFrom)) {
    throw new Error('Configuración inválida: RESEND_API_KEY y EMAIL_FROM son obligatorios cuando EMAIL_PROVIDER="resend".');
  }

  return {
    PORT: parsed.PORT,
    NODE_ENV: nodeEnv,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: parsed.JWT_EXPIRES_IN,
    OTP_PEPPER: otpPepper,
    APP_URL: appUrl,
    CORS_ORIGIN: rawCors,
    ALLOWED_ORIGINS: allowedOrigins,
    ENABLE_API_DOCS: optionalBool(parsed.ENABLE_API_DOCS, !isProd),
    PERSISTENCE_MODE: persistenceMode,
    DATABASE_URL: databaseUrl,
    DATABASE_SSL: optionalBool(parsed.DATABASE_SSL, isProd),
    FIREBASE_PROJECT_ID: firebaseProjectId,
    FIREBASE_API_KEY: firebaseApiKey,
    FIREBASE_CLIENT_EMAIL: firebaseClientEmail,
    FIREBASE_PRIVATE_KEY: firebasePrivateKey,
    EMAIL_PROVIDER: emailProvider,
    RESEND_API_KEY: resendApiKey,
    EMAIL_FROM: emailFrom,
    AWS_REGION: parsed.AWS_REGION.trim() || 'us-east-1',
    S3_BUCKET: parsed.S3_BUCKET?.trim() || '',
    S3_PUBLIC_BASE_URL: parsed.S3_PUBLIC_BASE_URL?.trim() || '',
  };
}

export const ENV: AppEnv = parseEnv();
