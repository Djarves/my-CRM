
const dbQuery = require('../db/query');

// Получаем общую статистику платформы SKLAD.
async function getPlatformStats(req, res) {

    try {

        // Считаем общее количество организаций.
        const organizationsResult = await dbQuery(
            'SELECT COUNT(*) AS total FROM organizations'
        );

        // Считаем количество уникальных пользователей.
        const usersResult = await dbQuery(
            'SELECT COUNT(DISTINCT id) AS total FROM users'
        );

        // Считаем общее количество лидов.
        const leadsResult = await dbQuery(
            'SELECT COUNT(*) AS total FROM leads'
        );

        // Считаем организации, у которых есть хотя бы один лид.
        const activeOrganizationsResult = await dbQuery(
            `SELECT COUNT(DISTINCT organization_id) AS total
             FROM leads
             WHERE organization_id IS NOT NULL`
        );

        // Отправляем статистику frontend.
        res.json({
            organizations: Number(organizationsResult.rows[0].total),
            users: Number(usersResult.rows[0].total),
            leads: Number(leadsResult.rows[0].total),
            activeOrganizations: Number(activeOrganizationsResult.rows[0].total)
        });

    } catch (error) {

        // Записываем ошибку в консоль сервера.
        console.error('Ошибка получения статистики SKLAD:', error);

        // Возвращаем frontend сообщение об ошибке.
        res.status(500).json({
            error: 'Не удалось получить статистику платформы'
        });
    }
}

// Получаем список всех организаций платформы.
async function getOrganizations(req, res) {
    try {
        const result = await dbQuery(
            `SELECT
                o.id,
                o.name,
                o.slug,
               o.created_at,

                -- Статус блокировки организации.
                o.is_blocked,
                o.blocked_at,
                o.blocked_reason,

                COUNT(DISTINCT om.user_id)::int AS users_count,
                COUNT(DISTINCT l.id)::int AS leads_count
            FROM organizations o

            LEFT JOIN organization_members om
                ON om.organization_id = o.id

            LEFT JOIN leads l
                ON l.organization_id = o.id

            GROUP BY
            o.id,
            o.name,
            o.slug,
            o.created_at,
            o.is_blocked,
            o.blocked_at,
            o.blocked_reason

            ORDER BY o.created_at DESC`
        );

        res.json({
            organizations: result.rows
        });

    } catch (error) {
        console.error(
            'Ошибка получения организаций SKLAD:',
            error
        );

        res.status(500).json({
            error: 'Не удалось получить список организаций'
        });
    }
}

// Получаем список всех пользователей платформы.
async function getPlatformUsers(req, res) {
    try {
        const result = await dbQuery(
            `SELECT
                u.id,
                u.name,
               u.email,
                u.created_at,

                -- Статус блокировки пользователя.
                u.is_blocked,
                u.blocked_at,
                u.blocked_reason,

                o.name AS organization_name,

                om.role AS organization_role,

                COALESCE(
                    pa.role,
                    'user'
                ) AS platform_role

            FROM users u

            LEFT JOIN organization_members om
                ON om.user_id = u.id

            LEFT JOIN organizations o
                ON o.id = om.organization_id

            LEFT JOIN platform_admins pa
                ON pa.user_id = u.id

            ORDER BY u.created_at DESC`
        );

        res.json({
            users: result.rows
        });

    } catch (error) {
        console.error(
            'Ошибка получения пользователей SKLAD:',
            error
        );

        res.status(500).json({
            error: 'Не удалось получить список пользователей'
        });
    }
}

// Блокируем организацию.
async function blockOrganization(req, res) {
    try {
        // Получаем ID организации из URL.
        const organizationId = Number(req.params.id);

        // Получаем причину блокировки.
        const reason = req.body.reason?.trim();

        // Проверяем корректность ID.
        if (!Number.isInteger(organizationId) || organizationId <= 0) {
            return res.status(400).json({
                message: 'Некорректный ID организации'
            });
        }

        // Проверяем, указана ли причина.
        if (!reason) {
            return res.status(400).json({
                message: 'Укажите причину блокировки'
            });
        }

        // Устанавливаем блокировку организации.
        const result = await dbQuery(
            `UPDATE organizations
             SET
                is_blocked = TRUE,
                blocked_at = NOW(),
                blocked_reason = $2
             WHERE id = $1
             RETURNING id, name, is_blocked, blocked_at, blocked_reason`,
            [organizationId, reason]
        );

        // Проверяем, существует ли организация.
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Организация не найдена'
            });
        }

        // Возвращаем обновлённые данные.
        res.json({
            message: 'Организация заблокирована',
            organization: result.rows[0]
        });

    } catch (error) {
        console.error('Ошибка блокировки организации:', error);

        res.status(500).json({
            message: 'Не удалось заблокировать организацию'
        });
    }
}

