
// Подключаем библиотеку ограничения запросов.
const rateLimit = require('express-rate-limit');

// Ограничитель для публичного конфигуратора.
const publicLeadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Слишком много заявок. Попробуйте через 15 минут.',
    },
    statusCode: 429,
});

// Ограничитель для универсального конфигуратора SKLAD.
const universalLeadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Слишком много заявок. Попробуйте через 15 минут.',
    },
    statusCode: 429,
});

// Ограничитель для регистрации.
const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Слишком много попыток регистрации. Попробуйте через 15 минут.',
    },
    statusCode: 429,
});

// Ограничитель для входа.
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Слишком много попыток входа. Попробуйте через 15 минут.',
    },
    statusCode: 429,
});

// Экспортируем все ограничители.
module.exports = {
    publicLeadLimiter,
    universalLeadLimiter,
    registerLimiter,
    loginLimiter,
};
