const express = require('express');
const router = express.Router();

// Подключаем контроллеры заявок.
const {
    createLead,
    getLeads,
    updateLeadStatus,
    deleteLead
} = require('../controllers/leads.controller');

// Подключаем проверку авторизации.
const authenticateToken = require('../middleware/auth');

// Получение заявок — только для авторизованных пользователей.
router.get('/', authenticateToken, getLeads);

// Остальные маршруты пока не меняем.
router.post('/', createLead);
// Обновление статуса — только для авторизованных пользователей.
router.put('/:id/status', authenticateToken, updateLeadStatus);

// Удаление лида — только для авторизованных пользователей.
router.delete('/:id', authenticateToken, deleteLead);

module.exports = router;