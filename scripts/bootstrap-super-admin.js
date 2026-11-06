// Подключаем модуль для работы с путями.
const path = require('path');

// Загружаем переменные окружения из корневого .env проекта.
require('dotenv').config({
    path: path.resolve(__dirname, '../.env')
});

// Подключаем общий Pool PostgreSQL.
const pool = require('../db/database');

// Подключаем bcrypt для безопасного хеширования пароля.
const bcrypt = require('bcrypt');


// Главная функция создания Super Admin.
async function bootstrapSuperAdmin() {

    // Получаем данные из переменных окружения.
    const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim();
    const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

    // Проверяем, что все данные переданы.
    if (!name || !email || !password) {
        throw new Error('Не заданы данные главного администратора.');
    }

    // Проверяем минимальную длину пароля.
    if (password.length < 8) {
        throw new Error('Пароль должен содержать минимум 8 символов.');
    }

    // Получаем соединение с базой данных.
    const client = await pool.connect();

    // Отслеживаем начало транзакции.
    let transactionStarted = false;

    try {

        // Начинаем транзакцию.
        await client.query('BEGIN');
        transactionStarted = true;

        // Блокируем таблицу от параллельного изменения.
        await client.query(
            'LOCK TABLE platform_admins IN EXCLUSIVE MODE'
        );

        // Проверяем, существует ли уже Super Admin.
        const admins = await client.query(
            'SELECT user_id FROM platform_admins LIMIT 1'
        );

        if (admins.rows.length > 0) {
            throw new Error(
                'Super Admin уже существует. Создание остановлено.'
            );
        }

        // Проверяем, не зарегистрирован ли этот email.
        const existingUser = await client.query(
            `SELECT id
             FROM users
             WHERE LOWER(TRIM(email)) = $1
             LIMIT 1`,
            [email]
        );

        if (existingUser.rows.length > 0) {
            throw new Error(
                'Этот email уже зарегистрирован. Существующий аккаунт не изменён.'
            );
        }

        // Находим существующую организацию Sklad HQ.
        const organization = await client.query(
            `SELECT id
             FROM organizations
             WHERE slug = $1
             LIMIT 1`,
            ['sklad-hq']
        );

        if (organization.rows.length === 0) {
            throw new Error('Организация Sklad HQ не найдена.');
        }

        // Получаем ID существующей организации.
        const organizationId = organization.rows[0].id;

        // Хешируем пароль перед сохранением.
        const passwordHash = await bcrypt.hash(password, 12);

        // Создаём пользователя.
        const newUser = await client.query(
            `INSERT INTO users (name, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id`,
            [name, email, passwordHash]
        );

        // Получаем ID нового пользователя.
        const userId = newUser.rows[0].id;

        // Назначаем пользователю роль Owner в Sklad HQ.
        await client.query(
            `INSERT INTO organization_members
             (user_id, organization_id, role)
             VALUES ($1, $2, $3)`,
            [userId, organizationId, 'owner']
        );

        // Назначаем глобальную роль Super Admin.
        await client.query(
            `INSERT INTO platform_admins (user_id, role)
             VALUES ($1, $2)`,
            [userId, 'super_admin']
        );

        // Подтверждаем все изменения.
        await client.query('COMMIT');
        transactionStarted = false;

        // Выводим результат без пароля.
        console.log('Главный аккаунт SKLAD успешно создан.');
        console.log('User ID:', userId);
        console.log('Organization ID:', organizationId);
        console.log('Organization: Sklad HQ');
        console.log('Organization role: owner');
        console.log('Platform role: super_admin');

    } catch (error) {

        // Если произошла ошибка — отменяем изменения.
        if (transactionStarted) {
            await client.query('ROLLBACK');
        }

        // Передаём ошибку дальше.
        throw error;

    } finally {

        // Освобождаем соединение с базой.
        client.release();

        // Закрываем Pool после завершения скрипта.
        await pool.end();
    }
}

// Запускаем процедуру.
bootstrapSuperAdmin().catch((error) => {
    console.error('Создание Super Admin остановлено:');
    console.error(error.message);
    process.exitCode = 1;
});