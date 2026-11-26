import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../../application/services/category.service.js';
import { AuthRequest } from '../../../../shared/middlewares/auth.middleware.js';
import { CategoryFilterQuery } from '../../domain/entities/Category.js';
import { categoryFilterSchema } from '../../application/dtos/category.dto.js';

export class CategoryController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = categoryFilterSchema.safeParse(req.query);
      const filters: CategoryFilterQuery = parsed.success ? parsed.data : {};

      const categories = await CategoryService.getAll(filters);
      res.status(200).json({
        ok: true,
        data: categories,
        total: categories.length,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const category = await CategoryService.getById(id);
      res.status(200).json({
        ok: true,
        data: category,
      });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const created = await CategoryService.create(req.body);
      res.status(201).json({
        ok: true,
        message: 'Categoría creada exitosamente.',
        data: created,
      });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await CategoryService.update(id, req.body);
      res.status(200).json({
        ok: true,
        message: 'Categoría actualizada exitosamente.',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await CategoryService.delete(id);
      res.status(200).json({
        ok: true,
        message: 'Categoría eliminada exitosamente.',
        data: deleted,
      });
    } catch (err) {
      next(err);
    }
  }
}
