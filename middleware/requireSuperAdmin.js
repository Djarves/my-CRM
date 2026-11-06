// Middleware проверяет глобальную роль пользователя.
function requireSuperAdmin(req, res, next) {

    // Проверяем, является ли пользователь Super Admin.
    if (req.user?.platformRole !== 'super_admin') {

        // Если глобальной роли нет — запрещаем доступ.
        return res.status(403).json({
            message: 'Доступ разрешён только Super Admin'
        });
    }

    // Если роль подтверждена — передаём управление дальше.
    next();
}

// Экспортируем middleware для подключения в маршрутах.
module.exports = requireSuperAdmin;