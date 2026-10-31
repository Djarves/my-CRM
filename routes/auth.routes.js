// Подключаем Express.
const express = require('express');

// Создаём маршрутизатор.
const router = express.Router();

// Подключаем проверку JWT-токена.
const authenticateToken = require('../middleware/auth');

// Подключаем функцию регистрации.
const { register, login, getMe } = require('../controllers/auth.controller');
// Маршрут регистрации нового пользователя.
router.post('/register', register);
// Маршрут для входа пользователя.
router.post('/login', login);
// Получение данных текущего авторизованного пользователя.
router.get('/me', authenticateToken, getMe);

// Экспортируем маршрутизатор.
module.exports = router;