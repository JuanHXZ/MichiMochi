import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller.js';
import {
  authenticateJWT,
  optionalAuthenticateJWT,
  requireRole,
} from '../../../../shared/middlewares/auth.middleware.js';
import { validateBody } from '../../../../shared/middlewares/validate.middleware.js';
import { createCategorySchema, updateCategorySchema } from '../../application/dtos/category.dto.js';

const router = Router();

router.get('/', optionalAuthenticateJWT, CategoryController.getAll);
router.get('/:id', optionalAuthenticateJWT, CategoryController.getById);

router.post('/', authenticateJWT, requireRole('admin'), validateBody(createCategorySchema), CategoryController.create);
router.put('/:id', authenticateJWT, requireRole('admin'), validateBody(updateCategorySchema), CategoryController.update);
router.delete('/:id', authenticateJWT, requireRole('admin'), CategoryController.delete);

export default router;
