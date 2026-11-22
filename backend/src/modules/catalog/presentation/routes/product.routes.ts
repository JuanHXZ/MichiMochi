import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { ProductController } from '../controllers/product.controller.js';
import {
  authenticateJWT,
  optionalAuthenticateJWT,
  requireRole,
} from '../../../../shared/middlewares/auth.middleware.js';
import { validateBody } from '../../../../shared/middlewares/validate.middleware.js';
import { createProductSchema, updateProductSchema } from '../../application/dtos/product.dto.js';
import { AppError } from '../../../../shared/errors/AppError.js';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB por imagen
    files: 8,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(AppError.badRequest(`Formato de imagen no soportado (${file.mimetype}). Usa JPG, PNG, WebP o GIF.`));
      return;
    }
    cb(null, true);
  },
});

const handleImageUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.array('images', 8)(req, res, (err: any) => {
    if (!err) {
      next();
      return;
    }
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        next(AppError.badRequest('Cada imagen debe pesar máximo 5 MB.'));
        return;
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        next(AppError.badRequest('Puedes subir máximo 8 imágenes por vez.'));
        return;
      }
      next(AppError.badRequest(err.message));
      return;
    }
    next(err);
  });
};

const router = Router();

// Lectura pública de catálogo (visitantes, clientes y admins)
router.get('/', optionalAuthenticateJWT, ProductController.getAll);
router.get('/:id', optionalAuthenticateJWT, ProductController.getById);

// Subida de imágenes a S3 (solo administradores)
router.post('/upload-images', authenticateJWT, requireRole('admin'), handleImageUpload, ProductController.uploadImages);

// Gestión CRUD exclusiva para administradores
router.post('/', authenticateJWT, requireRole('admin'), validateBody(createProductSchema), ProductController.create);
router.put('/:id', authenticateJWT, requireRole('admin'), validateBody(updateProductSchema), ProductController.update);
router.delete('/:id', authenticateJWT, requireRole('admin'), ProductController.delete);

export default router;
