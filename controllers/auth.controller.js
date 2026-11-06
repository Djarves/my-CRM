// Подключаем bcrypt для хеширования паролей.
const bcrypt = require('bcrypt');

// Подключаем JWT для создания токенов.
const jwt = require('jsonwebtoken');

// Подключаем crypto для случайного slug.
const crypto = require('crypto');

// Подключаем PostgreSQL Pool.
const pool = require('../db/database');


// Регистрация нового пользователя.
async function register(req, res) {

    // Получаем данные из формы.
    const {
        name,
        email,
        password,
        organizationName,
    } = req.body;

    // Проверяем обязательные поля.
    if (
        typeof name !== 'string' ||
        typeof email !== 'string' ||
        typeof password !== 'string' ||
        typeof organizationName !== 'string' ||
        !name.trim() ||
        !email.trim() ||
        !organizationName.trim() ||
        !password
    ) {
        return res.status(400).json({
            message: 'Заполните все поля',
        });
    }

    // Нормализуем email.
    const normalizedEmail = email.trim().toLowerCase();

    // Проверяем длину пароля.
    if (password.length < 8) {
        return res.status(400).json({
            message: 'Пароль должен содержать минимум 8 символов',
        });
    }
// Пока соединение с базой не получено.
let client;

// Отслеживаем, началась ли транзакция.
let transactionStarted = false;

try {
    // Получаем соединение с PostgreSQL.
    client = await pool.connect();

        // Проверяем, существует ли пользователь.
        const existingUser = await client.query(
            `
            SELECT id
            FROM users
            WHERE LOWER(TRIM(email)) = $1
            `,
            [normalizedEmail]
        );

        // Если пользователь найден, останавливаем регистрацию.
        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                message: 'Пользователь с таким email уже зарегистрирован',
            });
        }

        // Хешируем пароль.
        const passwordHash = await bcrypt.hash(password, 12);

        // Начинаем транзакцию.
        await client.query('BEGIN');
        transactionStarted = true;
        // Создаём пользователя.
        const userResult = await client.query(
            `
            INSERT INTO users (
                name,
                email,
                password_hash
            )
            VALUES ($1, $2, $3)
            RETURNING id, name, email
            `,
            [
                name.trim(),
                normalizedEmail,
                passwordHash,
            ]
        );

        // Получаем созданного пользователя.
        const user = userResult.rows[0];

        // Создаём основу slug.
        const slugBase = organizationName
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') || 'organization';

        // Добавляем случайный суффикс.
        const organizationSlug =
            `${slugBase}-${crypto.randomBytes(4).toString('hex')}`;

        // Создаём организацию.
        const organizationResult = await client.query(
            `
            INSERT INTO organizations (
                name,
                slug
            )
            VALUES ($1, $2)
            RETURNING id, name, slug
            `,
            [
                organizationName.trim(),
                organizationSlug,
            ]
        );

        // Получаем созданную организацию.
        const organization = organizationResult.rows[0];

        // Назначаем пользователю роль владельца.
        await client.query(
            `
            INSERT INTO organization_members (
                organization_id,
                user_id,
                role
            )
            VALUES ($1, $2, $3)
            `,
            [
                organization.id,
                user.id,
                'owner',
            ]
        );
        // Создаём JWT-токен для нового пользователя.
const token = jwt.sign(
    {
        organizationId: String(organization.id),
        role: 'owner',
    },
    process.env.JWT_SECRET,
    {
        subject: String(user.id),
        expiresIn: '7d',
    }
);
        // Сохраняем все три записи.
        await client.query('COMMIT');
        transactionStarted = false;
    // Сохраняем JWT в защищённой cookie браузера.
res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
});
        // Пока возвращаем результат регистрации.
        return res.status(201).json({
            message: 'Регистрация успешна',
            user,
            organization,
            role: 'owner',
        });

    } catch (error) {

    // Отменяем изменения, только если транзакция началась.
    if (transactionStarted) {
        await client.query('ROLLBACK');
    }

        console.error(
            'Ошибка регистрации:',
            error.message
        );

        // Обрабатываем конфликт уникального email.
        if (error.code === '23505') {
            return res.status(409).json({
                message: 'Пользователь с таким email уже зарегистрирован',
            });
        }

        return res.status(500).json({
            message: 'Ошибка сервера при регистрации',
        });

    } finally {

       if (client) {
    client.release();
}
    }
}

