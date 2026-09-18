// Подключаем Express.
const express = require('express');

// Создаём router.
// Router позволяет вынести API
// из главного server.js.
const router = express.Router();

// Получаем функции контроллера.
const {
    createLead,
    getLeads,
    updateLeadStatus,
} = require('../controllers/leads.controller');


// POST /api/leads
// Создание нового лида.
router.post('/', createLead);


// GET /api/leads
// Получение всех лидов.
router.get('/', getLeads);


// PUT /api/leads/:id/status
// Изменение этапа воронки.
router.put('/:id/status', updateLeadStatus);


// Экспортируем router.
module.exports = router;