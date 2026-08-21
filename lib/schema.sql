-- Schema Dr. Alex Rocha - Neon PostgreSQL

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS services (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration VARCHAR(64) DEFAULT '45 min',
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  category VARCHAR(128) DEFAULT 'Serviços',
  is_active BOOLEAN DEFAULT TRUE,
  order_num INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
  id VARCHAR(64) PRIMARY KEY,
  client_name VARCHAR(255) NOT NULL,
  client_phone VARCHAR(64) NOT NULL,
  notes TEXT,
  service_id VARCHAR(64) REFERENCES services(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  time VARCHAR(10) NOT NULL,
  status VARCHAR(32) DEFAULT 'pending', -- pending, confirmed, completed, cancelled, no_show
  price_charged NUMERIC(10, 2) DEFAULT 0.00,
  is_paid BOOLEAN DEFAULT FALSE,
  payment_method VARCHAR(32) DEFAULT 'unspecified',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
  id VARCHAR(64) PRIMARY KEY,
  description VARCHAR(255) NOT NULL,
  category VARCHAR(128) NOT NULL DEFAULT 'Outros',
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  is_recurring_monthly BOOLEAN DEFAULT FALSE,
  due_date DATE NOT NULL,
  status VARCHAR(32) DEFAULT 'pending', -- pending, paid
  payment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blocked_dates (
  id VARCHAR(64) PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS business_hours (
  day_of_week INT PRIMARY KEY, -- 0=Domingo, 1=Segunda, ..., 6=Sábado
  day_name VARCHAR(32) NOT NULL,
  is_working BOOLEAN DEFAULT TRUE,
  slots JSONB DEFAULT '["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"]'::jsonb
);

CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(64) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserir dados padrão caso ainda não existam
INSERT INTO services (id, name, description, duration, price, category, is_active, order_num)
VALUES 
  ('quiro-sessao', 'Sessão de Quiropraxia', 'Ajuste quiroprático com foco em alívio de dores e alinhamento da coluna.', '45 min', 200.00, 'Serviços', true, 1),
  ('osteo-sessao', 'Sessão de Osteopatia', 'Tratamento manual do corpo como um todo, foco em estrutura e mobilidade.', '50 min', 220.00, 'Serviços', true, 2),
  ('reab-fisio', 'Reabilitação — Fisioterapia em Geral', 'Acompanhamento para recuperação de lesões e restrição de movimento.', '50 min', 180.00, 'Serviços', true, 3),
  ('massagem-pistolinha', 'Massagem Terapêutica com Pistolinha Massageadora', 'Massagem terapêutica com massageador de percussão, foco em relaxamento muscular.', '30 min', 150.00, 'Serviços', true, 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO settings (key, value)
VALUES
  ('show_prices_publicly', 'false'::jsonb),
  ('clinic_name', '"Dr. Alex Rocha - Alleanza Clinic"'::jsonb),
  ('clinic_phone', '"5586988664485"'::jsonb),
  ('clinic_address', '"Alleanza Clinic — Teresina-PI"'::jsonb),
  ('default_slots', '["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"]'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO business_hours (day_of_week, day_name, is_working, slots)
VALUES
  (0, 'Domingo', false, '[]'::jsonb),
  (1, 'Segunda-feira', true, '["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"]'::jsonb),
  (2, 'Terça-feira', true, '["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"]'::jsonb),
  (3, 'Quarta-feira', true, '["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"]'::jsonb),
  (4, 'Quinta-feira', true, '["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"]'::jsonb),
  (5, 'Sexta-feira', true, '["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"]'::jsonb),
  (6, 'Sábado', true, '["08:00", "09:00", "10:00", "11:00", "12:00"]'::jsonb)
ON CONFLICT (day_of_week) DO NOTHING;
