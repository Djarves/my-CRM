// Подключаем библиотеку для проверки JWT.
const jwt = require('jsonwebtoken');

// Подключаем соединение с PostgreSQL.
const pool = require('../db/database');

// Middleware проверяет авторизацию пользователя.
async function authenticateToken(req, res, next) {

  // Получаем JWT из HttpOnly cookie.
  const token = req.cookies?.token;

  // Если cookie отсутствует, пользователь не авторизован.
  if (!token) {
    return res.status(401).json({
      message: 'Необходима авторизация'
    });
  }

  // Проверяем подпись и срок действия токена.
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {

    // Если токен недействителен или истёк.
    if (err) {
      return res.status(403).json({
        message: 'Недействительный токен'
      });
    }

    // Проверяем, что в токене есть ID пользователя и организации.
    if (!decoded.sub || !decoded.organizationId) {
      return res.status(403).json({
        message: 'Некорректные данные авторизации'
      });
    }

    try {

      // Проверяем пользователя и его членство в организации через БД.
     const result = await pool.query(
  `SELECT
    u.id AS user_id,
    om.organization_id,
    om.role,
    pa.role AS platform_role
  FROM users u
  JOIN organization_members om
    ON om.user_id = u.id
  LEFT JOIN platform_admins pa
    ON pa.user_id = u.id
  WHERE u.id = $1
    AND om.organization_id = $2
  LIMIT 1`,
  [decoded.sub, decoded.organizationId]
);

      // Если пользователь или его членство не найдены.
      if (result.rows.length === 0) {
        return res.status(403).json({
          message: 'Нет доступа к этой организации'
        });
      }

      // Сохраняем проверенные данные пользователя в запросе.
     req.user = {
  sub: String(result.rows[0].user_id),
  organizationId: String(result.rows[0].organization_id),
  role: result.rows[0].role,
  platformRole: result.rows[0].platform_role || null
};
      // Передаём управление следующему обработчику.
      next();

    } catch (error) {

      // Записываем техническую ошибку в серверный терминал.
      console.error('Ошибка проверки авторизации:', error.message);

      // Сообщаем клиенту, что произошла ошибка сервера.
      return res.status(500).json({
        message: 'Ошибка проверки авторизации'
      });
    }
  });
}

// Экспортируем middleware для использования в маршрутах.
module.exports = authenticateToken;