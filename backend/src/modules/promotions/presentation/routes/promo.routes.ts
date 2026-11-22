import { Router } from 'express';
import {
  authenticateJWT,
  optionalAuthenticateJWT,
  requireRole,
} from '../../../../shared/middlewares/auth.middleware.js';
import { validateBody } from '../../../../shared/middlewares/validate.middleware.js';
import { createPromoSchema, updatePromoSchema, validatePromoSchema } from '../../application/dtos/promo.dto.js';
import { PromoController } from '../controllers/promo.controller.js';

const router = Router();

// Validación pública (si está autenticado permite validar cupones personales REWARD-*)
router.post('/validate', optionalAuthenticateJWT, validateBody(validatePromoSchema), PromoController.validate);

// Gestión CRUD exclusiva para administradores
router.get('/', authenticateJWT, requireRole('admin'), PromoController.list);
router.post('/', authenticateJWT, requireRole('admin'), validateBody(createPromoSchema), PromoController.create);
router.put('/:code', authenticateJWT, requireRole('admin'), validateBody(updatePromoSchema), PromoController.update);
router.delete('/:code', authenticateJWT, requireRole('admin'), PromoController.remove);

export default router;
