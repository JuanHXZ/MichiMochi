import { Router } from 'express';
import { authenticateJWT } from '../../../../shared/middlewares/auth.middleware.js';
import { FavoriteController } from '../controllers/favorite.controller.js';

const router = Router();

router.use(authenticateJWT);

router.get('/', FavoriteController.list);
router.post('/:productId', FavoriteController.add);
router.delete('/:productId', FavoriteController.remove);

export default router;
