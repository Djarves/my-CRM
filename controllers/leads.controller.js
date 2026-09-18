// Подключаем базу данных.
const pool = require('../db/database');

// Подключаем калькулятор.
const {
    calculatePrice,
} = require('../services/calculator.service');

// Подключаем Telegram.
const {
    sendTelegramMessage,
} = require('../services/telegram.service');


// Создание нового лида.
async function createLead(req, res) {

    try {

        // Получаем данные из тела запроса.
        const {
            name,
            phone,
            email,
            businessType,
            goal,
            description,
            budget,
            options,
            source,
        } = req.body;

        // Проверяем обязательное поле.
        if (!name) {

            return res.status(400).json({
                success: false,
                error: 'Имя обязательно',
            });
        }

        // Рассчитываем предварительную цену.
        const price = calculatePrice(options);

        // SQL-запрос для создания лида.
        const query = `
            INSERT INTO leads (
                name,
                phone,
                email,
                business_type,
                goal,
                description,
                budget,
                price_from,
                price_to,
                source
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9,
                $10
            )
            RETURNING *;
        `;

        // Передаём значения отдельно от SQL.
        // Это защищает запрос от SQL-инъекций.
        const values = [
            name,
            phone || null,
            email || null,
            businessType || null,
            goal || null,
            description || null,
            budget || 0,
            price.priceFrom,
            price.priceTo,
            source || 'configurator',
        ];

        // Отправляем запрос в PostgreSQL.
        const result = await pool.query(
            query,
            values
        );

        // Получаем созданного лида.
        const lead = result.rows[0];

        // Отправляем уведомление.
        await sendTelegramMessage(
            `🔥 <b>Новый лид!</b>

👤 Имя: ${lead.name}
📱 Телефон: ${lead.phone || '—'}
🏢 Бизнес: ${lead.business_type || '—'}
💰 Бюджет: ${lead.budget || '—'} ₽
💵 Предварительно: ${lead.price_from}–${lead.price_to} ₽`
        );

        // Отправляем результат клиенту.
        return res.status(201).json({
            success: true,
            lead,
        });

    } catch (error) {

        console.error(
            '❌ Ошибка создания лида:',
            error
        );

        return res.status(500).json({
            success: false,
            error: 'Ошибка сервера',
        });
    }
}


// Получение всех лидов.
async function getLeads(req, res) {

    try {

        const result = await pool.query(`
            SELECT *
            FROM leads
            ORDER BY id DESC
        `);

        return res.json(result.rows);

    } catch (error) {

        console.error(
            '❌ Ошибка получения лидов:',
            error
        );

        return res.status(500).json({
            success: false,
            error: 'Ошибка сервера',
        });
    }
}


// Изменение статуса лида.
async function updateLeadStatus(req, res) {

    try {

        // Получаем ID из URL.
        const id = Number(req.params.id);

        // Получаем новый статус.
        const { status } = req.body;

        // Допустимые этапы нашей воронки.
        const allowedStatuses = [
            'NEW',
            'CONTACTED',
            'DISCUSSION',
            'OFFER',
            'WON',
            'LOST',
        ];

        // Проверяем статус.
        if (!allowedStatuses.includes(status)) {

            return res.status(400).json({
                success: false,
                error: 'Недопустимый статус',
            });
        }

        console.log('🔄 Обновляем лид:', {
            id,
            status,
            });

        // Обновляем статус.
        const result = await pool.query(
            `
            UPDATE leads
            SET
                status = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *;
            `,
            [status, id]
        );

        console.log('✅ UPDATE выполнен:', result.rows[0]);

        // Если лид не найден.
        if (result.rowCount === 0) {

            return res.status(404).json({
                success: false,
                error: 'Лид не найден',
            });
        }

        // Возвращаем обновлённый лид.
        return res.json({
            success: true,
            lead: result.rows[0],
        });

    } catch (error) {

        console.error(
            '❌ Ошибка изменения статуса:',
            error
        );

        return res.status(500).json({
            success: false,
            error: 'Ошибка сервера',
        });
    }
}


// Экспортируем контроллеры.
module.exports = {
    createLead,
    getLeads,
    updateLeadStatus,
};