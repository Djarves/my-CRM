const express = require('express');
const router = express.Router();

// Подключаем контроллеры заявок.
const {
    createLead,
    createPublicLead,
    getLeads,
    updateLeadStatus,
    updateLead,
    deleteLead
} = require('../controllers/leads.controller');

// Подключаем универсальный публичный конфигуратор.
const {
    createUniversalLead,
    getPublicOrganization,
    getPublicOrganizationServices,
} = require('../controllers/universal-leads.controller');

// Подключаем проверку авторизации.
const authenticateToken = require('../middleware/auth');

// Подключаем ограничитель публичных заявок.
const {
    publicLeadLimiter,
    universalLeadLimiter,
} = require('../middleware/rateLimiter');

// Получение заявок — только для авторизованных пользователей.
router.get('/', authenticateToken, getLeads);

// Публичное создание заявки из конфигуратора.
router.post('/public', publicLeadLimiter, createPublicLead);

// Публичная заявка через универсальный конфигуратор организации.
router.post(
    '/public/:slug',
    universalLeadLimiter,
    createUniversalLead
);

// Получение публичной информации об организации.
router.get(
    '/public/:slug',
    getPublicOrganization
);

// Получение активных услуг организации.
router.get(
    '/public/:slug/services',
    getPublicOrganizationServices
);

// Создание заявки из авторизованной CRM.
router.post('/', authenticateToken, createLead);

// Обновление статуса — только для авторизованных пользователей.
router.put('/:id/status', authenticateToken, updateLeadStatus);

// Редактирование данных лида.
router.put('/:id', authenticateToken, updateLead);

// Удаление лида — только для авторизованных пользователей.
router.delete('/:id', authenticateToken, deleteLead);

module.exports = router;