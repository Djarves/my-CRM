// Подключаем базу данных.
const dbQuery = require('../db/query');

// Подключаем общую функцию создания заявки.
const {
    createLeadForOrganization,
} = require('./leads.controller');

// Создание публичной заявки для организации через универсальный конфигуратор.
async function createUniversalLead(req, res) {
    try {
        // Получаем slug организации из URL.
        const { slug } = req.params;

        // Проверяем, что slug передан.
        if (
            typeof slug !== 'string' ||
            !/^[a-z0-9-]{1,100}$/.test(slug)
        ) {
            return res.status(400).json({
                success: false,
                error: 'Не указана организация.',
            });
        }

        // Ищем организацию по slug и проверяем, что она не заблокирована.
        const result = await dbQuery(
            `SELECT id
             FROM organizations
             WHERE slug = $1
               AND is_blocked = false
             LIMIT 1`,
            [slug]
        );

        // Если организация не найдена или заблокирована.
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Организация не найдена или заблокирована.',
            });
        }

        // Получаем ID организации из базы данных.
        const organizationId = result.rows[0].id;

        // Получаем ID услуг, выбранных клиентом.
        const serviceIds = req.body?.serviceIds ?? [];

        // Проверяем формат списка услуг.
        if (
            !Array.isArray(serviceIds) ||
            serviceIds.length > 30
        ) {
            return res.status(400).json({
                success: false,
                error: 'Некорректный список услуг.',
            });
        }

        // Проверяем каждый ID.
        const safeServiceIds = serviceIds.map(Number);

        if (
            safeServiceIds.some(
                (id) => !Number.isSafeInteger(id) || id <= 0
            )
        ) {
            return res.status(400).json({
                success: false,
                error: 'Некорректный ID услуги.',
            });
        }

        // Убираем повторяющиеся ID.
        const uniqueServiceIds = [...new Set(safeServiceIds)];

        // Получаем услуги только этой организации.
        const servicesResult = await dbQuery(
            `SELECT
        id,
        name,
        description,
        price_from,
        price_to
     FROM configurator_services
     WHERE organization_id = $1
       AND id = ANY($2::bigint[])
       AND is_active = true`,
            [organizationId, uniqueServiceIds]
        );

        // Проверяем, что все выбранные услуги существуют.
        if (servicesResult.rows.length !== uniqueServiceIds.length) {
            return res.status(400).json({
                success: false,
                error: 'Некоторые выбранные услуги недоступны.',
            });
        }

        // Сохраняем проверенные сервером услуги для создания заявки.
        req.validatedServices = servicesResult.rows;

        // Передаём заявку общей функции создания.
        return createLeadForOrganization(
            req,
            res,
            organizationId,
            'universal_configurator'
        );
    } catch (error) {
        console.error(
            'Ошибка создания заявки универсального конфигуратора:',
            error
        );

        return res.status(500).json({
            success: false,
            error: 'Не удалось отправить заявку.',
        });
    }
}

// Получение публичной информации об организации.
async function getPublicOrganization(req, res) {
    try {
        // Получаем slug организации из URL.
        const { slug } = req.params;

        // Проверяем корректность slug.
        if (
            typeof slug !== 'string' ||
            !/^[a-z0-9-]{1,100}$/.test(slug)
        ) {
            return res.status(400).json({
                success: false,
                error: 'Некорректный адрес организации.',
            });
        }

        // Ищем организацию, которая не заблокирована.
        const result = await dbQuery(
            `SELECT name, slug
             FROM organizations
             WHERE slug = $1
               AND is_blocked = false
             LIMIT 1`,
            [slug]
        );

        // Если организация не найдена.
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Организация не найдена.',
            });
        }

        // Возвращаем только публичные данные.
        return res.json({
            success: true,
            organization: result.rows[0],
        });

    } catch (error) {
        console.error(
            'Ошибка получения организации:',
            error
        );

        return res.status(500).json({
            success: false,
            error: 'Не удалось загрузить информацию об организации.',
        });
    }
}


// Получение активных услуг публичного конфигуратора.
async function getPublicOrganizationServices(req, res) {
    try {

        // Получаем slug организации из URL.
        const { slug } = req.params;

        // Проверяем корректность slug.
        if (
            typeof slug !== 'string' ||
            !/^[a-z0-9-]{1,100}$/.test(slug)
        ) {
            return res.status(400).json({
                success: false,
                error: 'Некорректный адрес организации.',
            });
        }

        // Проверяем, существует ли организация и не заблокирована ли она.
        const organizationResult = await dbQuery(
            `SELECT id
             FROM organizations
             WHERE slug = $1
               AND is_blocked = false
             LIMIT 1`,
            [slug]
        );

        // Если организация не найдена или заблокирована.
        if (organizationResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Организация не найдена или заблокирована.',
            });
        }

        // Получаем ID организации.
        const organizationId = organizationResult.rows[0].id;

        // Получаем только активные услуги этой организации.
        const servicesResult = await dbQuery(
            `SELECT
                id,
                name,
                description,
                category,
                price_from,
                price_to
             FROM configurator_services
             WHERE organization_id = $1
               AND is_active = true
             ORDER BY sort_order ASC, id ASC`,
            [organizationId]
        );

        // Возвращаем список услуг.
        return res.json({
            success: true,
            services: servicesResult.rows,
        });

    } catch (error) {

        console.error(
            'Ошибка получения услуг конфигуратора:',
            error
        );

        return res.status(500).json({
            success: false,
            error: 'Не удалось загрузить услуги.',
        });
    }
}

module.exports = {
    createUniversalLead,
    getPublicOrganization,
    getPublicOrganizationServices,
};
