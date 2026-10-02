-- Adiciona coluna monthly_revenue_goal (NUMERIC) na tabela shop_settings
-- Usada pelo Relatório Gerencial (js/relatorios-app.js) para mostrar a meta de
-- faturamento do mês com barra de progresso.
-- Execute no SQL Editor do Supabase. Coluna nula por padrão: não afeta nenhuma
-- linha ou consulta existente.

ALTER TABLE shop_settings
ADD COLUMN IF NOT EXISTS monthly_revenue_goal NUMERIC;
