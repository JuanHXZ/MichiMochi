import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../../shared/middlewares/auth.middleware.js';
import { AppError } from '../../../../shared/errors/AppError.js';
import { OrderService } from '../../application/services/order.service.js';
import { orderFilterSchema } from '../../application/dtos/order.dto.js';

export class OrderController {
  /**
   * POST /api/orders
   * Crea un pedido nuevo con pago simulado
   */
  static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Usuario no autenticado.');
      }

      const order = await OrderService.createOrder(req.user, req.body);
      res.status(201).json({
        ok: true,
        message: 'Pedido creado y pago aprobado exitosamente.',
        data: order,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/orders
   * Lista los pedidos del cliente autenticado (o todos para admin con ?scope=all)
   */
  static async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Usuario no autenticado.');
      }

      const parsed = orderFilterSchema.safeParse(req.query);
      const filters = parsed.success ? parsed.data : {};
      const orders = await OrderService.listOrders(req.user, filters);

      res.status(200).json({
        ok: true,
        total: orders.length,
        data: orders,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/orders/:id
   * Obtiene el detalle y seguimiento de un pedido
   */
  static async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Usuario no autenticado.');
      }

      const order = await OrderService.getOrderById(req.params.id, req.user);
      res.status(200).json({
        ok: true,
        data: order,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/orders/:id/simulate-advance
   * Simula el avance al siguiente estado de la orden
   */
  static async simulateAdvance(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Usuario no autenticado.');
      }

      const order = await OrderService.simulateAdvanceStatus(req.params.id, req.user);
      res.status(200).json({
        ok: true,
        message: `Estado del pedido actualizado a '${order.status}'.`,
        data: order,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/orders/:id/cancel
   * Cancela un pedido si aún no ha sido enviado
   */
  static async cancel(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Usuario no autenticado.');
      }

      const order = await OrderService.cancelOrder(req.params.id, req.user);
      res.status(200).json({
        ok: true,
        message: 'Pedido cancelado exitosamente.',
        data: order,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/orders/:id/status
   * Actualización administrativa directa de estado
   */
  static async updateStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await OrderService.updateStatusAsAdmin(req.params.id, req.body);
      res.status(200).json({
        ok: true,
        message: 'Estado del pedido actualizado por administrador.',
        data: order,
      });
    } catch (err) {
      next(err);
    }
  }
}
