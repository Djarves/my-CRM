// Подключаем Express.
const express = require('express');

// Создаём маршрутизатор.
const router = express.Router();

// Подключаем проверку JWT-токена.
const authenticateToken = require('../middleware/auth');
// Подключаем функции регистрации, входа, выхода и получения пользователя.
const { register, login, logout, getMe } = require('../controllers/auth.controller');
// Подключаем ограничители регистрации и входа.
const {
    registerLimiter,
    loginLimiter
} = require('../middleware/rateLimiter');
// Регистрация: максимум 5 запросов за 15 минут.
router.post('/register', registerLimiter, register);

// Вход: максимум 10 запросов за 15 минут.
router.post('/login', loginLimiter, login);
// Маршрут для выхода пользователя из CRM.
router.post('/logout', logout);
// Получение данных текущего авторизованного пользователя.
router.get('/me', authenticateToken, getMe);

// Экспортируем маршрутизатор.
module.exports = router;