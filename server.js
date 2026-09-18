// Подключаем Express.
const express = require('express');

// Подключаем CORS,
// чтобы frontend мог обращаться к backend.
const cors = require('cors');

// Загружаем переменные из .env.
require('dotenv').config();

// Подключаем базу данных.
const pool = require('./db/database');

// Подключаем создание таблиц.
const initDatabase = require('./db/init');

// Подключаем маршруты лидов.
const leadsRoutes = require('./routes/leads.routes');


// Создаём Express-приложение.
const app = express();

// Порт нашего backend.
const PORT = 3000;


// Разрешаем запросы с frontend.
app.use(cors());

// Позволяем Express читать JSON.
app.use(express.json());

// Разрешаем отдавать файлы из public.
app.use(express.static('public'));


// ==================================================
// НОВЫЙ API ЛИДОВ
// ==================================================

// Все запросы:
// /api/leads
// /api/leads/1/status
// и т.д.
//
// будут передаваться в leadsRoutes.
app.use('/api/leads', leadsRoutes);


// ==================================================
// СТАРЫЙ CRM API
// ==================================================


// Получить всех клиентов.
app.get('/api/clients', async (req, res) => {

    try {

        const result = await pool.query(
            'SELECT * FROM clients ORDER BY id DESC'
        );

        res.json(result.rows);

    } catch (err) {

        res.status(500).json({
            error: err.message,
        });
    }
});


// Добавить клиента.
app.post('/api/clients', async (req, res) => {

    const {
        name,
        status,
        budget,
        phone,
    } = req.body;

    try {

        const result = await pool.query(
            `
            INSERT INTO clients (
                name,
                status,
                budget,
                phone
            )
            VALUES ($1, $2, $3, $4)
            RETURNING *;
            `,
            [
                name,
                status || 'Новая заявка',
                budget || 0,
                phone || '',
            ]
        );

        res.status(201).json(
            result.rows[0]
        );

    } catch (err) {

        res.status(500).json({
            error: err.message,
        });
    }
});


// Удалить клиента.
app.delete('/api/clients/:id', async (req, res) => {

    const clientId = Number(
        req.params.id
    );

    try {

        const result = await pool.query(
            `
            DELETE FROM clients
            WHERE id = $1
            RETURNING *;
            `,
            [clientId]
        );

        if (result.rowCount === 0) {

            return res.status(404).json({
                message: 'Клиент не найден',
            });
        }

        res.json({
            message: 'Успешно удален',
        });

    } catch (err) {

        res.status(500).json({
            error: err.message,
        });
    }
});


// Изменить статус клиента.
app.put('/api/clients/:id', async (req, res) => {

    const clientId = Number(
        req.params.id
    );

    const { status } = req.body;

    try {

        const result = await pool.query(
            `
            UPDATE clients
            SET status = $1
            WHERE id = $2
            RETURNING *;
            `,
            [
                status,
                clientId,
            ]
        );

        if (result.rowCount === 0) {

            return res.status(404).json({
                message: 'Клиент не найден',
            });
        }

        res.json(result.rows[0]);

    } catch (err) {

        res.status(500).json({
            error: err.message,
        });
    }
});


// ==================================================
// СТАРТ СЕРВЕРА
// ==================================================


// Сначала проверяем базу,
// затем запускаем сервер.
async function startServer() {

    await initDatabase();

    app.listen(PORT, () => {

        console.log(
            `🚀 Backend запущен: http://localhost:${PORT}`
        );

    });
}


// Запускаем приложение.
startServer();