// Разблокируем организацию.
async function unblockOrganization(req, res) {
    try {
        // Получаем ID организации из URL.
        const organizationId = Number(req.params.id);

        // Проверяем корректность ID.
        if (!Number.isInteger(organizationId) || organizationId <= 0) {
            return res.status(400).json({
                message: 'Некорректный ID организации'
            });
        }

        // Снимаем блокировку и очищаем её причину.
        const result = await dbQuery(
            `UPDATE organizations
             SET
                is_blocked = FALSE,
                blocked_at = NULL,
                blocked_reason = NULL
             WHERE id = $1
             RETURNING id, name, is_blocked, blocked_at, blocked_reason`,
            [organizationId]
        );

        // Проверяем, существует ли организация.
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Организация не найдена'
            });
        }

        // Возвращаем обновлённые данные.
        res.json({
            message: 'Организация разблокирована',
            organization: result.rows[0]
        });

    } catch (error) {
        console.error('Ошибка разблокировки организации:', error);

        res.status(500).json({
            message: 'Не удалось разблокировать организацию'
        });
    }
}

// Блокируем пользователя.
async function blockPlatformUser(req, res) {
    try {
        // Получаем ID пользователя из URL.
        const userId = Number(req.params.id);

        // Получаем причину блокировки.
        const reason = req.body.reason?.trim();

        // Проверяем корректность ID.
        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                message: 'Некорректный ID пользователя'
            });
        }

        // Проверяем, указана ли причина.
        if (!reason) {
            return res.status(400).json({
                message: 'Укажите причину блокировки'
            });
        }

        // Блокируем только обычных пользователей.
        // Super Admin защищён непосредственно на уровне SQL.
        const result = await dbQuery(
            `UPDATE users
             SET
                is_blocked = TRUE,
                blocked_at = NOW(),
                blocked_reason = $2
             WHERE
                id = $1
                AND NOT EXISTS (
                    SELECT 1
                    FROM platform_admins
                    WHERE user_id = users.id
                      AND role = 'super_admin'
                )
             RETURNING id, name, email, is_blocked, blocked_at, blocked_reason`,
            [userId, reason]
        );

        // Если пользователь не обновлён,
        // выясняем причину.
        if (result.rows.length === 0) {

            const userResult = await dbQuery(
                'SELECT id FROM users WHERE id = $1',
                [userId]
            );

            if (userResult.rows.length === 0) {
                return res.status(404).json({
                    message: 'Пользователь не найден'
                });
            }

            return res.status(403).json({
                message: 'Нельзя заблокировать Super Admin'
            });
        }

        // Возвращаем обновлённые данные.
        res.json({
            message: 'Пользователь заблокирован',
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Ошибка блокировки пользователя:', error);

        res.status(500).json({
            message: 'Не удалось заблокировать пользователя'
        });
    }
}

// Разблокируем пользователя.
async function unblockPlatformUser(req, res) {
    try {
        // Получаем ID пользователя из URL.
        const userId = Number(req.params.id);

        // Проверяем корректность ID.
        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                message: 'Некорректный ID пользователя'
            });
        }

        // Снимаем блокировку и очищаем её причину.
        const result = await dbQuery(
            `UPDATE users
             SET
                is_blocked = FALSE,
                blocked_at = NULL,
                blocked_reason = NULL
             WHERE id = $1
             RETURNING id, name, email, is_blocked, blocked_at, blocked_reason`,
            [userId]
        );

        // Проверяем, существует ли пользователь.
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Пользователь не найден'
            });
        }

        // Возвращаем обновлённые данные.
        res.json({
            message: 'Пользователь разблокирован',
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Ошибка разблокировки пользователя:', error);

        res.status(500).json({
            message: 'Не удалось разблокировать пользователя'
        });
    }
}

// Экспортируем контроллер.
module.exports = {
    getPlatformStats,
    getOrganizations,
    getPlatformUsers,
    blockOrganization,
    unblockOrganization,
    blockPlatformUser,
    unblockPlatformUser
};