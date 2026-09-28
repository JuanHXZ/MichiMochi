import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../app.js';
import { ENV } from '../shared/config/env.js';
import { ProductService } from '../modules/catalog/application/services/product.service.js';

describe('Product Catalog CRUD API Tests', () => {
  const app = createApp();

  // Generamos un token JWT válido para las pruebas
  const validToken = jwt.sign(
    {
      uid: 'test-admin-uid-123',
      email: 'admin@michimochi.com',
      fullName: 'Michi Admin',
      provider: 'password',
    },
    ENV.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const authHeader = `Bearer ${validToken}`;

  beforeEach(() => {
    ProductService.resetToInitial();
  });

  describe('Authentication & Authorization (Token Requirement)', () => {
    it('should reject GET /api/products without Authorization header with 401', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
      expect(res.body.error).toContain('Authorization header missing');
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
    it('should return 200 and all initial products when authenticated', async () => {
      const res = await request(app)
        .get('/api/products')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.total).toBeGreaterThanOrEqual(3);
    });

    it('should filter products by category', async () => {
      const res = await request(app)
        .get('/api/products?category=Matcha')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].category).toBe('Matcha');
    });

    it('should filter products by search keyword', async () => {
      const res = await request(app)
        .get('/api/products?search=strawberry')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].name).toContain('Strawberry');
    });
  });

  describe('GET /api/products/:id (Get by ID)', () => {
    it('should return 200 and product details for an existing ID', async () => {
      const res = await request(app)
        .get('/api/products/1')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveProperty('id', '1');
      expect(res.body.data).toHaveProperty('name', 'Strawberry Dream Mochi');
      expect(res.body.data).toHaveProperty('price', 4.25);
    });

    it('should return 404 for a non-existent product ID', async () => {
      const res = await request(app)
        .get('/api/products/non-existent-id-9999')
        .set('Authorization', authHeader);

      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
      expect(res.body.error).toContain('no encontrado');
    });
  });

  describe('POST /api/products (Create)', () => {
    it('should reject creation with 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', authHeader)
        .send({
          description: 'Solo descripcion',
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body).toHaveProperty('details');
      expect(res.body.details.length).toBeGreaterThan(0);
    });

    it('should reject creation with 400 when price is zero or negative', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', authHeader)
        .send({
          name: 'Free Mochi',
          description: 'Mochi sin costo',
          price: -5.0,
          category: 'Special',
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it('should successfully create a new product with 201 Created', async () => {
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
        .set('Authorization', authHeader)
        .send(newProductPayload);

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.message).toContain('creado exitosamente');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe(newProductPayload.name);
      expect(res.body.data.price).toBe(4.6);
      expect(res.body.data.inStock).toBe(true);
      expect(res.body.data).toHaveProperty('createdAt');

      // Verificar que ahora se puede consultar por su nuevo ID
      const createdId = res.body.data.id;
      const getRes = await request(app)
        .get(`/api/products/${createdId}`)
        .set('Authorization', authHeader);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.name).toBe(newProductPayload.name);
    });

    it('should reject creation with 409 Conflict when product name already exists', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', authHeader)
        .send({
          name: 'strawberry dream mochi', // Nombre existente con diferente casing
          description: 'Intento de crear producto duplicado',
          price: 4.5,
          category: 'Strawberry',
        });

      expect(res.status).toBe(409);
      expect(res.body.ok).toBe(false);
      expect(res.body.error).toContain('Ya existe un producto con el nombre');
    });
  });

  describe('PUT /api/products/:id (Update)', () => {
    it('should update an existing product with 200 OK', async () => {
      const updatePayload = {
        name: 'Strawberry Dream Mochi — Edición Especial',
        price: 4.95,
        stock: 50,
      };

      const res = await request(app)
        .put('/api/products/1')
        .set('Authorization', authHeader)
        .send(updatePayload);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.message).toContain('actualizado exitosamente');
      expect(res.body.data.name).toBe(updatePayload.name);
      expect(res.body.data.price).toBe(4.95);
      expect(res.body.data.stock).toBe(50);
      expect(res.body.data.category).toBe('Strawberry'); // Preserva campos previos
    });

    it('should return 404 when attempting to update a non-existent product', async () => {
      const res = await request(app)
        .put('/api/products/non-existent-id-8888')
        .set('Authorization', authHeader)
        .send({ price: 10.0 });

      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
    });

    it('should reject update with 409 Conflict when name collides with another product', async () => {
      const res = await request(app)
        .put('/api/products/2')
        .set('Authorization', authHeader)
        .send({ name: 'Strawberry Dream Mochi' });

      expect(res.status).toBe(409);
      expect(res.body.ok).toBe(false);
      expect(res.body.error).toContain('Ya existe otro producto con el nombre');
    });
  });

  describe('DELETE /api/products/:id (Delete)', () => {
    it('should delete an existing product with 200 OK', async () => {
      const res = await request(app)
        .delete('/api/products/2')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.message).toContain('eliminado exitosamente');

      // Confirmar que ya no existe (404)
      const checkRes = await request(app)
        .get('/api/products/2')
        .set('Authorization', authHeader);

      expect(checkRes.status).toBe(404);
    });

    it('should return 404 when attempting to delete a non-existent product', async () => {
      const res = await request(app)
        .delete('/api/products/already-deleted-or-invalid')
        .set('Authorization', authHeader);

      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
    });
  });

  describe('Scalar OpenAPI Documentation Verification', () => {
    it('should have product endpoints and schemas declared in openapi.json', async () => {
      const res = await request(app).get('/docs/openapi.json');
      expect(res.status).toBe(200);

      const paths = res.body.paths;
      expect(paths).toHaveProperty('/api/products');
      expect(paths).toHaveProperty('/api/products/{id}');
      expect(paths['/api/products']).toHaveProperty('get');
      expect(paths['/api/products']).toHaveProperty('post');
      expect(paths['/api/products/{id}']).toHaveProperty('get');
      expect(paths['/api/products/{id}']).toHaveProperty('put');
      expect(paths['/api/products/{id}']).toHaveProperty('delete');

      const schemas = res.body.components.schemas;
      expect(schemas).toHaveProperty('Product');
      expect(schemas).toHaveProperty('CreateProductRequest');
      expect(schemas).toHaveProperty('UpdateProductRequest');
      expect(schemas).toHaveProperty('ProductResponse');
      expect(schemas).toHaveProperty('ProductListResponse');
      expect(schemas).toHaveProperty('ProductDeleteResponse');
    });
  });
});
