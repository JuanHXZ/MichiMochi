import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../app.js';
import { ENV } from '../shared/config/env.js';
import { MemoryUserRepository } from '../modules/auth/infrastructure/repositories/MemoryUserRepository.js';
import { setUserRepository } from '../modules/auth/infrastructure/repositories/userRepository.factory.js';
import { MemoryOtpRepository } from '../modules/auth/infrastructure/repositories/MemoryOtpRepository.js';
import { setOtpRepository } from '../modules/auth/infrastructure/repositories/otpRepository.factory.js';

describe('Backend API Tests (Auth & Security P0)', () => {
  const app = createApp();
  const originalFetch = global.fetch;
  let userRepo: MemoryUserRepository;
  let otpRepo: MemoryOtpRepository;

  const registeredAccounts = new Map<string, { uid: string; email: string; password: string; fullName: string }>();

  beforeEach(() => {
    userRepo = new MemoryUserRepository();
    otpRepo = new MemoryOtpRepository();
    setUserRepository(userRepo);
    setOtpRepository(otpRepo);
    registeredAccounts.clear();

    global.fetch = jest.fn(async (input: any, init?: any) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      const body = init?.body ? JSON.parse(init.body) : {};

      if (url.includes('accounts:signUp')) {
        const email = String(body.email || '').toLowerCase();
        if (registeredAccounts.has(email)) {
          return {
            ok: false,
            json: async () => ({ error: { message: 'EMAIL_EXISTS' } }),
          } as any;
        }
        const uid = `fb-uid-${registeredAccounts.size + 1}`;
        registeredAccounts.set(email, {
          uid,
          email,
          password: body.password,
          fullName: body.displayName || 'User',
        });
        return {
          ok: true,
          json: async () => ({ localId: uid, email, idToken: `id-token-${uid}` }),
        } as any;
      }

      if (url.includes('accounts:signInWithPassword')) {
        const email = String(body.email || '').toLowerCase();
        const account = registeredAccounts.get(email);
        if (!account || account.password !== body.password) {
          return {
            ok: false,
            json: async () => ({ error: { message: 'INVALID_LOGIN_CREDENTIALS' } }),
          } as any;
        }
        return {
          ok: true,
          json: async () => ({
            localId: account.uid,
            email: account.email,
            displayName: account.fullName,
            idToken: `id-token-${account.uid}`,
          }),
        } as any;
      }

      if (url.includes('accounts:lookup')) {
        if (body.idToken === 'valid-google-admin-id-token') {
          return {
            ok: true,
            json: async () => ({
              users: [
                {
                  localId: 'google-admin-uid',
                  email: 'google.admin@michimochi.com',
                  displayName: 'Google Admin',
                },
              ],
            }),
          } as any;
        }
        return {
          ok: false,
          json: async () => ({ error: { message: 'INVALID_ID_TOKEN' } }),
        } as any;
      }

      if (url.includes('accounts:signInWithIdp')) {
        return {
          ok: false,
          json: async () => ({ error: { message: 'INVALID_IDP_RESPONSE' } }),
        } as any;
      }

      return {
        ok: false,
        json: async () => ({}),
      } as any;
    }) as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe('GET /health', () => {
    it('should return status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('service', 'michimochi-backend');
    });
  });

  describe('GET /docs/openapi.json & /docs (Scalar Documentation)', () => {
    it('should serve openapi.json with OpenAPI 3.1 spec', async () => {
      const res = await request(app).get('/docs/openapi.json');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('openapi', '3.1.0');
      expect(res.body.info).toHaveProperty('title', 'MichiMochi API — Dedicated Backend');
    });

    it('should serve Scalar HTML reference UI', async () => {
      const res = await request(app).get('/docs');
      expect(res.status).toBe(200);
      expect(res.text).toContain('scalar');
    });
  });

  describe('POST /api/auth/register (Validation & RBAC Mass-Assignment Guard)', () => {
    it('should reject registration with invalid email or missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'J',
          email: 'not-an-email',
          password: '123',
          acceptedTerms: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body).toHaveProperty('details');
      expect(res.body.details.length).toBeGreaterThan(0);
    });

    it('should always assign role "customer" even if payload attempts to set role "admin"', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Attempt Admin',
          email: 'customer.guard@michimochi.com',
          password: 'TestPassword2026*',
          acceptedTerms: true,
          role: 'admin',
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.user.role).toBe('customer');
    });
  });

  describe('POST /api/auth/login (Validation & Integration)', () => {
    it('should reject login without required fields', async () => {
      const res = await request(app).post('/api/auth/login').send({});
      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it('should authenticate valid credentials and issue JWT token with role', async () => {
      const testUser = {
        fullName: 'Juan Henao Test',
        email: 'test_henao@michimochi.com',
        password: 'TestPassword2026*',
        acceptedTerms: true,
      };

      const regRes = await request(app).post('/api/auth/register').send(testUser);
      expect(regRes.status).toBe(201);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user.role).toBe('customer');
      expect(res.body.data.tokens).toHaveProperty('accessToken');
    });

    it('should reject incorrect password with 401', async () => {
      await request(app).post('/api/auth/register').send({
        fullName: 'Wrong Pass User',
        email: 'wrongpass@michimochi.com',
        password: 'TestPassword2026*',
        acceptedTerms: true,
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrongpass@michimochi.com', password: 'wrongpassword123' });

      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
      expect(res.body.error).toBe('Correo o contraseña incorrectos.');
    });
  });

  describe('GET /api/auth/me (Current User Profile & Token Type Guard)', () => {
    it('should reject requests without token with 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
    });

    it('should return user profile when authenticated with valid access JWT', async () => {
      const standaloneToken = jwt.sign(
        {
          uid: 'standalone-uid-999',
          email: 'standalone@michimochi.com',
          fullName: 'Standalone User',
          provider: 'password',
          role: 'customer',
          tokenType: 'access',
        },
        ENV.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${standaloneToken}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.ok).toBe(true);
      expect(meRes.body.data.user.uid).toBe('standalone-uid-999');
      expect(meRes.body.data.user.role).toBe('customer');
    });
  });

  describe('POST /api/auth/google (Google OAuth Endpoint)', () => {
    it('should reject request when idToken is missing with 400', async () => {
      const res = await request(app).post('/api/auth/google').send({});
      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should reject request when idToken is invalid or expired with 401', async () => {
      const res = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'invalid-fake-google-token-xyz-123' });

      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
      expect(res.body.error).toBe('Token de Google no válido o expirado.');
    });

    it('should preserve existing admin role when signing in via Google', async () => {
      await userRepo.save({
        uid: 'google-admin-uid',
        email: 'google.admin@michimochi.com',
        fullName: 'Google Admin',
        role: 'admin',
        provider: 'google',
        createdAt: '2026-01-01T00:00:00.000Z',
      });

      const res = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'valid-google-admin-id-token' });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('admin');
    });
  });

  describe('Password Recovery Flow (RF02 - OTP Hardened)', () => {
    const testEmail = 'recovery.tester@michimochi.com';

    it('should reject forgot-password with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error).toBe('Validation failed');
    });

    it('should complete OTP recovery, enforce 429 cooldown, reject resetToken as session, and enforce single-use', async () => {
      const forgotRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testEmail });

      expect(forgotRes.status).toBe(200);
      expect(forgotRes.body.data.debugCode).toMatch(/^\d{5}$/);
      const generatedOtp = forgotRes.body.data.debugCode;

      const cooldownRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testEmail });
      expect(cooldownRes.status).toBe(429);

      const invalidFormatRes = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: testEmail, code: '123' });
      expect(invalidFormatRes.status).toBe(400);

      const wrongCodeRes = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: testEmail, code: '00000' });
      expect(wrongCodeRes.status).toBe(400);

      const verifyRes = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: testEmail, code: generatedOtp });
      expect(verifyRes.status).toBe(200);
      const resetToken = verifyRes.body.data.resetToken;

      const meWithResetToken = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${resetToken}`);
      expect(meWithResetToken.status).toBe(401);

      const productWithResetToken = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${resetToken}`)
        .send({ name: 'Hacked', description: 'Should fail', price: 5, category: 'Matcha' });
      expect(productWithResetToken.status).toBe(401);

      const badTokenRes = await request(app)
        .post('/api/auth/reset-password')
        .send({ email: testEmail, resetToken: 'invalid.token', newPassword: 'ValidPassword123!' });
      expect(badTokenRes.status).toBe(401);

      const weakPassRes = await request(app)
        .post('/api/auth/reset-password')
        .send({ email: testEmail, resetToken, newPassword: 'weak' });
      expect(weakPassRes.status).toBe(400);

      const firstReset = await request(app)
        .post('/api/auth/reset-password')
        .send({ email: testEmail, resetToken, newPassword: 'MichiSecure2026!#' });
      expect(firstReset.status).toBe(200);

      const replayReset = await request(app)
        .post('/api/auth/reset-password')
        .send({ email: testEmail, resetToken, newPassword: 'MichiSecure2026!#' });
      expect(replayReset.status).toBe(401);
    });
  });
});
