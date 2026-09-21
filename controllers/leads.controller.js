// Подключаем базу данных.
const dbQuery = require('../db/query');

// Подключаем калькулятор.
const {
    calculatePrice,
} = require('../services/calculator.service');

// Сервис для генерации AI-брифа.
const {
    generateAiBrief,
} = require('../services/ai.service');

const {
    sendPushNotification,
} = require('../services/push.service');


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
        const queryText = `
            INSERT INTO leads (
                name,
                phone,
                email,
                business_type,
                goal,
                description,
                options,
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
                $10,
                $11
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
            options || {},
            budget || 0,
            price.priceFrom,
            price.priceTo,
            source || 'configurator',
        ];

        // Отправляем запрос в PostgreSQL.
        const result = await dbQuery(
            queryText,
            values
            );

        // Получаем созданного лида.
        const lead = result.rows[0];

        // Отправляем Push-уведомление о новой заявке.
try {

    // Получаем все Push-подписки из базы.
    const subscriptionsResult = await dbQuery(
        `
            SELECT subscription
            FROM push_subscriptions;
        `
    );

    // Отправляем уведомление каждой подписке.
    for (const row of subscriptionsResult.rows) {

        try {

            await sendPushNotification(
                row.subscription,
                {
                    title: 'Новая заявка 🔔',
                    body: `Новая заявка от ${lead.name}`,
                    icon: '/icons/icon-192.png',
                }
            );

       } catch (pushError) {

    // Ошибка Push не должна ломать создание заявки.
    console.error(
        '❌ Не удалось отправить Push:',
        pushError.message
    );

    // Если подписка больше не существует,
    // удаляем её из PostgreSQL.
    if (
        pushError.statusCode === 404 ||
        pushError.statusCode === 410
    ) {

        await dbQuery(
            `
                DELETE FROM push_subscriptions
                WHERE endpoint = $1;
            `,
            [
                row.subscription.endpoint,
            ]
        );

        console.log(
            '🗑️ Недействительная Push-подписка удалена из базы'
        );
    }
}
    }

} catch (pushError) {

    // Даже если проблема с получением подписок,
    // заявка уже создана и должна остаться сохранённой.
    console.error(
        '❌ Ошибка Push-уведомления:',
        pushError.message
    );
}

        // Передаём созданного лида в GigaChat.
generateAiBrief(lead)
   .then(async (aiBrief) => {

    // Обновляем созданного лида
    // и записываем AI-бриф в базу данных.
    await dbQuery(
        `
            UPDATE leads
            SET ai_brief = $1
            WHERE id = $2;
        `,
        [
            aiBrief,
            lead.id,
        ]
    );

    // Показываем сообщение,
    // чтобы убедиться, что запись прошла.
    console.log(
        '🤖 AI-бриф сохранён в базе для лида:',
        lead.id
    );

})
    .catch((error) => {

        // Если GigaChat не сработал,
        // заявка всё равно остаётся сохранённой.
        console.error(
            '❌ Ошибка генерации AI-брифа:',
            error.message
        );

    });


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

        const result = await dbQuery(`
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

       
        // Обновляем статус.
        const result = await dbQuery(
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

// Удаление лида.
async function deleteLead(req, res) {

    try {

        // Получаем ID лида из URL.
        const id = Number(req.params.id);

        // Удаляем лид из базы данных.
        const result = await dbQuery(
            `
            DELETE FROM leads
            WHERE id = $1
            RETURNING *;
            `,
            [id]
        );

        // Если такого лида нет.
        if (result.rowCount === 0) {

            return res.status(404).json({
                success: false,
                error: 'Лид не найден',
            });
        }

        // Возвращаем удалённого лида.
        return res.json({
            success: true,
            lead: result.rows[0],
        });

    } catch (error) {

        console.error(
            '❌ Ошибка удаления лида:',
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
    deleteLead,
};