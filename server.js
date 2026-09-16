const express = require('express');
const { Pool } = require('pg');
const cors = require('cors'); // Подключаем CORS
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors()); // РАЗРЕШАЕМ РЕАКТУ ДОСТУП К СЕРВЕРУ
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL, 
});

// Авто-создание таблицы при старте
async function initDatabase() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS clients (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            status VARCHAR(50) DEFAULT 'Новая заявка',
            budget INT DEFAULT 0,
            phone VARCHAR(20)
        );
    `;
    try {
        await pool.query(createTableQuery);
        console.log('✅ Таблица "clients" в базе данных проверена');
    } catch (err) {
        console.error('❌ Ошибка БД:', err);
    }
}
initDatabase();

// Тестовая главная страница бэкенда
app.get('/', (req, res) => {
    res.send('Сервер CRM работает и база данных подключена!');
});

// API 1: Получить всех клиентов
app.get('/api/clients', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM clients ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API 2: Добавить нового клиента
app.post('/api/clients', async (req, res) => {
    const { name, status, budget, phone } = req.body;
    const insertQuery = `
        INSERT INTO clients (name, status, budget, phone) 
        VALUES ($1, $2, $3, $4) 
        RETURNING *;
    `;
    try {
        const result = await pool.query(insertQuery, [
            name, 
            status || "Новая заявка", 
            budget || 0, 
            phone || ""
        ]);
        res.status(201).json(result.rows[0]); // Возвращаем добавленный объект
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API 3: Удалить клиента
app.delete('/api/clients/:id', async (req, res) => {
    const clientId = parseInt(req.params.id);
    try {
        const result = await pool.query('DELETE FROM clients WHERE id = $1 RETURNING *', [clientId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Клиент не найден" });
        }
        res.json({ message: "Успешно удален" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Бэкенд запущен на http://localhost:${PORT}`);
});