// Функция входа пользователя в CRM.
async function login(req, res) {
    try {
        // Получаем email и пароль из запроса.
        const { email, password } = req.body;

        // Проверяем, что оба поля заполнены.
        if (
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: 'Введите email и пароль'
            });
        }

        // Приводим email к единому формату.
        const normalizedEmail = email.trim().toLowerCase();

        // Ищем пользователя и его организацию в базе.
        const result = await pool.query(
            `SELECT
                u.id,
                u.name,
                u.email,
                u.password_hash,
                o.id AS organization_id,
                o.name AS organization_name,
                o.slug AS organization_slug,
                m.role
             FROM users u
             JOIN organization_members m ON m.user_id = u.id
             JOIN organizations o ON o.id = m.organization_id
             WHERE LOWER(TRIM(u.email)) = $1
             ORDER BY m.created_at ASC
             LIMIT 1`,
            [normalizedEmail]
        );

        // Если пользователь не найден, возвращаем ошибку входа.
        if (result.rows.length === 0) {
            return res.status(401).json({
                message: 'Неверный email или пароль'
            });
        }

        // Получаем найденную запись.
        const user = result.rows[0];

        // Сравниваем введённый пароль с хешем из базы.
        const passwordIsValid = await bcrypt.compare(
            password,
            user.password_hash
        );

        // Если пароль не совпадает, запрещаем вход.
        if (!passwordIsValid) {
            return res.status(401).json({
                message: 'Неверный email или пароль'
            });
        }

        // Создаём JWT-токен с данными пользователя и организации.
        const token = jwt.sign(
            {
                organizationId: String(user.organization_id),
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                subject: String(user.id),
                expiresIn: '7d'
            }
        );

        // Устанавливаем токен в защищённую cookie.
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/'
        });

        // Возвращаем информацию об успешно вошедшем пользователе.
        return res.status(200).json({
            message: 'Вход выполнен успешно',
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            },
            organization: {
                id: user.organization_id,
                name: user.organization_name,
                slug: user.organization_slug
            },
            role: user.role
        });

    } catch (error) {
        // Записываем подробность ошибки в серверный терминал.
        console.error('Ошибка входа:', error.message);

        // Возвращаем клиенту общую ошибку.
        return res.status(500).json({
            message: 'Ошибка сервера при входе'
        });
    }
}

// Функция выхода пользователя из CRM.
function logout(req, res) {

    // Удаляем авторизационную cookie из браузера.
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    });

    // Подтверждаем успешный выход.
    return res.status(200).json({
        message: 'Выход выполнен успешно'
    });
}

// Получаем данные текущего авторизованного пользователя.
async function getMe(req, res) {
    try {
        // Берём ID пользователя и организации из проверенного JWT.
        const userId = req.user.sub;
        const organizationId = req.user.organizationId;

        // Проверяем пользователя и его членство в организации.
        const result = await pool.query(
            `SELECT
                u.id,
                u.name,
                u.email,
                o.id AS organization_id,
                o.name AS organization_name,
                o.slug AS organization_slug,
                m.role,
                pa.role AS platform_role
             FROM users u
             JOIN organization_members m ON m.user_id = u.id
             JOIN organizations o ON o.id = m.organization_id
             LEFT JOIN platform_admins pa ON pa.user_id = u.id
             WHERE u.id = $1 AND o.id = $2
             LIMIT 1`,
            [userId, organizationId]
        );

        // Если пользователь или его членство не найдены.
        if (result.rows.length === 0) {
            return res.status(401).json({
                message: 'Пользователь или организация не найдены'
            });
        }

        // Получаем подтверждённые данные из базы.
        const user = result.rows[0];

        // Возвращаем информацию о текущем пользователе.
        return res.status(200).json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                platformRole: user.platform_role
            },
            organization: {
                id: user.organization_id,
                name: user.organization_name,
                slug: user.organization_slug
            },
            role: user.role
        });

    } catch (error) {
        // Выводим подробность ошибки в терминал сервера.
        console.error('Ошибка получения пользователя:', error.message);
        return res.status(500).json({
            message: 'Ошибка сервера'
        });
    }
}

// Экспортируем функцию регистрации.
module.exports = { register, login, logout, getMe };