import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../app.js';
import { ENV } from '../shared/config/env.js';
import { MemoryPromoCodeRepository } from '../modules/promotions/infrastructure/repositories/MemoryPromoCodeRepository.js';
import { setPromoCodeRepository } from '../modules/promotions/infrastructure/repositories/promoCodeRepository.factory.js';
import { MemoryUserRepository } from '../modules/auth/infrastructure/repositories/MemoryUserRepository.js';
import { setUserRepository } from '../modules/auth/infrastructure/repositories/userRepository.factory.js';

describe('Promotions & Admin Coupon CRUD API Tests (RF14)', () => {
  const app = createApp();

  const adminToken = jwt.sign(
    {
      uid: 'promo-admin-1',
      email: 'admin@michimochi.com',
      fullName: 'Promo Admin',
      provider: 'password',
      role: 'admin',
      tokenType: 'access',
    },
    ENV.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const customerToken = jwt.sign(
    {
      uid: 'promo-customer-1',
      email: 'customer@michimochi.com',
      fullName: 'Promo Customer',
      provider: 'password',
      role: 'customer',
      tokenType: 'access',
    },
    ENV.JWT_SECRET,
    { expiresIn: '1h' }
  );

  beforeEach(() => {
    setUserRepository(new MemoryUserRepository());
    setPromoCodeRepository(new MemoryPromoCodeRepository());
  });

  describe('POST /api/promotions/validate', () => {
    it('should validate seeded coupons MICHI10, DULCE5 and BIENVENIDA with caps and minimums', async () => {
      const michiRes = await request(app)
        .post('/api/promotions/validate')
        .send({ code: 'michi10', subtotal: 20 });
      expect(michiRes.status).toBe(200);
      expect(michiRes.body.data.discountAmount).toBe(2);

      const dulceFail = await request(app)
        .post('/api/promotions/validate')
        .send({ code: 'DULCE5', subtotal: 10 });
      expect(dulceFail.status).toBe(400);

      const dulceOk = await request(app)
        .post('/api/promotions/validate')
        .send({ code: 'DULCE5', subtotal: 18 });
      expect(dulceOk.status).toBe(200);
      expect(dulceOk.body.data.discountAmount).toBe(5);

      const capRes = await request(app)
        .post('/api/promotions/validate')
        .send({ code: 'BIENVENIDA', subtotal: 100 });
      expect(capRes.status).toBe(200);
      expect(capRes.body.data.discountAmount).toBe(6);
    });

    it('should return 404 for unknown coupon code', async () => {
      const res = await request(app)
        .post('/api/promotions/validate')
        .send({ code: 'NOEXISTE', subtotal: 25 });
      expect(res.status).toBe(404);
    });
  });

  describe('Admin Coupon CRUD (/api/promotions)', () => {
    it('should deny CRUD access to customer role with 403', async () => {
      const listRes = await request(app)
        .get('/api/promotions')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(listRes.status).toBe(403);

      const createRes = await request(app)
        .post('/api/promotions')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          code: 'HACK20',
          description: 'Intento no autorizado',
          discountType: 'PERCENT',
          discountValue: 20,
        });
      expect(createRes.status).toBe(403);
    });

    it('should allow admin to list, create, update, toggle active and delete coupons', async () => {
      const listRes = await request(app)
        .get('/api/promotions')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBeGreaterThanOrEqual(3);

      const createRes = await request(app)
        .post('/api/promotions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'verano20',
          description: '20% verano',
          discountType: 'PERCENT',
          discountValue: 20,
          minSubtotal: 10,
          maxDiscount: 8,
        });
      expect(createRes.status).toBe(201);
      expect(createRes.body.data.code).toBe('VERANO20');

      const updateRes = await request(app)
        .put('/api/promotions/VERANO20')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ active: false });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.active).toBe(false);

      const inactiveValidate = await request(app)
        .post('/api/promotions/validate')
        .send({ code: 'VERANO20', subtotal: 25 });
      expect(inactiveValidate.status).toBe(400);

      const deleteRes = await request(app)
        .delete('/api/promotions/VERANO20')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(deleteRes.status).toBe(200);
    });
  });
});
