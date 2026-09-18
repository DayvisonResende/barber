-- Adiciona coluna cancelled_by_role (TEXT) na tabela appointments
-- Usada pelo sino de notificações (js/client-insights.js) para avisar o barbeiro
-- quando um CLIENTE (não a própria equipe) cancela um agendamento.
-- Execute no SQL Editor do Supabase. Coluna nula por padrão: não afeta nenhuma
-- linha ou consulta existente.

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS cancelled_by_role TEXT;
