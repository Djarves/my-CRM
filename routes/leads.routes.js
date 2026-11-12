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

// Подключаем проверку авторизации.
const authenticateToken = require('../middleware/auth');

// Получение заявок — только для авторизованных пользователей.
router.get('/', authenticateToken, getLeads);

// Публичное создание заявки из конфигуратора.
router.post('/public', createPublicLead);

// Создание заявки из авторизованной CRM.
router.post('/', authenticateToken, createLead);

// Обновление статуса — только для авторизованных пользователей.
router.put('/:id/status', authenticateToken, updateLeadStatus);

// Редактирование данных лида.
router.put('/:id', authenticateToken, updateLead);

// Удаление лида — только для авторизованных пользователей.
router.delete('/:id', authenticateToken, deleteLead);

module.exports = router;