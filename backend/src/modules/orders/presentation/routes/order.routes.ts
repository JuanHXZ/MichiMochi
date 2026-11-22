import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';
import { authenticateJWT, requireRole } from '../../../../shared/middlewares/auth.middleware.js';
import { validateBody } from '../../../../shared/middlewares/validate.middleware.js';
import { createOrderSchema, updateOrderStatusSchema } from '../../application/dtos/order.dto.js';

const router = Router();

router.use(authenticateJWT);

router.post('/', validateBody(createOrderSchema), OrderController.create);
router.get('/', OrderController.list);
router.get('/:id', OrderController.getById);
router.post('/:id/simulate-advance', OrderController.simulateAdvance);
router.post('/:id/cancel', OrderController.cancel);
router.patch('/:id/status', requireRole('admin'), validateBody(updateOrderStatusSchema), OrderController.updateStatus);

export default router;
