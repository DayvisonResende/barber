-- SQL para rodar no Supabase SQL Editor
-- Acesse: https://supabase.com → seu projeto → SQL Editor → New Query

-- Adicionar colunas de horário de expediente à tabela barber_config
ALTER TABLE barber_config
  ADD COLUMN IF NOT EXISTS work_start   TIME   DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS work_end     TIME   DEFAULT '19:00',
  ADD COLUMN IF NOT EXISTS working_days INT[]  DEFAULT '{1,2,3,4,5,6}';

-- Verificar resultado
SELECT barber_id, work_start, work_end, working_days, lunch_start, lunch_end
FROM barber_config;
