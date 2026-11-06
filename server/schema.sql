CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(40),
  country VARCHAR(100),
  service VARCHAR(120) NOT NULL,
  budget VARCHAR(100) NOT NULL,
  timeline VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  source VARCHAR(80) NOT NULL DEFAULT 'Website form',
  status VARCHAR(30) NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','quoted','negotiation','won','lost','not_fit')),
  quote_amount NUMERIC(14,2),
  currency VARCHAR(8) NOT NULL DEFAULT 'XAF',
  next_follow_up DATE,
  notes TEXT NOT NULL DEFAULT '',
  email_notification_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  whatsapp_notification_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status);
CREATE INDEX IF NOT EXISTS leads_follow_up_idx ON leads(next_follow_up) WHERE next_follow_up IS NOT NULL;
