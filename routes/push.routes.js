const express = require('express');

const router = express.Router();

// Подключаем PostgreSQL.
const pool = require('../db/database');

// Подключаем сервис отправки Push.
const {
    sendPushNotification,
} = require('../services/push.service');


// ==================================================
// СОХРАНЕНИЕ PUSH-ПОДПИСКИ
// ==================================================

router.post('/subscribe', async (req, res) => {

    try {

        // Получаем Push-подписку от браузера.
        const subscription = req.body;

        // Проверяем, что подписка действительно содержит endpoint.
        if (!subscription?.endpoint) {

            return res.status(400).json({
                message:
                    'Push-подписка не содержит endpoint',
            });
        }

        console.log(
            '🔔 Получена Push-подписка:',
            subscription.endpoint
        );

        // Сохраняем подписку в PostgreSQL.
        //
        // Если такой endpoint уже существует,
        // обновляем существующую подписку.
        await pool.query(
            `
            INSERT INTO push_subscriptions
                (endpoint, subscription)
            VALUES
                ($1, $2)
            ON CONFLICT (endpoint)
            DO UPDATE SET
                subscription = EXCLUDED.subscription,
                updated_at = CURRENT_TIMESTAMP
            `,
            [
                subscription.endpoint,
                subscription,
            ]
        );

        console.log(
            '💾 Push-подписка сохранена в PostgreSQL'
        );

        // Отвечаем frontend.
        res.status(201).json({
            message:
                'Push-подписка сохранена',
        });

    } catch (error) {

        console.error(
            '❌ Ошибка сохранения Push-подписки:',
            error.message
        );

        res.status(500).json({
            message:
                'Не удалось сохранить Push-подписку',
        });
    }
});


// ==================================================
// ТЕСТОВАЯ ОТПРАВКА PUSH
// ==================================================

router.post('/test', async (req, res) => {

    try {

        // Получаем последнюю Push-подписку
        // из PostgreSQL.
        const result = await pool.query(
            `
            SELECT subscription
            FROM push_subscriptions
            ORDER BY id DESC
            LIMIT 1
            `
        );

        // Если подписок нет.
        if (result.rows.length === 0) {

            return res.status(404).json({
                message:
                    'Push-подписок пока нет',
            });
        }

        // Берём сохранённую подписку.
        const subscription =
            result.rows[0].subscription;

        console.log(
            '📤 Отправляем тестовый Push...'
        );

        // Отправляем настоящее Push-уведомление
        // через web-push.
        await sendPushNotification(
            subscription,
            {
                title: 'My CRM 🔔',

                body:
                    'Это настоящее Push-уведомление с backend!',

                icon:
                    '/icons/icon-192.png',
            }
        );

        console.log(
            '✅ Тестовый Push отправлен'
        );

        res.json({
            message:
                'Push-уведомление отправлено',
        });

    } catch (error) {

        console.error(
            '❌ Ошибка тестового Push:',
            error.message
        );

        res.status(500).json({
            message:
                'Не удалось отправить Push',
        });
    }
});


module.exports = router;