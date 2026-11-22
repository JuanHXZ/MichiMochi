import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../../application/services/product.service.js';
import { AuthRequest } from '../../../../shared/middlewares/auth.middleware.js';
import { ProductFilterQuery } from '../../domain/entities/Product.js';
import { productFilterSchema } from '../../application/dtos/product.dto.js';
import { S3StorageService, UploadImageFile } from '../../../../shared/services/storage/s3Storage.service.js';

export class ProductController {
  /**
   * GET /api/products
   * Consulta todos los productos con filtros opcionales
   */
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = productFilterSchema.safeParse(req.query);
      const filters: ProductFilterQuery = parsed.success ? parsed.data : {};

      const products = await ProductService.getAll(filters);
      res.status(200).json({
        ok: true,
        data: products,
        total: products.length,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/products/:id
   * Consulta un producto específico por su ID
   */
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const product = await ProductService.getById(id);
      res.status(200).json({
        ok: true,
        data: product,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/products/upload-images
   * Sube una o varias imágenes de producto a Amazon S3 (solo admin)
   */
  static async uploadImages(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = (req.files as UploadImageFile[] | undefined) || [];
      const urls = await S3StorageService.uploadProductImages(files);
      res.status(200).json({
        ok: true,
        message: 'Imágenes subidas exitosamente.',
        data: { urls },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/products
   * Crea y agrega un nuevo producto al catálogo (solo admin)
   */
  static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const newProduct = await ProductService.create(req.body);
      res.status(201).json({
        ok: true,
        message: 'Producto creado exitosamente en el catálogo.',
        data: newProduct,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/products/:id
   * Actualiza un producto existente en el catálogo (solo admin)
   */
  static async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updatedProduct = await ProductService.update(id, req.body);
      res.status(200).json({
        ok: true,
        message: 'Producto actualizado exitosamente.',
        data: updatedProduct,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/products/:id
   * Elimina un producto del catálogo por su ID (solo admin)
   */
  static async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await ProductService.delete(id);
      res.status(200).json({
        ok: true,
        message: 'Producto eliminado exitosamente del catálogo.',
        data: deleted,
      });
    } catch (err) {
      next(err);
    }
  }
}
