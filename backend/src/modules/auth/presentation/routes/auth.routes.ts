import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validateBody } from '../../../../shared/middlewares/validate.middleware.js';
import { authenticateJWT } from '../../../../shared/middlewares/auth.middleware.js';
import { registerSchema, loginSchema, googleAuthSchema } from '../../application/dtos/auth.dto.js';

const router = Router();

router.post('/register', validateBody(registerSchema), AuthController.register);
router.post('/login', validateBody(loginSchema), AuthController.login);
router.post('/google', validateBody(googleAuthSchema), AuthController.googleLogin);
router.get('/me', authenticateJWT, AuthController.getMe);

export default router;
