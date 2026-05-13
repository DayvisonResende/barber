-- =============================================
-- SISTEMA DE PLANOS - FinnoTrato Barbearia
-- Execute este script no SQL Editor do Supabase
-- =============================================

-- 1. Tabela de Planos (criados pelos barbeiros)
CREATE TABLE IF NOT EXISTS plans (
    id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name                    TEXT NOT NULL,
    description             TEXT,
    created_by              UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    discount_type           TEXT NOT NULL DEFAULT 'global'
                                CHECK (discount_type IN ('global', 'individual')),
    global_discount_percent NUMERIC(5,2),
    usage_per_week          INTEGER NOT NULL DEFAULT 1,
    active_days             INTEGER[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}',
    duration_type           TEXT NOT NULL DEFAULT 'months'
                                CHECK (duration_type IN ('days', 'months')),
    duration_value          INTEGER NOT NULL DEFAULT 1,
    is_active               BOOLEAN DEFAULT TRUE,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Descontos individuais por serviço (somente quando discount_type = 'individual')
CREATE TABLE IF NOT EXISTS plan_service_discounts (
    id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_id          UUID REFERENCES plans(id) ON DELETE CASCADE,
    service_id       TEXT NOT NULL,
    discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    UNIQUE(plan_id, service_id)
);

-- 3. Planos atribuídos aos clientes
CREATE TABLE IF NOT EXISTS client_plans (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id     UUID REFERENCES plans(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id),
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    status      TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'expired', 'cancelled')),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Registro de uso dos planos (controle de uso semanal)
CREATE TABLE IF NOT EXISTS plan_usage (
    id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_plan_id UUID REFERENCES client_plans(id) ON DELETE CASCADE,
    used_at        TIMESTAMPTZ DEFAULT NOW(),
    appointment_id UUID
);

-- =============================================
-- PERMISSÕES (RLS)
-- Se o seu projeto usa RLS, execute os blocos abaixo.
-- Se não usa (padrão mais simples), basta deixar desabilitado.
-- =============================================

ALTER TABLE plans                DISABLE ROW LEVEL SECURITY;
ALTER TABLE plan_service_discounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_plans         DISABLE ROW LEVEL SECURITY;
ALTER TABLE plan_usage           DISABLE ROW LEVEL SECURITY;

-- Se preferir habilitar RLS com política permissiva (equivalente a desabilitado):
-- ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "allow_all_plans" ON plans FOR ALL USING (true) WITH CHECK (true);
-- ALTER TABLE plan_service_discounts ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "allow_all_psd" ON plan_service_discounts FOR ALL USING (true) WITH CHECK (true);
-- ALTER TABLE client_plans ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "allow_all_cp" ON client_plans FOR ALL USING (true) WITH CHECK (true);
-- ALTER TABLE plan_usage ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "allow_all_pu" ON plan_usage FOR ALL USING (true) WITH CHECK (true);
