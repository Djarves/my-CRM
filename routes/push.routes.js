
const express = require('express');

const router = express.Router();

// Подключаем PostgreSQL.
const pool = require('../db/database');

// Подключаем проверку авторизации.
const authenticateToken = require('../middleware/auth');

// Подключаем сервис отправки Push.
const {
    sendPushNotification,
} = require('../services/push.service');


// ==================================================
// СОХРАНЕНИЕ PUSH-ПОДПИСКИ
// ==================================================

// Сначала проверяем авторизацию пользователя.
router.post('/subscribe', authenticateToken, async (req, res) => {

    try {

        // Получаем организацию из проверенной авторизации.
        const organizationId = req.user.organizationId;

        // Получаем Push-подписку от браузера.
        const subscription = req.body;

        // Проверяем структуру подписки.
        if (
            !subscription ||
            typeof subscription.endpoint !== 'string' ||
            !subscription.endpoint.startsWith('https://') ||
            !subscription.keys?.p256dh ||
            !subscription.keys?.auth
        ) {

            return res.status(400).json({
                message: 'Некорректная Push-подписка',
            });
        }

        console.log(
            '🔔 Получена Push-подписка для организации:',
            organizationId
        );

        // Сохраняем подписку с ID организации.
        const result = await pool.query(
            `
            INSERT INTO push_subscriptions
                (organization_id, endpoint, subscription)
            VALUES
                ($1, $2, $3)
            ON CONFLICT (endpoint)
            DO UPDATE SET
                subscription = EXCLUDED.subscription,
                updated_at = CURRENT_TIMESTAMP
            WHERE push_subscriptions.organization_id =
                  EXCLUDED.organization_id
            RETURNING id;
            `,
            [
                organizationId,
                subscription.endpoint,
                subscription,
            ]
        );

        // Если endpoint уже принадлежит другой организации,
        // не разрешаем перезаписать чужую подписку.
        if (result.rowCount === 0) {

            return res.status(409).json({
                message:
                    'Эта Push-подписка уже привязана к другой организации',
            });
        }

        console.log(
            '💾 Push-подписка сохранена'
        );

        return res.status(201).json({
            message: 'Push-подписка сохранена',
        });

    } catch (error) {

        console.error(
            '❌ Ошибка сохранения Push-подписки:',
            error.message
        );

        return res.status(500).json({
            message: 'Не удалось сохранить Push-подписку',
        });
    }
});


// ==================================================
// ТЕСТОВАЯ ОТПРАВКА PUSH
// ==================================================

// Тестовый маршрут тоже доступен только авторизованным.
router.post('/test', authenticateToken, async (req, res) => {

    try {

        // Получаем ID организации из авторизации.
        const organizationId = req.user.organizationId;

        // Ищем подписку только своей организации.
        const result = await pool.query(
            `
            SELECT subscription
            FROM push_subscriptions
            WHERE organization_id = $1
            ORDER BY id DESC
            LIMIT 1;
            `,
            [organizationId]
        );

        // Если подписок нет.
        if (result.rows.length === 0) {

            return res.status(404).json({
                message: 'Push-подписок пока нет',
            });
        }

        // Берём подписку своей организации.
        const subscription = result.rows[0].subscription;

        console.log(
            '📤 Отправляем тестовый Push для организации:',
            organizationId
        );

        // Отправляем настоящее Push-уведомление.
        await sendPushNotification(
            subscription,
            {
                title: 'SKLAD 🔔',
                body: 'Это тестовое Push-уведомление!',
                icon: '/icons/icon-192.png',
            }
        );

        console.log(
            '✅ Тестовый Push отправлен'
        );

        return res.json({
            message: 'Push-уведомление отправлено',
        });

    } catch (error) {

        console.error(
            '❌ Ошибка тестового Push:',
            error.message
        );

        return res.status(500).json({
            message: 'Не удалось отправить Push',
        });
    }
});


module.exports = router;
