import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_META,
  Order,
  OrderItem,
  OrderStatus,
  OrderStatusEvent,
} from '../../domain/entities/Order.js';
import { orderRepository } from '../../infrastructure/repositories/orderRepository.factory.js';
import { productRepository } from '../../../catalog/infrastructure/repositories/productRepository.factory.js';
import { Product } from '../../../catalog/domain/entities/Product.js';
import { AccessTokenPayload } from '../../../auth/domain/entities/User.js';
import { AppError } from '../../../../shared/errors/AppError.js';
import { CreateOrderDTO, UpdateOrderStatusDTO } from '../dtos/order.dto.js';
import { PromoService } from '../../../promotions/application/services/promo.service.js';
import { RewardService } from '../../../rewards/application/services/reward.service.js';

const DELIVERY_FEE = 2.99;
const TAX_RATE = 0.06;

const round2 = (value: number): number => Math.round(value * 100) / 100;

const generateOrderNumber = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i += 1) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `MM-${suffix}`;
};

const buildStatusEvent = (
  status: OrderStatus,
  actor: 'system' | 'customer' | 'admin',
  timestamp: string,
  customNote?: string
): OrderStatusEvent => ({
  status,
  label: ORDER_STATUS_META[status].label,
  description: customNote?.trim() || ORDER_STATUS_META[status].description,
  timestamp,
  actor,
});

export class OrderService {
  /**
   * Crea un nuevo pedido con validación de stock, simulación de pago y cálculo autoritativo en servidor.
   */
  static async createOrder(user: AccessTokenPayload, data: CreateOrderDTO): Promise<Order> {
    const requestedQtyByProduct = new Map<string, number>();
    for (const item of data.items) {
      requestedQtyByProduct.set(
        item.productId,
        (requestedQtyByProduct.get(item.productId) ?? 0) + item.quantity
      );
    }

    const loadedProducts = new Map<string, Product>();

    for (const [productId, totalQty] of requestedQtyByProduct.entries()) {
      const product = await productRepository.findById(productId);
      if (!product) {
        throw AppError.notFound(`El producto con ID '${productId}' no existe en el catálogo.`);
      }

      const availableStock = product.stock ?? 0;
      if (product.inStock === false || availableStock <= 0) {
        throw AppError.badRequest(`El producto '${product.name}' se encuentra agotado.`);
      }

      if (availableStock < totalQty) {
        throw AppError.badRequest(
          `Stock insuficiente para '${product.name}'. Disponibles: ${availableStock}, solicitados: ${totalQty}.`
        );
      }

      loadedProducts.set(productId, product);
    }

    if (data.payment.simulateOutcome === 'declined') {
      throw AppError.badRequest(
        'Pago simulado rechazado. Intenta nuevamente con otro método o tarjeta de prueba aprobada.'
      );
    }

    const orderItems: OrderItem[] = data.items.map((item) => {
      const product = loadedProducts.get(item.productId)!;
      const unitPrice = Number(product.price);
      const originalUnitPrice =
        product.originalPrice && product.originalPrice > unitPrice
          ? Number(product.originalPrice)
          : undefined;

      return {
        productId: product.id,
        name: product.name,
        shortName: product.shortName,
        price: unitPrice,
        originalPrice: originalUnitPrice,
        quantity: item.quantity,
        flavor: item.flavor,
        image: product.image || product.images?.[0],
        subtotal: round2(unitPrice * item.quantity),
      };
    });

    const subtotal = round2(orderItems.reduce((sum, item) => sum + item.subtotal, 0));
    const shipping = DELIVERY_FEE;
    const tax = round2(subtotal * TAX_RATE);
    const savings = round2(
      orderItems.reduce((sum, item) => {
        if (item.originalPrice && item.originalPrice > item.price) {
          return sum + (item.originalPrice - item.price) * item.quantity;
        }
        return sum;
      }, 0)
    );

    let appliedPromoCode: string | undefined;
    let discountAmount = 0;
    if (data.promoCode && data.promoCode.trim()) {
      const promoResult = await PromoService.validatePromo(data.promoCode, subtotal, user.uid);
      appliedPromoCode = promoResult.code;
      discountAmount = promoResult.discountAmount;
    }

    const total = Math.max(0, round2(subtotal + shipping + tax - discountAmount));

    const now = new Date().toISOString();

    for (const [productId, totalQty] of requestedQtyByProduct.entries()) {
      const product = loadedProducts.get(productId)!;
      const nextStock = Math.max(0, (product.stock ?? 0) - totalQty);
      await productRepository.update(productId, {
        ...product,
        stock: nextStock,
        inStock: nextStock > 0,
        updatedAt: now,
      });
    }

    if (appliedPromoCode) {
      await PromoService.consumePromo(appliedPromoCode, subtotal, user.uid);
    }

    const orderNumber = generateOrderNumber();
    const order: Order = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orderNumber,
      userId: user.uid,
      customerName: data.shippingAddress.fullName || user.fullName,
      customerEmail: user.email,
      items: orderItems,
      shippingAddress: data.shippingAddress,
      payment: {
        method: data.payment.method,
        status: 'APPROVED',
        simulated: true,
        reference: `PAY-${orderNumber}`,
        ...(data.payment.cardLast4 ? { cardLast4: data.payment.cardLast4 } : {}),
        ...(data.payment.cardHolder ? { cardHolder: data.payment.cardHolder } : {}),
        paidAt: now,
      },
      subtotal,
      shipping,
      tax,
      savings,
      ...(appliedPromoCode ? { promoCode: appliedPromoCode } : {}),
      discountAmount,
      total,
      currency: data.currency ?? 'USD',
      status: 'RECEIVED',
      statusHistory: [buildStatusEvent('RECEIVED', 'system', now)],
      estimatedDelivery: '25-35 min',
      createdAt: now,
      updatedAt: now,
    };

