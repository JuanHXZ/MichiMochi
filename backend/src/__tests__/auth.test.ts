import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../app.js';
import { ENV } from '../config/env.js';

describe('Backend API Tests', () => {
  const app = createApp();

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

  describe('POST /api/auth/register (Validation)', () => {
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
  });

  describe('POST /api/auth/login (Validation & Integration)', () => {
    it('should reject login without required fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    const testUser = {
      fullName: 'Juan Henao Test',
      email: `test_henao_${Date.now()}@michimochi.com`,
      password: 'TestPassword2026*',
      acceptedTerms: true,
    };

    it('should authenticate valid credentials and issue JWT token', async () => {
      // Registrar usuario para prueba
      const regRes = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(regRes.status).toBe(201);
      expect(regRes.body.ok).toBe(true);

      // Iniciar sesión con las credenciales
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data).toHaveProperty('tokens');
      expect(res.body.data.tokens).toHaveProperty('accessToken');
    }, 15000);

    it('should reject incorrect password with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword123',
        });

      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
      expect(res.body.error).toBe('Correo o contraseña incorrectos.');
    }, 15000);
  });

  describe('GET /api/auth/me (Current User Profile)', () => {
    it('should reject requests without token with 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
    });

    it('should return user profile when authenticated with token from login', async () => {
      const email = `test_me_${Date.now()}@michimochi.com`;
      const password = 'TestMePassword2026*';

      // 1. Registrar
      await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Juan Me Test',
          email,
          password,
          acceptedTerms: true,
        });

      // 2. Iniciar sesión
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email,
          password,
        });

      expect(loginRes.status).toBe(200);
      const token = loginRes.body.data.tokens.accessToken;

      // 3. Consultar perfil en /api/auth/me
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.ok).toBe(true);
      expect(meRes.body.data).toHaveProperty('user');
      expect(meRes.body.data.user.email).toBe(email);
      expect(meRes.body.data.user.fullName).toBe('Juan Me Test');
    }, 20000);

    it('should return user profile even if retrieved via valid standalone JWT token', async () => {
      const standaloneToken = jwt.sign(
        {
          uid: 'standalone-uid-999',
          email: 'standalone@michimochi.com',
          fullName: 'Standalone User',
          provider: 'password',
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
      expect(meRes.body.data.user.email).toBe('standalone@michimochi.com');
      expect(meRes.body.data.user.fullName).toBe('Standalone User');
    });
  });
});
