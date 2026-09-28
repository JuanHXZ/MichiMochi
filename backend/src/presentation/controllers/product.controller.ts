import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../../application/services/product.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { ProductFilterQuery } from '../../domain/entities/Product.js';

export class ProductController {
  /**
   * GET /api/products
   * Consulta todos los productos con filtros opcionales
   */
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: ProductFilterQuery = {
        category: req.query.category as string | undefined,
        search: req.query.search as string | undefined,
        featured: req.query.featured !== undefined ? req.query.featured === 'true' : undefined,
        inStock: req.query.inStock !== undefined ? req.query.inStock === 'true' : undefined,
      };

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
   * POST /api/products
   * Crea y agrega un nuevo producto al catálogo
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
   * Actualiza un producto existente en el catálogo
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
   * Elimina un producto del catálogo por su ID
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
