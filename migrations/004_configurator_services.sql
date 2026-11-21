
-- =========================================
-- SKLAD — УНИВЕРСАЛЬНЫЙ КОНФИГУРАТОР
-- Migration 004
-- =========================================

BEGIN;

-- Таблица услуг организаций.
CREATE TABLE IF NOT EXISTS public.configurator_services (
    id BIGSERIAL PRIMARY KEY,

    organization_id BIGINT NOT NULL
        REFERENCES public.organizations(id)
        ON DELETE CASCADE,

    name VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(100),

    price_from NUMERIC(12, 2),
    price_to NUMERIC(12, 2),

    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индекс для быстрой загрузки услуг организации.
CREATE INDEX IF NOT EXISTS idx_configurator_services_org_active_sort
ON public.configurator_services (
    organization_id,
    is_active,
    sort_order,
    id
);

COMMIT;
