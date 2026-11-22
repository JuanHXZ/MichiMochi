import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../app.js';
import { ENV } from '../shared/config/env.js';
import { ProductService } from '../modules/catalog/application/services/product.service.js';
import { MemoryProductRepository } from '../modules/catalog/infrastructure/repositories/MemoryProductRepository.js';
import { setProductRepository } from '../modules/catalog/infrastructure/repositories/productRepository.factory.js';
import { MemoryOrderRepository } from '../modules/orders/infrastructure/repositories/MemoryOrderRepository.js';
import { setOrderRepository } from '../modules/orders/infrastructure/repositories/orderRepository.factory.js';
import { MemoryPromoCodeRepository } from '../modules/promotions/infrastructure/repositories/MemoryPromoCodeRepository.js';
import { setPromoCodeRepository } from '../modules/promotions/infrastructure/repositories/promoCodeRepository.factory.js';
import { MemoryRewardRepository } from '../modules/rewards/infrastructure/repositories/MemoryRewardRepository.js';
import { setRewardRepository } from '../modules/rewards/infrastructure/repositories/rewardRepository.factory.js';

describe('Rewards & Order Loyalty Flow Tests (RF13 + RF14)', () => {
  const app = createApp();
  let rewardRepo: MemoryRewardRepository;

  const customerToken = jwt.sign(
    {
      uid: 'reward-user-1',
      email: 'loyal@michimochi.com',
      fullName: 'Loyal User',
      provider: 'password',
      role: 'customer',
      tokenType: 'access',
    },
    ENV.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const authHeader = `Bearer ${customerToken}`;

  beforeEach(() => {
    setProductRepository(new MemoryProductRepository());
    ProductService.resetToInitial();
    setOrderRepository(new MemoryOrderRepository());
    setPromoCodeRepository(new MemoryPromoCodeRepository());
    rewardRepo = new MemoryRewardRepository();
    setRewardRepository(rewardRepo);
  });

  it('should earn points upon order creation, redeem a reward coupon, and apply it to next order', async () => {
    const initialSummary = await request(app).get('/api/rewards/me').set('Authorization', authHeader);
    expect(initialSummary.status).toBe(200);
    expect(initialSummary.body.data.points).toBe(0);

    // Intento de canje sin puntos -> 400
    const failRedeem = await request(app)
      .post('/api/rewards/redeem')
      .set('Authorization', authHeader)
      .send({ rewardId: 'reward_3usd' });
    expect(failRedeem.status).toBe(400);

    // Crear orden por 12 unidades de Strawberry Dream ($4.25 * 12 = $51.00 -> 510 pts)
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', authHeader)
      .send({
        items: [{ productId: '1', quantity: 12 }],
        shippingAddress: {
          fullName: 'Loyal User',
          phone: '3001234567',
          address: 'Calle 10 #20-30',
          city: 'Medellín',
        },
        payment: { method: 'card', cardLast4: '4242', simulateOutcome: 'approved' },
        promoCode: 'MICHI10',
      });

    expect(orderRes.status).toBe(201);
    expect(orderRes.body.data.promoCode).toBe('MICHI10');
    expect(orderRes.body.data.discountAmount).toBe(5.1);

    // Verificar puntos acreditados (510 pts -> nivel Mochi Lover)
    const afterOrder = await request(app).get('/api/rewards/me').set('Authorization', authHeader);
    expect(afterOrder.status).toBe(200);
    expect(afterOrder.body.data.points).toBe(510);
    expect(afterOrder.body.data.tier.name).toBe('Mochi Lover');

    // Canjear cupón de 500 pts ($3.00 USD)
    const redeemRes = await request(app)
      .post('/api/rewards/redeem')
      .set('Authorization', authHeader)
      .send({ rewardId: 'reward_3usd' });

    expect(redeemRes.status).toBe(200);
    const rewardCoupon = redeemRes.body.data.promo.code;
    expect(rewardCoupon).toMatch(/^REWARD-/);
    expect(redeemRes.body.data.summary.points).toBe(10);

    // Usar el cupón personal en un segundo pedido (2 unidades = $8.50 >= $8.00 minSubtotal)
    const secondOrder = await request(app)
      .post('/api/orders')
      .set('Authorization', authHeader)
      .send({
        items: [{ productId: '1', quantity: 2 }],
        shippingAddress: {
          fullName: 'Loyal User',
          phone: '3001234567',
          address: 'Calle 10 #20-30',
          city: 'Medellín',
        },
        payment: { method: 'nequi', simulateOutcome: 'approved' },
        promoCode: rewardCoupon,
      });

    expect(secondOrder.status).toBe(201);
    expect(secondOrder.body.data.promoCode).toBe(rewardCoupon);
    expect(secondOrder.body.data.discountAmount).toBe(3);

    // Reintentar el mismo cupón de 1 solo uso debe fallar
    const reuseRes = await request(app)
      .post('/api/promotions/validate')
      .set('Authorization', authHeader)
      .send({ code: rewardCoupon, subtotal: 20 });
    expect(reuseRes.status).toBe(400);
  });
});
