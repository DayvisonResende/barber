-- Adiciona coluna price (NUMERIC) na tabela plans.
-- Usada ao atribuir/renovar um plano (js/plans.js): o valor cobrado entra no
-- caixa como uma transação "Plano: <nome>", sem barbeiro (receita da casa,
-- sem comissão). Execute no SQL Editor do Supabase.

ALTER TABLE plans
ADD COLUMN IF NOT EXISTS price NUMERIC;

-- A venda de plano não tem agendamento nem barbeiro vinculados.
-- Garante que essas colunas aceitem NULL (sem efeito se já aceitarem).
ALTER TABLE transactions ALTER COLUMN appointment_id DROP NOT NULL;
ALTER TABLE transactions ALTER COLUMN barber_id DROP NOT NULL;
