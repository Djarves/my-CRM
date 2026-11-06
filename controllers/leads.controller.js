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
async function createLeadForOrganization(
    req,
    res,
    organizationId
) {

    try {

       if (!organizationId || !Number.isSafeInteger(Number(organizationId)) || Number(organizationId) <= 0) {
    return res.status(403).json({
        success: false,
        error: 'Некорректная организация',
    });
}

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
        organization_id,
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
        $11,
        $12
    )
    RETURNING *;
`;

        // Передаём значения отдельно от SQL.
        // Это защищает запрос от SQL-инъекций.
       const values = [
    organizationId,          // $1 — ID организации
    name,                    // $2 — имя клиента
    phone || null,           // $3 — телефон
    email || null,           // $4 — электронная почта
    businessType || null,    // $5 — тип бизнеса
    goal || null,            // $6 — цель проекта
    description || null,     // $7 — описание
    options || {},           // $8 — выбранные параметры
    budget || 0,             // $9 — бюджет
    price.priceFrom,         // $10 — минимальная цена
    price.priceTo,           // $11 — максимальная цена
    source || 'configurator' // $12 — источник заявки
];
        // Отправляем запрос в PostgreSQL.
        const result = await dbQuery(
            queryText,
            values
            );

        // Получаем созданного лида.
        const lead = result.rows[0];

        if (!lead) {
    throw new Error('PostgreSQL не вернул созданную заявку');
}

        // Отправляем Push-уведомление о новой заявке.
try {

 const subscriptionsResult = await dbQuery(
    `
        SELECT subscription
        FROM push_subscriptions
        WHERE organization_id = $1;
    `,
    [organizationId]
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
        WHERE endpoint = $1
          AND organization_id = $2;
    `,
    [
        row.subscription.endpoint,
        organizationId,
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
        WHERE id = $2
          AND organization_id = $3;
    `,
    [
        aiBrief,
        lead.id,
        organizationId,
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
       console.error(
    '❌ Ошибка генерации или сохранения AI-брифа:',
    error
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

// Создание заявки из авторизованной CRM.
async function createLead(req, res) {

    // Получаем организацию из проверенной авторизации.
    const organizationId = req.user?.organizationId;

    // Передаём запрос и организацию общей функции.
    return createLeadForOrganization(
        req,
        res,
        organizationId
    );
}

// Создание заявки из публичного конфигуратора.
async function createPublicLead(req, res) {

    try {

        // Находим организацию Sklad HQ по её уникальному slug.
        const organizationResult = await dbQuery(
            `
                SELECT id
                FROM organizations
                WHERE slug = $1
                LIMIT 1;
            `,
            ['sklad-hq']
        );

        // Проверяем, существует ли организация.
        if (organizationResult.rows.length === 0) {

            return res.status(500).json({
                success: false,
                error: 'Организация Sklad HQ не найдена',
            });
        }

        // Получаем настоящий ID организации из базы.
        const organizationId = organizationResult.rows[0].id;

        // Передаём заявку в общую функцию.
        return createLeadForOrganization(
            req,
            res,
            organizationId
        );

    } catch (error) {

        console.error(
            'Ошибка публичного создания заявки:',
            error
        );

        return res.status(500).json({
            success: false,
            error: 'Ошибка сервера',
        });
    }
}

// Получаем заявки только текущей организации.
async function getLeads(req, res) {

    try {

        // Берём ID организации из проверенного middleware.
        const organizationId = req.user.organizationId;

        // Получаем только заявки этой организации.
        const result = await dbQuery(
            `
                SELECT *
                FROM leads
                WHERE organization_id = $1
                ORDER BY id DESC
            `,
            [organizationId]
        );

        // Отправляем найденные заявки клиенту.
        return res.json(result.rows);

    } catch (error) {

        // Записываем ошибку в серверный терминал.
        console.error(
            '❌ Ошибка получения лидов:',
            error
        );

        // Отправляем ответ об ошибке.
        return res.status(500).json({
            success: false,
            error: 'Ошибка сервера',
        });
    }
}

// Обновление статуса лида.
async function updateLeadStatus(req, res) {
    try {
        // Получаем ID лида из URL.
        const id = Number(req.params.id);

        // Получаем ID организации из авторизации.
        const organizationId = req.user.organizationId;

        // Получаем новый статус.
        const { status } = req.body;

        // Проверяем корректность ID.
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Некорректный ID лида',
            });
        }

        // Допустимые этапы нашей воронки.
        const allowedStatuses = [
            'NEW',
            'CONTACTED',
            'DISCUSSION',
            'OFFER',
            'WON',
            'LOST',
        ];

        // Проверяем допустимость статуса.
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Недопустимый статус',
            });
        }

        // Обновляем лид только внутри своей организации.
        const result = await dbQuery(
            `
            UPDATE leads
            SET
                status = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
              AND organization_id = $3
            RETURNING *;
            `,
            [status, id, organizationId]
        );

        // Если лид не найден или принадлежит другой организации.
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

        // Получаем ID организации из авторизации.
        const organizationId = req.user.organizationId;

        // Проверяем корректность ID.
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Некорректный ID лида',
            });
        }

        // Удаляем лид только внутри своей организации.
        const result = await dbQuery(
            `
            DELETE FROM leads
            WHERE id = $1
              AND organization_id = $2
            RETURNING *;
            `,
            [id, organizationId]
        );

        // Если лид не найден или принадлежит другой организации.
        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Лид не найден',
            });
        }

        // Возвращаем удалённый лид.
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
// Экспортируем контроллеры.
module.exports = {
    createLead,
    createPublicLead,
    getLeads,
    updateLeadStatus,
    deleteLead,
};