// Подключаем базу данных.
const dbQuery = require('../db/query');

// Подключаем калькулятор.
const {
    calculatePrice,
    sanitizeOptions,
} = require('./calculator.service');

// Подключаем генерацию AI-брифа.
const {
    generateAiBrief,
} = require('./ai.service');

// Подключаем отправку Push-уведомлений.
const {
    sendPushNotification,
} = require('./push.service');