    const createdOrder = await orderRepository.create(order);
    try {
      await RewardService.earnFromOrder(user.uid, createdOrder.id, createdOrder.orderNumber, subtotal);
    } catch (err) {
      console.warn('[OrderService] No se pudieron acreditar puntos de recompensa:', err);
    }

    return createdOrder;
  }

  /**
   * Lista los pedidos del usuario autenticado o todos si es administrador y solicita scope=all.
   */
  static async listOrders(
    requester: AccessTokenPayload,
    options?: { scope?: 'mine' | 'all'; status?: OrderStatus }
  ): Promise<Order[]> {
    const filters = options?.status ? { status: options.status } : undefined;
    if (options?.scope === 'all' && requester.role === 'admin') {
      return orderRepository.findAll(filters);
    }
    return orderRepository.findByUserId(requester.uid, filters);
  }

  /**
   * Obtiene el detalle de un pedido verificando que pertenezca al usuario o sea admin.
   */
  static async getOrderById(id: string, requester: AccessTokenPayload): Promise<Order> {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw AppError.notFound(`Pedido con ID '${id}' no encontrado.`);
    }

    if (order.userId !== requester.uid && requester.role !== 'admin') {
      throw AppError.forbidden('No tienes permisos para acceder a este pedido.');
    }

    return order;
  }

  /**
   * Simula el avance de estado de la orden (RECEIVED -> PREPARING -> SHIPPED -> DELIVERED) para el entorno educativo.
   */
  static async simulateAdvanceStatus(id: string, requester: AccessTokenPayload): Promise<Order> {
    const order = await OrderService.getOrderById(id, requester);

    if (order.status === 'CANCELLED') {
      throw AppError.badRequest('No se puede avanzar un pedido que fue cancelado.');
    }

    if (order.status === 'DELIVERED') {
      throw AppError.badRequest('El pedido ya se encuentra en estado Entregado.');
    }

    const currentIdx = ORDER_STATUS_FLOW.indexOf(order.status);
    if (currentIdx === -1 || currentIdx >= ORDER_STATUS_FLOW.length - 1) {
      throw AppError.badRequest('No hay un siguiente estado disponible para este pedido.');
    }

    const nextStatus = ORDER_STATUS_FLOW[currentIdx + 1];
    const now = new Date().toISOString();
    const actor = requester.role === 'admin' ? 'admin' : 'customer';

    const updatedOrder: Order = {
      ...order,
      status: nextStatus,
      statusHistory: [...order.statusHistory, buildStatusEvent(nextStatus, actor, now)],
      estimatedDelivery: nextStatus === 'DELIVERED' ? 'Entregado' : order.estimatedDelivery,
      updatedAt: now,
    };

    return orderRepository.update(id, updatedOrder);
  }

  /**
   * Restaura el inventario de los productos de una orden cancelada.
   */
  private static async restoreOrderStock(order: Order, timestamp: string): Promise<void> {
    const qtyByProduct = new Map<string, number>();
    for (const item of order.items) {
      qtyByProduct.set(item.productId, (qtyByProduct.get(item.productId) ?? 0) + item.quantity);
    }

    for (const [productId, qty] of qtyByProduct.entries()) {
      const product = await productRepository.findById(productId);
      if (product) {
        const nextStock = (product.stock ?? 0) + qty;
        await productRepository.update(productId, {
          ...product,
          stock: nextStock,
          inStock: nextStock > 0,
          updatedAt: timestamp,
        });
      }
    }
  }

  /**
   * Cancela una orden si está en RECEIVED o PREPARING, restaurando el stock de productos.
   */
  static async cancelOrder(id: string, requester: AccessTokenPayload): Promise<Order> {
    const order = await OrderService.getOrderById(id, requester);

    if (order.status !== 'RECEIVED' && order.status !== 'PREPARING') {
      throw AppError.badRequest(
        'Solo se pueden cancelar pedidos en estado Pedido recibido u Orden en preparación.'
      );
    }

    const now = new Date().toISOString();
    await OrderService.restoreOrderStock(order, now);

    const actor = requester.role === 'admin' ? 'admin' : 'customer';
    const updatedOrder: Order = {
      ...order,
      status: 'CANCELLED',
      statusHistory: [...order.statusHistory, buildStatusEvent('CANCELLED', actor, now)],
      updatedAt: now,
    };

    return orderRepository.update(id, updatedOrder);
  }

  /**
   * Actualiza explícitamente el estado de un pedido (solo administrador).
   */
  static async updateStatusAsAdmin(id: string, data: UpdateOrderStatusDTO): Promise<Order> {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw AppError.notFound(`Pedido con ID '${id}' no encontrado.`);
    }

    const now = new Date().toISOString();
    if (data.status === 'CANCELLED' && order.status !== 'CANCELLED') {
      await OrderService.restoreOrderStock(order, now);
    }

    const updatedOrder: Order = {
      ...order,
      status: data.status,
      statusHistory: [
        ...order.statusHistory,
        buildStatusEvent(data.status, 'admin', now, data.note),
      ],
      estimatedDelivery: data.status === 'DELIVERED' ? 'Entregado' : order.estimatedDelivery,
      updatedAt: now,
    };

    return orderRepository.update(id, updatedOrder);
  }

  /**
   * Reinicia el repositorio de pedidos en memoria (útil para pruebas automatizadas).
   */
  static reset(): void {
    orderRepository.reset();
  }
}
