import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';
import {
  authenticateJWT,
  optionalAuthenticateJWT,
  requireRole,
} from '../../../../shared/middlewares/auth.middleware.js';
import { validateBody } from '../../../../shared/middlewares/validate.middleware.js';
import { createProductSchema, updateProductSchema } from '../../application/dtos/product.dto.js';

const router = Router();

// Lectura pública de catálogo (visitantes, clientes y admins)
router.get('/', optionalAuthenticateJWT, ProductController.getAll);
router.get('/:id', optionalAuthenticateJWT, ProductController.getById);

// Gestión CRUD exclusiva para administradores
router.post('/', authenticateJWT, requireRole('admin'), validateBody(createProductSchema), ProductController.create);
router.put('/:id', authenticateJWT, requireRole('admin'), validateBody(updateProductSchema), ProductController.update);
router.delete('/:id', authenticateJWT, requireRole('admin'), ProductController.delete);

export default router;
