import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../app.js';
import { ENV } from '../shared/config/env.js';
import { ProductService } from '../modules/catalog/application/services/product.service.js';
import { MemoryProductRepository } from '../modules/catalog/infrastructure/repositories/MemoryProductRepository.js';
import { setProductRepository } from '../modules/catalog/infrastructure/repositories/productRepository.factory.js';
import { MemoryUserRepository } from '../modules/auth/infrastructure/repositories/MemoryUserRepository.js';
import { setUserRepository } from '../modules/auth/infrastructure/repositories/userRepository.factory.js';
import { MemoryOrderRepository } from '../modules/orders/infrastructure/repositories/MemoryOrderRepository.js';
import { setOrderRepository } from '../modules/orders/infrastructure/repositories/orderRepository.factory.js';

describe('Orders & Simulated Payment/Tracking API Tests', () => {
  const app = createApp();

  const makeToken = (uid: string, role: 'customer' | 'admin', email: string) =>
    jwt.sign(
      {
        uid,
        email,
        fullName: role === 'admin' ? 'Admin Michi' : `Customer ${uid}`,
        provider: 'password',
        role,
        tokenType: 'access',
      },
      ENV.JWT_SECRET,
      { expiresIn: '1h' }
    );

  const customer1Header = `Bearer ${makeToken('cust-1', 'customer', 'cust1@michimochi.com')}`;
  const customer2Header = `Bearer ${makeToken('cust-2', 'customer', 'cust2@michimochi.com')}`;
  const adminHeader = `Bearer ${makeToken('admin-1', 'admin', 'admin@michimochi.com')}`;

  const validOrderPayload = {
    items: [
      { productId: '1', quantity: 2, flavor: 'classic-pink' },
      { productId: '2', quantity: 1 },
    ],
    shippingAddress: {
      fullName: 'Camila Rojas',
      phone: '3001234567',
      address: 'Calle 10 #42-15 Apto 301',
      city: 'Medellín',
      notes: 'Dejar en portería',
    },
    payment: {
      method: 'card',
      cardLast4: '4242',
      cardHolder: 'CAMILA ROJAS',
      simulateOutcome: 'approved',
    },
    currency: 'USD',
  };

  beforeEach(() => {
    setUserRepository(new MemoryUserRepository());
    setProductRepository(new MemoryProductRepository());
    setOrderRepository(new MemoryOrderRepository());
    ProductService.resetToInitial();
  });

  it('should reject unauthenticated requests with 401', async () => {
    const postRes = await request(app).post('/api/orders').send(validOrderPayload);
    expect(postRes.status).toBe(401);

    const listRes = await request(app).get('/api/orders');
    expect(listRes.status).toBe(401);

    const getRes = await request(app).get('/api/orders/ord_missing');
    expect(getRes.status).toBe(401);

    const advRes = await request(app).post('/api/orders/ord_missing/simulate-advance');
    expect(advRes.status).toBe(401);

    const cancelRes = await request(app).post('/api/orders/ord_missing/cancel');
    expect(cancelRes.status).toBe(401);
  });

  it('should create an order with server-computed totals, APPROVED simulated payment, RECEIVED status, and decrement stock', async () => {
    const productBefore = await ProductService.getById('1');
    const stockBefore = productBefore.stock ?? 0;

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', customer1Header)
      .send(validOrderPayload);

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);

    const order = res.body.data;
    expect(order).toHaveProperty('id');
    expect(order.orderNumber).toMatch(/^MM-[A-Z0-9]{6}$/);
    expect(order.status).toBe('RECEIVED');
    expect(order.statusHistory).toHaveLength(1);
    expect(order.statusHistory[0].status).toBe('RECEIVED');
    expect(order.payment.simulated).toBe(true);
    expect(order.payment.status).toBe('APPROVED');
    expect(order.payment.cardLast4).toBe('4242');

    // Product 1: 4.25 * 2 = 8.50; Product 2: 4.50 * 1 = 4.50 -> subtotal = 13.00
    // shipping = 2.99, tax = round2(13.00 * 0.06) = 0.78 -> total = 16.77
    expect(order.subtotal).toBe(13);
    expect(order.shipping).toBe(2.99);
    expect(order.tax).toBe(0.78);
    expect(order.total).toBe(16.77);

    const productAfter = await ProductService.getById('1');
    expect(productAfter.stock).toBe(stockBefore - 2);
  });

  it('should reject declined simulated payment with 400 without modifying product stock', async () => {
    const productBefore = await ProductService.getById('1');
    const stockBefore = productBefore.stock ?? 0;

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', customer1Header)
      .send({
        ...validOrderPayload,
        payment: {
          ...validOrderPayload.payment,
          simulateOutcome: 'declined',
        },
      });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);

    const productAfter = await ProductService.getById('1');
    expect(productAfter.stock).toBe(stockBefore);
  });

  it('should reject order when requested quantity exceeds product stock', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', customer1Header)
      .send({
        ...validOrderPayload,
        items: [{ productId: '1', quantity: 99 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('should enforce ownership so another customer receives 403 while admin can access', async () => {
    const createRes = await request(app)
      .post('/api/orders')
      .set('Authorization', customer1Header)
      .send(validOrderPayload);
    const orderId = createRes.body.data.id;

    const otherGet = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', customer2Header);
    expect(otherGet.status).toBe(403);

    const otherAdv = await request(app)
      .post(`/api/orders/${orderId}/simulate-advance`)
      .set('Authorization', customer2Header);
    expect(otherAdv.status).toBe(403);

    const otherCancel = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .set('Authorization', customer2Header);
    expect(otherCancel.status).toBe(403);

    const adminGet = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', adminHeader);
    expect(adminGet.status).toBe(200);
    expect(adminGet.body.data.id).toBe(orderId);
  });

  it('should simulate full tracking lifecycle RECEIVED -> PREPARING -> SHIPPED -> DELIVERED and reject advancing past DELIVERED', async () => {
    const createRes = await request(app)
      .post('/api/orders')
      .set('Authorization', customer1Header)
      .send(validOrderPayload);
    const orderId = createRes.body.data.id;

    const step1 = await request(app)
      .post(`/api/orders/${orderId}/simulate-advance`)
      .set('Authorization', customer1Header);
    expect(step1.status).toBe(200);
    expect(step1.body.data.status).toBe('PREPARING');
    expect(step1.body.data.statusHistory).toHaveLength(2);

    const step2 = await request(app)
      .post(`/api/orders/${orderId}/simulate-advance`)
      .set('Authorization', customer1Header);
    expect(step2.status).toBe(200);
    expect(step2.body.data.status).toBe('SHIPPED');
    expect(step2.body.data.statusHistory).toHaveLength(3);

    const step3 = await request(app)
      .post(`/api/orders/${orderId}/simulate-advance`)
      .set('Authorization', customer1Header);
    expect(step3.status).toBe(200);
    expect(step3.body.data.status).toBe('DELIVERED');
    expect(step3.body.data.statusHistory).toHaveLength(4);

    const step4 = await request(app)
      .post(`/api/orders/${orderId}/simulate-advance`)
      .set('Authorization', customer1Header);
    expect(step4.status).toBe(400);
  });

  it('should cancel order in PREPARING and restore stock, but reject cancellation once SHIPPED', async () => {
    const productBefore = await ProductService.getById('1');
    const stockBefore = productBefore.stock ?? 0;

    const createRes = await request(app)
      .post('/api/orders')
      .set('Authorization', customer1Header)
      .send(validOrderPayload);
    const orderId = createRes.body.data.id;

    const prepRes = await request(app)
      .post(`/api/orders/${orderId}/simulate-advance`)
      .set('Authorization', customer1Header);
    expect(prepRes.body.data.status).toBe('PREPARING');

    const cancelRes = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .set('Authorization', customer1Header);
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe('CANCELLED');

    const productAfterCancel = await ProductService.getById('1');
    expect(productAfterCancel.stock).toBe(stockBefore);

    // Create second order and advance to SHIPPED
    const secondRes = await request(app)
      .post('/api/orders')
      .set('Authorization', customer1Header)
      .send(validOrderPayload);
    const secondId = secondRes.body.data.id;

    await request(app)
      .post(`/api/orders/${secondId}/simulate-advance`)
      .set('Authorization', customer1Header);
    await request(app)
      .post(`/api/orders/${secondId}/simulate-advance`)
      .set('Authorization', customer1Header);

    const rejectCancel = await request(app)
      .post(`/api/orders/${secondId}/cancel`)
      .set('Authorization', customer1Header);
    expect(rejectCancel.status).toBe(400);
  });

  it('should allow admin to override status via PATCH and reject customer with 403', async () => {
    const createRes = await request(app)
      .post('/api/orders')
      .set('Authorization', customer1Header)
      .send(validOrderPayload);
    const orderId = createRes.body.data.id;

    const custPatch = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', customer1Header)
      .send({ status: 'SHIPPED' });
    expect(custPatch.status).toBe(403);

    const adminPatch = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', adminHeader)
      .send({ status: 'SHIPPED', note: 'Despachado prioritario' });
    expect(adminPatch.status).toBe(200);
    expect(adminPatch.body.data.status).toBe('SHIPPED');
    expect(adminPatch.body.data.statusHistory.at(-1).description).toBe('Despachado prioritario');
  });
});
