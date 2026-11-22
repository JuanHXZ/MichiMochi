import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../app.js';
import { ENV } from '../shared/config/env.js';
import { ProductService } from '../modules/catalog/application/services/product.service.js';
import { MemoryProductRepository } from '../modules/catalog/infrastructure/repositories/MemoryProductRepository.js';
import { setProductRepository } from '../modules/catalog/infrastructure/repositories/productRepository.factory.js';
import { MemoryFavoriteRepository } from '../modules/favorites/infrastructure/repositories/MemoryFavoriteRepository.js';
import { setFavoriteRepository } from '../modules/favorites/infrastructure/repositories/favoriteRepository.factory.js';

describe('Favorites API Tests (RF12)', () => {
  const app = createApp();

  const customerToken = jwt.sign(
    {
      uid: 'fav-user-1',
      email: 'fav@michimochi.com',
      fullName: 'Fav User',
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
    setFavoriteRepository(new MemoryFavoriteRepository());
  });

  it('should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/favorites');
    expect(res.status).toBe(401);
  });

  it('should add, list idempotently, and remove favorites', async () => {
    const emptyRes = await request(app).get('/api/favorites').set('Authorization', authHeader);
    expect(emptyRes.status).toBe(200);
    expect(emptyRes.body.data.productIds).toEqual([]);

    const addRes = await request(app).post('/api/favorites/1').set('Authorization', authHeader);
    expect(addRes.status).toBe(200);
    expect(addRes.body.data.productIds).toEqual(['1']);
    expect(addRes.body.data.products).toHaveLength(1);

    // Idempotente
    const dupRes = await request(app).post('/api/favorites/1').set('Authorization', authHeader);
    expect(dupRes.status).toBe(200);
    expect(dupRes.body.data.productIds).toEqual(['1']);

    const delRes = await request(app).delete('/api/favorites/1').set('Authorization', authHeader);
    expect(delRes.status).toBe(200);
    expect(delRes.body.data.productIds).toEqual([]);
  });

  it('should return 404 when adding a non-existent product to favorites', async () => {
    const res = await request(app).post('/api/favorites/non-existent').set('Authorization', authHeader);
    expect(res.status).toBe(404);
  });
});
