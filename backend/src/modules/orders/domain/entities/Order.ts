export type OrderStatus = 'RECEIVED' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export const ORDER_STATUS_FLOW: readonly OrderStatus[] = [
  'RECEIVED',
  'PREPARING',
  'SHIPPED',
  'DELIVERED',
];

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; description: string }> = {
  RECEIVED: {
    label: 'Pedido recibido',
    description: 'Tu pedido ha sido confirmado y recibido por la tienda MichiMochi.',
  },
  PREPARING: {
    label: 'Orden en preparación',
    description: 'Nuestros maestros artesanos están preparando y empacando tus mochis.',
  },
  SHIPPED: {
    label: 'Pedido enviado',
    description: 'Tu orden salió de cocina y va en camino a tu dirección de entrega.',
  },
  DELIVERED: {
    label: 'Entregado',
    description: 'Tu pedido ha sido entregado exitosamente. ¡Disfruta tus mochis!',
  },
  CANCELLED: {
    label: 'Cancelado',
    description: 'El pedido fue cancelado y el inventario fue restaurado.',
  },
};

export type PaymentMethod = 'card' | 'nequi' | 'pse' | 'cash_on_delivery';

export interface OrderItem {
  productId: string;
  name: string;
  shortName?: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  flavor?: string;
  image?: string;
  subtotal: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  notes?: string;
}

export interface SimulatedPayment {
  method: PaymentMethod;
  status: 'APPROVED';
  simulated: true;
  reference: string;
  cardLast4?: string;
  cardHolder?: string;
  paidAt: string;
}

export interface OrderStatusEvent {
  status: OrderStatus;
  label: string;
  description: string;
  timestamp: string;
  actor: 'system' | 'customer' | 'admin';
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  payment: SimulatedPayment;
  subtotal: number;
  shipping: number;
  tax: number;
  savings: number;
  total: number;
  currency: 'USD' | 'COP';
  status: OrderStatus;
  statusHistory: OrderStatusEvent[];
  estimatedDelivery: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderFilterQuery {
  status?: OrderStatus;
}
