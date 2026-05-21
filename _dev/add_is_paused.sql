-- Adiciona coluna is_paused na tabela profiles
-- Execute no SQL Editor do Supabase

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_paused BOOLEAN NOT NULL DEFAULT FALSE;
