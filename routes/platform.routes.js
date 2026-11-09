// Подключаем Express.
const express = require('express');

// Создаём отдельный маршрутизатор платформы.
const router = express.Router();

// Подключаем проверку авторизации.
const authenticateToken = require('../middleware/auth');

// Подключаем проверку глобальной роли Super Admin.
const requireSuperAdmin = require('../middleware/requireSuperAdmin');

// Подключаем контроллер статистики платформы.
const {
    getPlatformStats,
    getOrganizations,
    getPlatformUsers,
    blockOrganization,
    unblockOrganization,
    blockPlatformUser,
    unblockPlatformUser
} = require('../controllers/platform.controller');

// Тестовый защищённый маршрут платформы.
router.get('/check', authenticateToken, requireSuperAdmin, (req, res) => {

    // Отправляем подтверждение успешной проверки.
    res.json({
        message: 'Доступ к управлению SKLAD разрешён',
        user: req.user
    });

});

// Получение общей статистики SKLAD.
// Доступ разрешён только Super Admin.
router.get(
    '/stats',
    authenticateToken,
    requireSuperAdmin,
    getPlatformStats
);

// Получение списка всех организаций платформы.
// Доступ разрешён только Super Admin.
router.get(
    '/organizations',
    authenticateToken,
    requireSuperAdmin,
    getOrganizations
);

// Получение списка всех пользователей платформы.
// Доступ разрешён только Super Admin.
router.get(
    '/users',
    authenticateToken,
    requireSuperAdmin,
    getPlatformUsers
);

// Блокировка организации.
// Доступ разрешён только Super Admin.
router.patch(
    '/organizations/:id/block',
    authenticateToken,
    requireSuperAdmin,
    blockOrganization
);

// Разблокировка организации.
// Доступ разрешён только Super Admin.
router.patch(
    '/organizations/:id/unblock',
    authenticateToken,
    requireSuperAdmin,
    unblockOrganization
);

// Блокировка пользователя.
// Доступ разрешён только Super Admin.
router.patch(
    '/users/:id/block',
    authenticateToken,
    requireSuperAdmin,
    blockPlatformUser
);

// Разблокировка пользователя.
// Доступ разрешён только Super Admin.
router.patch(
    '/users/:id/unblock',
    authenticateToken,
    requireSuperAdmin,
    unblockPlatformUser
);

// Экспортируем маршрутизатор.
module.exports = router;