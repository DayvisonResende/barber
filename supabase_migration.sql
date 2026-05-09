-- SQL para rodar no Supabase SQL Editor
-- Acesse: https://supabase.com → seu projeto → SQL Editor → New Query

-- Adicionar colunas de horário de expediente à tabela barber_config
ALTER TABLE barber_config
  ADD COLUMN IF NOT EXISTS work_start   TIME   DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS work_end     TIME   DEFAULT '19:00',
  ADD COLUMN IF NOT EXISTS working_days INT[]  DEFAULT '{1,2,3,4,5,6}';

-- [NOVO] Horários individuais por dia da semana (JSON)
-- Estrutura: { "0": { "closed": false, "start": "09:00", "end": "18:00" }, ... }
ALTER TABLE barber_config
  ADD COLUMN IF NOT EXISTS day_schedules JSONB DEFAULT NULL;

-- [NOVO] Janela de disponibilidade (dias no futuro que o cliente pode agendar)
ALTER TABLE shop_settings
  ADD COLUMN IF NOT EXISTS booking_window_days INT DEFAULT 30;

-- Verificar resultado
SELECT barber_id, work_start, work_end, working_days, lunch_start, lunch_end, day_schedules
FROM barber_config;

SELECT id, name, booking_window_days FROM shop_settings;
