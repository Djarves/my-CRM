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
router.put('/:id/status', updateLeadStatus);
router.delete('/:id', deleteLead);

module.exports = router;