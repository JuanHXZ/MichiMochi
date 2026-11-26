import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../app.js';
import { ENV } from '../shared/config/env.js';
import { CategoryService } from '../modules/catalog/application/services/category.service.js';
import { ProductService } from '../modules/catalog/application/services/product.service.js';
import { MemoryCategoryRepository } from '../modules/catalog/infrastructure/repositories/MemoryCategoryRepository.js';
import { setCategoryRepository } from '../modules/catalog/infrastructure/repositories/categoryRepository.factory.js';
import { MemoryProductRepository } from '../modules/catalog/infrastructure/repositories/MemoryProductRepository.js';
import { setProductRepository } from '../modules/catalog/infrastructure/repositories/productRepository.factory.js';
import { MemoryUserRepository } from '../modules/auth/infrastructure/repositories/MemoryUserRepository.js';
import { setUserRepository } from '../modules/auth/infrastructure/repositories/userRepository.factory.js';

describe('Catalog Categories CRUD & RBAC API Tests', () => {
  const app = createApp();

  const adminToken = jwt.sign(
    {
      uid: 'test-admin-cat-1',
      email: 'admin@michimochi.com',
      fullName: 'Michi Admin',
      provider: 'password',
      role: 'admin',
      tokenType: 'access',
    },
    ENV.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const customerToken = jwt.sign(
    {
      uid: 'test-customer-cat-2',
      email: 'customer@michimochi.com',
      fullName: 'Michi Customer',
      provider: 'password',
      role: 'customer',
      tokenType: 'access',
    },
    ENV.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const adminAuth = `Bearer ${adminToken}`;
  const customerAuth = `Bearer ${customerToken}`;

  beforeEach(() => {
    setUserRepository(new MemoryUserRepository());
    setProductRepository(new MemoryProductRepository());
    setCategoryRepository(new MemoryCategoryRepository());
    ProductService.resetToInitial();
    CategoryService.resetToInitial();
  });

  it('should allow public GET /api/categories and filter by visible=true', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.length).toBe(5);

    await request(app)
      .put('/api/categories/cat_special')
      .set('Authorization', adminAuth)
      .send({ visible: false });

    const visibleRes = await request(app).get('/api/categories?visible=true');
    expect(visibleRes.status).toBe(200);
    expect(visibleRes.body.data.some((c: any) => c.id === 'cat_special')).toBe(false);
    expect(visibleRes.body.data.length).toBe(4);
  });

  it('should enforce RBAC on POST, PUT, DELETE /api/categories', async () => {
    const unauth = await request(app).post('/api/categories').send({ name: 'Taro' });
    expect(unauth.status).toBe(401);

    const custPost = await request(app)
      .post('/api/categories')
      .set('Authorization', customerAuth)
      .send({ name: 'Taro' });
    expect(custPost.status).toBe(403);

    const custPut = await request(app)
      .put('/api/categories/cat_mango')
      .set('Authorization', customerAuth)
      .send({ visible: false });
    expect(custPut.status).toBe(403);

    const custDel = await request(app)
      .delete('/api/categories/cat_special')
      .set('Authorization', customerAuth);
    expect(custDel.status).toBe(403);
  });

  it('should create a new category and reject duplicate names with 409', async () => {
    const createRes = await request(app)
      .post('/api/categories')
      .set('Authorization', adminAuth)
      .send({ name: 'Taro', description: 'Sweet purple taro mochi', icon: '🍠', visible: true });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.name).toBe('Taro');

    const dupRes = await request(app)
      .post('/api/categories')
      .set('Authorization', adminAuth)
      .send({ name: 'taro' });

    expect(dupRes.status).toBe(409);

    const invalidIconRes = await request(app)
      .post('/api/categories')
      .set('Authorization', adminAuth)
      .send({ name: 'Invalid Icon Cat', icon: '123' });

    expect(invalidIconRes.status).toBe(400);
  });

  it('should propagate renamed category to associated products', async () => {
    const updateRes = await request(app)
      .put('/api/categories/cat_mango')
      .set('Authorization', adminAuth)
      .send({ name: 'Tropical Mango' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.name).toBe('Tropical Mango');

    const productRes = await request(app).get('/api/products/2');
    expect(productRes.status).toBe(200);
    expect(productRes.body.data.category).toBe('Tropical Mango');
  });

  it('should block deleting a category with associated products (409) and allow deleting unused ones', async () => {
    const blockedRes = await request(app)
      .delete('/api/categories/cat_strawberry')
      .set('Authorization', adminAuth);

    expect(blockedRes.status).toBe(409);

    const allowedRes = await request(app)
      .delete('/api/categories/cat_special')
      .set('Authorization', adminAuth);

    expect(allowedRes.status).toBe(200);
    expect(allowedRes.body.ok).toBe(true);
  });
});
