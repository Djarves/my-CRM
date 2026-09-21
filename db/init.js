// Получаем подключение к PostgreSQL.
const pool = require('./database');

// Функция инициализации базы данных.
async function initDatabase() {

    // Таблица клиентов.
    // Оставляем её, потому что старый CRM её использует.
    const createClientsTable = `
        CREATE TABLE IF NOT EXISTS clients (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            status VARCHAR(50) DEFAULT 'Новая заявка',
            budget INT DEFAULT 0,
            phone VARCHAR(20)
        );
    `;

    // Основная таблица лидов нашего нового продукта.
    const createLeadsTable = `
        CREATE TABLE IF NOT EXISTS leads (
            id SERIAL PRIMARY KEY,

            name VARCHAR(100) NOT NULL,
            phone VARCHAR(30),
            email VARCHAR(150),

            business_type VARCHAR(100),
            goal VARCHAR(255),

            description TEXT,
            ai_brief TEXT,
            options JSONB,
            budget INT DEFAULT 0,

            price_from INT DEFAULT 0,
            price_to INT DEFAULT 0,

            source VARCHAR(100) DEFAULT 'configurator',

            status VARCHAR(50) DEFAULT 'NEW',

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    // Таблица Push-подписок.
    const createPushSubscriptionsTable = `
        CREATE TABLE IF NOT EXISTS push_subscriptions (
            id SERIAL PRIMARY KEY,

            endpoint TEXT NOT NULL UNIQUE,

            subscription JSONB NOT NULL,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {

        // Создаём старую таблицу клиентов,
        // если её ещё нет.
        await pool.query(createClientsTable);

        // Создаём таблицу лидов.
        await pool.query(createLeadsTable);

        // Создаём таблицу Push-подписок.
        await pool.query(
            createPushSubscriptionsTable
        );

        console.log(
            '✅ База данных проверена'
        );

        console.log(
            '✅ Таблица clients готова'
        );

        console.log(
            '✅ Таблица leads готова'
        );

        console.log(
            '✅ Таблица push_subscriptions готова'
        );

    } catch (error) {

        // Если произошла ошибка,
        // показываем её в терминале.
        console.error(
            '❌ Ошибка создания таблиц:',
            error.message
        );
    }
}

// Экспортируем функцию.
module.exports = initDatabase;