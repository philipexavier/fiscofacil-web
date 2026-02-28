-- Execute no Supabase SQL Editor
CREATE TABLE IF NOT EXISTS jurema_dataset (
  id               BIGSERIAL PRIMARY KEY,
  external_id      TEXT,
  category         TEXT NOT NULL CHECK (category IN ('ncm','reforma','safeguard','avancado','outro')),
  system_prompt    TEXT NOT NULL,
  user_message     TEXT NOT NULL,
  assistant_message TEXT NOT NULL,
  word_count       INTEGER,
  has_json         BOOLEAN DEFAULT FALSE,
  source_verified  BOOLEAN DEFAULT FALSE,
  within_limit     BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Índices úteis
CREATE INDEX idx_jurema_category  ON jurema_dataset(category);
CREATE INDEX idx_jurema_created   ON jurema_dataset(created_at DESC);
CREATE INDEX idx_jurema_wordcount ON jurema_dataset(word_count);

-- RLS: apenas service role pode inserir/ler
ALTER TABLE jurema_dataset ENABLE ROW LEVEL SECURITY;