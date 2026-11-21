// Подключаем базу данных.
const dbQuery = require('../db/query');

// Подключаем калькулятор.
const {
    calculatePrice,
    sanitizeOptions,
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
    organizationId,
    source
) {

    try {

        // Проверяем ID организации.
        const safeOrganizationId = Number(organizationId);

        if (
            !Number.isSafeInteger(safeOrganizationId) ||
            safeOrganizationId <= 0
        ) {

            return res.status(403).json({
                success: false,
                error: 'Некорректная организация',
            });
        }

        // Проверяем допустимый источник заявки.
        const allowedSources = [
            'crm',
            'configurator',
            'universal_configurator',
        ];

        if (!allowedSources.includes(source)) {

            return res.status(400).json({
                success: false,
                error: 'Некорректный источник заявки',
            });

        }

        // Проверяем, что тело запроса — объект.
        if (
            !req.body ||
            typeof req.body !== 'object' ||
            Array.isArray(req.body)
        ) {
            return res.status(400).json({
                success: false,
                error: 'Некорректные данные запроса',
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
        } = req.body;

        // Проверяем имя клиента.
        if (
            typeof name !== 'string' ||
            !name.trim() ||
            name.trim().length > 100
        ) {

            return res.status(400).json({
                success: false,
                error: 'Укажите имя длиной не более 100 символов',
            });

        }

        // Убираем пробелы в начале и конце имени.
        const safeName = name.trim();

        // Проверяем телефон, если клиент его указал.
        let safePhone = null;

        if (phone !== undefined && phone !== null && phone !== '') {

            if (
                typeof phone !== 'string' ||
                phone.trim().length < 5 ||
                phone.trim().length > 30
            ) {

                return res.status(400).json({
                    success: false,
                    error: 'Проверьте правильность номера телефона',
                });

            }

            // Убираем пробелы по краям.
            safePhone = phone.trim();

        }

        // Проверяем электронную почту, если клиент её указал.
        let safeEmail = null;

        if (email !== undefined && email !== null && email !== '') {

            if (
                typeof email !== 'string' ||
                email.trim().length > 254 ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
            ) {

                return res.status(400).json({
                    success: false,
                    error: 'Проверьте правильность электронной почты',
                });

            }

            // Убираем пробелы и приводим адрес к нижнему регистру.
            safeEmail = email.trim().toLowerCase();

        }

        // Проверяем бюджет клиента.
        let safeBudget = 0;

        if (budget !== undefined && budget !== null && budget !== '') {

            const numericBudget = Number(budget);

            if (
                !Number.isFinite(numericBudget) ||
                numericBudget < 0 ||
                numericBudget > 1000000000
            ) {

                return res.status(400).json({
                    success: false,
                    error: 'Некорректное значение бюджета',
                });

            }

            // Сохраняем проверенное числовое значение.
            safeBudget = numericBudget;

        }

        // Проверяем тип бизнеса.
        let safeBusinessType = null;

        if (businessType !== undefined && businessType !== null && businessType !== '') {

            if (
                typeof businessType !== 'string' ||
                businessType.trim().length > 100
            ) {

                return res.status(400).json({
                    success: false,
                    error: 'Некорректный тип бизнеса',
                });

            }

            safeBusinessType = businessType.trim();

        }


        // Проверяем цель проекта.
        let safeGoal = null;

        if (goal !== undefined && goal !== null && goal !== '') {

            if (
                typeof goal !== 'string' ||
                goal.trim().length > 500
            ) {

                return res.status(400).json({
                    success: false,
                    error: 'Некорректная цель проекта',
                });

            }

            safeGoal = goal.trim();

        }


        // Проверяем описание проекта.
        let safeDescription = null;

        if (description !== undefined && description !== null && description !== '') {

            if (
                typeof description !== 'string' ||
                description.trim().length > 3000
            ) {

                return res.status(400).json({
                    success: false,
                    error: 'Описание проекта слишком длинное или имеет неверный формат',
                });

            }

            safeDescription = description.trim();

        }

        // Проверяем структуру параметров конфигуратора.
        if (
            options !== undefined &&
            (
                options === null ||
                typeof options !== 'object' ||
                Array.isArray(options)
            )
        ) {

            return res.status(400).json({
                success: false,
                error: 'Некорректные параметры конфигуратора',
            });

        }

        // Очищаем параметры конфигуратора.
        const safeOptions = sanitizeOptions(options);

        // Рассчитываем цену только по проверенным параметрам.
        const price = calculatePrice(safeOptions);

        // Добавляем проверенные услуги универсального конфигуратора.
        if (source === 'universal_configurator') {
            safeOptions.services = (req.validatedServices || []).map(
                (service) => ({
                    id: service.id,
                    name: service.name,
                    description: service.description,
                    price_from: service.price_from,
                    price_to: service.price_to,
                })
            );
        }

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
            safeOrganizationId,      // $1 — проверенный ID организации
            safeName, // $2 — проверенное имя клиента
            safePhone, // $3 — проверенный телефон
            safeEmail, // $4 — проверенная электронная почта
            safeBusinessType,        // $5 — проверенный тип бизнеса
            safeGoal,                // $6 — проверенная цель проекта
            safeDescription,         // $7 — проверенное описание
            safeOptions,              // $8 — проверенные параметры
            safeBudget, // $9 — проверенный бюджет
            price.priceFrom,         // $10 — минимальная цена
            price.priceTo,           // $11 — максимальная цена
            source, // $12 — проверенный источник заявки
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
                [safeOrganizationId]
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
                                safeOrganizationId,
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
                        safeOrganizationId,
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

// Создание заявки внутри CRM.
async function createLead(req, res) {

    // Получаем организацию из проверенной авторизации.
    const organizationId = req.user?.organizationId;

    // Передаём запрос, организацию и источник заявки.
    return createLeadForOrganization(
        req,
        res,
        organizationId,
        'crm'
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

        return createLeadForOrganization(
            req,
            res,
            organizationId,
            'configurator'
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
        if (!Number.isSafeInteger(id) || id <= 0) {
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
        if (
            typeof status !== 'string' ||
            !allowedStatuses.includes(status)
        ) {
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

// Редактирование данных лида.
async function updateLead(req, res) {
    try {
        const id = Number(req.params.id);
        const organizationId = req.user.organizationId;
        // Проверяем структуру тела запроса.
        if (
            !req.body ||
            typeof req.body !== 'object' ||
            Array.isArray(req.body)
        ) {
            return res.status(400).json({
                success: false,
                error: 'Некорректные данные запроса',
            });
        }
        // Получаем данные запроса.
        const { name, phone, email, budget } = req.body;

        // Проверяем, какие поля действительно переданы.
        const hasName = Object.hasOwn(req.body, 'name');
        const hasPhone = Object.hasOwn(req.body, 'phone');
        const hasEmail = Object.hasOwn(req.body, 'email');
        const hasBudget = Object.hasOwn(req.body, 'budget');
        // Проверяем, что передано хотя бы одно поле для обновления.
        if (!hasName && !hasPhone && !hasEmail && !hasBudget) {
            return res.status(400).json({
                success: false,
                error: 'Не указаны данные для обновления',
            });
        }
        // Проверяем ID лида.
        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Некорректный ID лида',
            });
        }

        // Подготавливаем имя клиента.
        let safeName = null;

        // Проверяем имя, только если оно передано.
        if (hasName) {

            if (
                typeof name !== 'string' ||
                !name.trim() ||
                name.trim().length > 100
            ) {
                return res.status(400).json({
                    success: false,
                    error: 'Укажите имя длиной не более 100 символов',
                });
            }

            // Сохраняем очищенное имя.
            safeName = name.trim();
        }

        // Подготавливаем телефон клиента.
        let safePhone = null;

        // Проверяем телефон, только если он передан.
        if (hasPhone) {

            // Пустое значение разрешает очистить телефон.
            if (phone !== null && phone !== '') {

                if (
                    typeof phone !== 'string' ||
                    phone.trim().length < 5 ||
                    phone.trim().length > 30
                ) {
                    return res.status(400).json({
                        success: false,
                        error: 'Некорректный номер телефона',
                    });
                }

                // Сохраняем очищенный телефон.
                safePhone = phone.trim();
            }
        }

        // Подготавливаем email клиента.
        let safeEmail = null;

        // Проверяем email, только если он передан.
        if (hasEmail) {

            // Пустое значение разрешает очистить email.
            if (email !== null && email !== '') {

                if (typeof email !== 'string') {
                    return res.status(400).json({
                        success: false,
                        error: 'Некорректный email',
                    });
                }

                const normalizedEmail = email.trim().toLowerCase();

                if (
                    normalizedEmail.length > 254 ||
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
                ) {
                    return res.status(400).json({
                        success: false,
                        error: 'Укажите корректный email',
                    });
                }

                // Сохраняем нормализованный email.
                safeEmail = normalizedEmail;
            }
        }

        // Подготавливаем бюджет.
        let parsedBudget = null;

        // Проверяем бюджет, только если он передан.
        if (hasBudget) {

            // Пустое значение разрешает очистить бюджет.
            if (budget !== null && budget !== '') {

                parsedBudget = Number(budget);

                if (
                    !Number.isFinite(parsedBudget) ||
                    parsedBudget < 0 ||
                    parsedBudget > 1_000_000_000
                ) {
                    return res.status(400).json({
                        success: false,
                        error: 'Бюджет должен быть от 0 до 1 000 000 000',
                    });
                }
            }
        }

        // Обновляем данные лида только внутри своей организации.
        const result = await dbQuery(
            `
    UPDATE leads
    SET
        name = CASE WHEN $1 THEN $2 ELSE name END,
        phone = CASE WHEN $3 THEN $4 ELSE phone END,
        email = CASE WHEN $5 THEN $6 ELSE email END,
        budget = CASE WHEN $7 THEN $8 ELSE budget END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $9
      AND organization_id = $10
    RETURNING *;
    `,
            [
                hasName,
                safeName,
                hasPhone,
                safePhone,
                hasEmail,
                safeEmail,
                hasBudget,
                parsedBudget,
                id,
                organizationId
            ]
        );
        // Проверяем, найден ли лид.
        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Лид не найден',
            });
        }

        return res.json({
            success: true,
            lead: result.rows[0],
        });
    } catch (error) {
        console.error(
            '❌ Ошибка редактирования лида:',
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
        if (!Number.isSafeInteger(id) || id <= 0) {
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
module.exports = {
    createLead,
    createPublicLead,
    createLeadForOrganization,
    getLeads,
    updateLeadStatus,
    updateLead,
    deleteLead,
};