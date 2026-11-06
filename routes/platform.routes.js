// Подключаем Express.
const express = require('express');

// Создаём отдельный маршрутизатор платформы.
const router = express.Router();

// Подключаем проверку авторизации.
const authenticateToken = require('../middleware/auth');

// Подключаем проверку глобальной роли Super Admin.
const requireSuperAdmin = require('../middleware/requireSuperAdmin');

// Тестовый защищённый маршрут платформы.
router.get('/check', authenticateToken, requireSuperAdmin, (req, res) => {

    // Отправляем подтверждение успешной проверки.
    res.json({
        message: 'Доступ к управлению SKLAD разрешён',
        user: req.user
    });

});

// Экспортируем маршрутизатор.
module.exports = router;