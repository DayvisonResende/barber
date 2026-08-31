-- Adiciona coluna preferences (JSONB) na tabela profiles
-- Usada pelo Perfil 360° do cliente (js/client-insights.js) para guardar
-- preferências pessoais (corte habitual, observações, etc).
-- Execute no SQL Editor do Supabase. Coluna nula por padrão: não afeta nenhuma
-- linha ou consulta existente (SELECT * simplesmente passa a trazer mais um campo).

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferences JSONB;
