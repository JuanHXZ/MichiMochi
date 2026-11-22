CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  items JSONB NOT NULL,
  shipping_address JSONB NOT NULL,
  payment JSONB NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  shipping NUMERIC(10, 2) NOT NULL,
  tax NUMERIC(10, 2) NOT NULL,
  savings NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('RECEIVED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
  status_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  estimated_delivery TEXT NOT NULL DEFAULT '25-35 min',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id_created_at ON orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
