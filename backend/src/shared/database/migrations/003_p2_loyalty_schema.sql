CREATE TABLE IF NOT EXISTS user_favorites (
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_rewards (
  user_id TEXT PRIMARY KEY,
  points INTEGER NOT NULL DEFAULT 0,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reward_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('EARN', 'REDEEM', 'BONUS')),
  points INTEGER NOT NULL,
  order_id TEXT,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reward_transactions_user_id ON reward_transactions (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS promo_codes (
  code TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('PERCENT', 'FIXED')),
  discount_value NUMERIC(10, 2) NOT NULL,
  min_subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  max_discount NUMERIC(10, 2),
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  user_id TEXT,
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0;
