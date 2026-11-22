import { Router } from 'express';
import { authenticateJWT } from '../../../../shared/middlewares/auth.middleware.js';
import { validateBody } from '../../../../shared/middlewares/validate.middleware.js';
import { redeemRewardSchema } from '../../application/dtos/reward.dto.js';
import { RewardController } from '../controllers/reward.controller.js';

const router = Router();

router.use(authenticateJWT);

router.get('/me', RewardController.getMe);
router.post('/redeem', validateBody(redeemRewardSchema), RewardController.redeem);

export default router;
