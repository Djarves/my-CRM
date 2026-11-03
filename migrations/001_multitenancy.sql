-- 001_multitenancy.sql
-- Первая миграция My-CRM: организации, пользователи и приглашения.
-- Запускать ТОЛЬКО в отдельной Neon-ветке my-crm-multitenant-dev.
-- Миграция сохраняет старые записи, относя их к организации legacy-workspace.

BEGIN;

-- 1. Организации (тенанты).
CREATE TABLE IF NOT EXISTS organizations (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(80) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Пользователи.
-- password_hash хранит только хеш пароля, не сам пароль.
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Один email = одна учётная запись (без учёта регистра).
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique
    ON users (LOWER(email));

-- 3. Членство пользователей в организациях и их роли.
CREATE TABLE IF NOT EXISTS organization_members (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL
        REFERENCES organizations(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS organization_members_user_id_idx
    ON organization_members (user_id);

-- 4. Приглашения сотрудников.
-- В таблице будет храниться хеш токена, а не сам токен из ссылки.
CREATE TABLE IF NOT EXISTS organization_invitations (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL
        REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'member'
        CHECK (role IN ('admin', 'member')),
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    invited_by BIGINT
        REFERENCES users(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS organization_invitations_org_email_idx
    ON organization_invitations (organization_id, LOWER(email));

-- 5. Добавляем привязку к организации в существующие таблицы.
-- Сначала поле допускает NULL, чтобы можно было безопасно заполнить старые строки.
ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS organization_id BIGINT
    REFERENCES organizations(id);

ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS organization_id BIGINT
    REFERENCES organizations(id);

ALTER TABLE push_subscriptions
    ADD COLUMN IF NOT EXISTS organization_id BIGINT
    REFERENCES organizations(id);

-- 6. Создаём техническую организацию для уже существующих данных.
-- Она нужна, чтобы старые заявки и подписки не потерялись.
INSERT INTO organizations (name, slug)
VALUES ('My CRM — текущие данные', 'legacy-workspace')
ON CONFLICT (slug) DO NOTHING;

-- 7. Привязываем все старые записи к технической организации.
UPDATE leads
SET organization_id = (
    SELECT id FROM organizations WHERE slug = 'legacy-workspace'
)
WHERE organization_id IS NULL;

UPDATE clients
SET organization_id = (
    SELECT id FROM organizations WHERE slug = 'legacy-workspace'
)
WHERE organization_id IS NULL;

UPDATE push_subscriptions
SET organization_id = (
    SELECT id FROM organizations WHERE slug = 'legacy-workspace'
)
WHERE organization_id IS NULL;

-- 8. После заполнения запрещаем создавать записи без организации.
ALTER TABLE leads
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE clients
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE push_subscriptions
    ALTER COLUMN organization_id SET NOT NULL;

-- 9. Индексы ускорят выборки данных внутри одной организации.
CREATE INDEX IF NOT EXISTS leads_organization_id_idx
    ON leads (organization_id);

CREATE INDEX IF NOT EXISTS clients_organization_id_idx
    ON clients (organization_id);

CREATE INDEX IF NOT EXISTS push_subscriptions_organization_id_idx
    ON push_subscriptions (organization_id);

COMMIT;