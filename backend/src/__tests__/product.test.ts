import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../app.js';
import { ENV } from '../shared/config/env.js';
import { ProductService } from '../modules/catalog/application/services/product.service.js';
import { MemoryProductRepository } from '../modules/catalog/infrastructure/repositories/MemoryProductRepository.js';
import { setProductRepository } from '../modules/catalog/infrastructure/repositories/productRepository.factory.js';
import { MemoryUserRepository } from '../modules/auth/infrastructure/repositories/MemoryUserRepository.js';
import { setUserRepository } from '../modules/auth/infrastructure/repositories/userRepository.factory.js';
import { S3StorageService } from '../shared/services/storage/s3Storage.service.js';

describe('Product Catalog CRUD & RBAC API Tests', () => {
  const app = createApp();

  const adminToken = jwt.sign(
    {
      uid: 'test-admin-uid-123',
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
      uid: 'test-customer-uid-456',
      email: 'customer@michimochi.com',
      fullName: 'Michi Customer',
      provider: 'password',
      role: 'customer',
      tokenType: 'access',
    },
    ENV.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const adminAuthHeader = `Bearer ${adminToken}`;
  const customerAuthHeader = `Bearer ${customerToken}`;

  beforeEach(() => {
    setUserRepository(new MemoryUserRepository());
    setProductRepository(new MemoryProductRepository());
    ProductService.resetToInitial();
  });

  describe('Public Read & Role-Based Write Access (P0.1 & P0.5)', () => {
    it('should allow public GET /api/products without Authorization header', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.total).toBeGreaterThanOrEqual(4);
    });

    it('should allow public GET /api/products/:id without Authorization header', async () => {
      const res = await request(app).get('/api/products/1');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('id', '1');
    });

    it('should reject POST /api/products without token with 401', async () => {
      const res = await request(app).post('/api/products').send({ name: 'Test' });
      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
    });

    it('should reject POST, PUT, DELETE /api/products for customer role with 403', async () => {
      const postRes = await request(app)
        .post('/api/products')
        .set('Authorization', customerAuthHeader)
        .send({
          name: 'Unauthorized Mochi',
          description: 'Customer should not create',
          price: 4.5,
          category: 'Matcha',
        });
      expect(postRes.status).toBe(403);

      const putRes = await request(app)
        .put('/api/products/1')
        .set('Authorization', customerAuthHeader)
        .send({ price: 9.99 });
      expect(putRes.status).toBe(403);

      const delRes = await request(app)
        .delete('/api/products/1')
        .set('Authorization', customerAuthHeader);
      expect(delRes.status).toBe(403);
    });

    it('should reject POST /api/products with invalid token with 401', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', 'Bearer invalid-token-xyz')
        .send({ name: 'Test' });

      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
    });
  });

  describe('GET /api/products (List & Filters)', () => {
    it('should filter products by category', async () => {
      const res = await request(app).get('/api/products?category=Matcha');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].category).toBe('Matcha');
    });

    it('should filter products by search keyword', async () => {
      const res = await request(app).get('/api/products?search=strawberry');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].name).toContain('Strawberry');
    });
  });

  describe('GET /api/products/:id (Get by ID)', () => {
    it('should return 404 for a non-existent product ID', async () => {
      const res = await request(app).get('/api/products/non-existent-id-9999');
      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
      expect(res.body.error).toContain('no encontrado');
    });
  });

  describe('POST /api/products (Admin Create)', () => {
    it('should reject creation with 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', adminAuthHeader)
        .send({ description: 'Solo descripcion' });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.details.length).toBeGreaterThan(0);
    });

    it('should reject creation with 400 when price is zero or negative', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', adminAuthHeader)
        .send({
          name: 'Free Mochi',
          description: 'Mochi sin costo',
          price: -5.0,
          category: 'Special',
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it('should successfully create a new product with 201 Created for admin', async () => {
      const newProductPayload = {
        name: 'Black Sesame Supreme',
        shortName: 'Black Sesame',
        description: 'Roasted black sesame paste wrapped in delicate mochi',
        price: 4.6,
        category: 'Sesame',
        stock: 20,
        featured: true,
        ingredients: ['Black sesame', 'Sweet rice flour', 'Sugar'],
        allergens: ['Sesame'],
      };

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', adminAuthHeader)
        .send(newProductPayload);

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveProperty('id');

      const getRes = await request(app).get(`/api/products/${res.body.data.id}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.data.name).toBe(newProductPayload.name);
    });

    it('should clear featured flag on previously featured product when creating a new featured product', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', adminAuthHeader)
        .send({
          name: 'Yuzu Blossom Mochi',
          description: 'Bright Japanese yuzu citrus ganache in soft mochi',
          price: 5.0,
          category: 'Special',
          featured: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.featured).toBe(true);

      const previousFeatured = await request(app).get('/api/products/1');
      expect(previousFeatured.status).toBe(200);
      expect(previousFeatured.body.data.featured).toBe(false);
    });

    it('should reject creation with 409 Conflict when product name already exists', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', adminAuthHeader)
        .send({
          name: 'strawberry dream mochi',
          description: 'Intento de crear producto duplicado',
          price: 4.5,
          category: 'Strawberry',
        });

      expect(res.status).toBe(409);
      expect(res.body.ok).toBe(false);
    });
  });

  describe('PUT /api/products/:id (Admin Update)', () => {
    it('should update an existing product with 200 OK', async () => {
      const updatePayload = {
        name: 'Strawberry Dream Mochi — Edición Especial',
        price: 4.95,
        stock: 50,
      };

      const res = await request(app)
        .put('/api/products/1')
        .set('Authorization', adminAuthHeader)
        .send(updatePayload);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe(updatePayload.name);
      expect(res.body.data.price).toBe(4.95);
      expect(res.body.data.stock).toBe(50);
    });

    it('should make featured exclusive when activating featured on another product', async () => {
      const res = await request(app)
        .put('/api/products/2')
        .set('Authorization', adminAuthHeader)
        .send({ featured: true });

      expect(res.status).toBe(200);
      expect(res.body.data.featured).toBe(true);

      const prevRes = await request(app).get('/api/products/1');
      expect(prevRes.status).toBe(200);
      expect(prevRes.body.data.featured).toBe(false);
    });

    it('should persist edited name, description, and longDescription on an existing product', async () => {
      const updatePayload = {
        name: 'Mango Tropical Premium',
        description: 'Mango maduro con crema fresca de coco artesanal',
        longDescription: 'Elaborado diariamente con pulpa de mango fresco y relleno cremoso.',
      };

      const res = await request(app)
        .put('/api/products/2')
        .set('Authorization', adminAuthHeader)
        .send(updatePayload);

      expect(res.status).toBe(200);

      const listRes = await request(app).get('/api/products');
      expect(listRes.status).toBe(200);
      const updatedFromList = listRes.body.data.find((p: any) => p.id === '2');
      expect(updatedFromList).toBeDefined();
      expect(updatedFromList.name).toBe(updatePayload.name);
      expect(updatedFromList.description).toBe(updatePayload.description);
      expect(updatedFromList.longDescription).toBe(updatePayload.longDescription);

      const byIdRes = await request(app).get('/api/products/2');
      expect(byIdRes.status).toBe(200);
      expect(byIdRes.body.data.name).toBe(updatePayload.name);
      expect(byIdRes.body.data.description).toBe(updatePayload.description);
      expect(byIdRes.body.data.longDescription).toBe(updatePayload.longDescription);
    });

    it('should return 404 when attempting to update a non-existent product', async () => {
      const res = await request(app)
        .put('/api/products/non-existent-id-8888')
        .set('Authorization', adminAuthHeader)
        .send({ price: 10.0 });

      expect(res.status).toBe(404);
    });

    it('should reject update with 409 Conflict when name collides with another product', async () => {
      const res = await request(app)
        .put('/api/products/2')
        .set('Authorization', adminAuthHeader)
        .send({ name: 'Strawberry Dream Mochi' });

      expect(res.status).toBe(409);
    });
  });

  describe('DELETE /api/products/:id (Admin Delete)', () => {
    it('should delete an existing product with 200 OK', async () => {
      const res = await request(app)
        .delete('/api/products/2')
        .set('Authorization', adminAuthHeader);

      expect(res.status).toBe(200);
      const checkRes = await request(app).get('/api/products/2');
      expect(checkRes.status).toBe(404);
    });

    it('should return 404 when attempting to delete a non-existent product', async () => {
      const res = await request(app)
        .delete('/api/products/already-deleted-or-invalid')
        .set('Authorization', adminAuthHeader);

      expect(res.status).toBe(404);
    });
  });

  describe('Scalar OpenAPI Documentation Verification', () => {
    it('should have product endpoints and schemas declared in openapi.json', async () => {
      const res = await request(app).get('/docs/openapi.json');
      expect(res.status).toBe(200);
      expect(res.body.paths).toHaveProperty('/api/products');
      expect(res.body.paths).toHaveProperty('/api/products/upload-images');
      expect(res.body.paths).toHaveProperty('/api/products/{id}');
      expect(res.body.components.schemas).toHaveProperty('Product');
    });
  });

  describe('POST /api/products/upload-images (S3 Upload RBAC & Validation)', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should reject upload without token (401) and for customer role (403)', async () => {
      const noAuthRes = await request(app).post('/api/products/upload-images');
      expect(noAuthRes.status).toBe(401);

      const customerRes = await request(app)
        .post('/api/products/upload-images')
        .set('Authorization', customerAuthHeader);
      expect(customerRes.status).toBe(403);
    });

    it('should reject unsupported file MIME types with 400', async () => {
      const res = await request(app)
        .post('/api/products/upload-images')
        .set('Authorization', adminAuthHeader)
        .attach('images', Buffer.from('not an image'), {
          filename: 'script.txt',
          contentType: 'text/plain',
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it('should allow admin to upload multiple valid images and return S3 URLs', async () => {
      const spy = jest
        .spyOn(S3StorageService, 'uploadProductImages')
        .mockResolvedValueOnce([
          'https://michimochi-catalog-media-adso.s3.us-east-1.amazonaws.com/products/1.png',
          'https://michimochi-catalog-media-adso.s3.us-east-1.amazonaws.com/products/2.jpg',
        ]);

      const res = await request(app)
        .post('/api/products/upload-images')
        .set('Authorization', adminAuthHeader)
        .attach('images', Buffer.from('fake-png'), {
          filename: 'mochi1.png',
          contentType: 'image/png',
        })
        .attach('images', Buffer.from('fake-jpg'), {
          filename: 'mochi2.jpg',
          contentType: 'image/jpeg',
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.urls).toHaveLength(2);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
