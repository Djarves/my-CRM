-- 002_platform_admins.sql
-- Глобальные администраторы платформы SKLAD.

BEGIN;

-- 1. Создаём собственную организацию.
-- Если она уже существует, повторно не создаём.
INSERT INTO organizations (name, slug)
VALUES ('Sklad HQ', 'sklad-hq')
ON CONFLICT (slug) DO NOTHING;


-- 2. Создаём таблицу глобальных администраторов.
CREATE TABLE IF NOT EXISTS platform_admins (
    user_id BIGINT PRIMARY KEY
        REFERENCES users(id) ON DELETE CASCADE,

    role VARCHAR(30) NOT NULL
        DEFAULT 'super_admin'
        CHECK (role = 'super_admin'),

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP
);

COMMIT;