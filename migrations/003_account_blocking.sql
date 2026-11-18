-- 003_account_blocking.sql
-- Добавляем возможность блокировки пользователей и организаций SKLAD.

BEGIN;

-- Поля блокировки пользователей.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

-- Поля блокировки организаций.
ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

COMMIT;