import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { createProductSchema, updateProductSchema } from '../schemas/product.schema.js';

const router = Router();

// Todas las operaciones de catálogo requieren autenticación con token JWT
router.use(authenticateJWT);

// GET /api/products — Consultar todos los productos (con filtros opcionales)
router.get('/', ProductController.getAll);

// GET /api/products/:id — Consultar producto por ID
router.get('/:id', ProductController.getById);

// POST /api/products — Agregar un nuevo producto al catálogo
router.post('/', validateBody(createProductSchema), ProductController.create);

// PUT /api/products/:id — Actualizar producto existente
router.put('/:id', validateBody(updateProductSchema), ProductController.update);

// DELETE /api/products/:id — Eliminar producto del catálogo
router.delete('/:id', ProductController.delete);

export default router;
