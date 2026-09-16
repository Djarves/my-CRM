const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL, 
});

// ЗАЩИТА ОТ ПАДЕНИЯ СЕРВЕРА ПРИ ОБРЫВЕ СВЯЗИ С NEON
pool.on('error', (err, client) => {
    console.error('⚠️ Ошибка пула PostgreSQL (соединение потеряно):', err.message);
    // Сервер больше не будет падать! Он просто создаст новое соединение при следующем запросе.
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

// ФУНКЦИЯ ДЛЯ ОТПРАВКИ УВЕДОМЛЕНИЙ В ТЕЛЕГРАМ
async function sendTelegramMessage(text) {
    // Если токен и ID заполнены в файле .env, бот отправит сообщение
    if (process.env.TELEGRAM_TOKEN && process.env.TELEGRAM_CHAT_ID) {
        try {
            const url = `https://telegram.org{process.env.TELEGRAM_TOKEN}/sendMessage`;
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: process.env.TELEGRAM_CHAT_ID,
                    text: text,
                    parse_mode: 'HTML'
                })
            });
            console.log('🤖 Уведомление в Телеграм успешно отправлено');
        } catch (err) {
            console.error('❌ Ошибка отправки в Телеграм:', err.message);
        }
    }
}

// API 1: Получить всех клиентов
app.get('/api/clients', async (req, res) => {
    let client;
    try {
        client = await pool.connect();
        const result = await client.query('SELECT * FROM clients ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (client) client.release();
    }
});

// API 2: Добавить нового клиента + Отправка в бот
app.post('/api/clients', async (req, res) => {
    const { name, status, budget, phone } = req.body;
    const insertQuery = `
        INSERT INTO clients (name, status, budget, phone) 
        VALUES ($1, $2, $3, $4) 
        RETURNING *;
    `;
    let client;
    try {
        client = await pool.connect();
        const result = await client.query(insertQuery, [
            name, 
            status || "Новая заявка", 
            budget || 0, 
            phone || ""
        ]);
        
        // Магия бота: шлем сообщение в Телеграм!
        const clientName = name;
        const clientBudget = budget || 0;
        await sendTelegramMessage(`🔥 <b>Новая сделка в CRM!</b>\n\n👤 Клиент: ${clientName}\n💰 Бюджет: ${clientBudget.toLocaleString()} ₽\n📱 Тел: ${phone || '—'}`);

        res.status(201).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (client) client.release();
    }
});

// API 3: Удаление клиента
app.delete('/api/clients/:id', async (req, res) => {
    const clientId = parseInt(req.params.id);
    let client;
    try {
        client = await pool.connect();
        const result = await client.query('DELETE FROM clients WHERE id = $1 RETURNING *', [clientId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Клиент не найден" });
        }
        res.json({ message: "Успешно удален" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (client) client.release();
    }
});

// API 4: Обновление статуса (Движение по Канбан-доске)
app.put('/api/clients/:id', async (req, res) => {
    const clientId = Number(req.params.id);
    const { status } = req.body;
    let client;
    try {
        client = await pool.connect();
        const updateResult = await client.query(
            'UPDATE clients SET status = $1 WHERE id = $2 RETURNING *',
            [status, clientId]
        );
        if (updateResult.rowCount === 0) {
            return res.status(404).json({ message: "Клиент не найден" });
        }
        const allClientsResult = await client.query('SELECT * FROM clients ORDER BY id DESC');
        res.json(allClientsResult.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (client) client.release();
    }
});

// ВОТ ЭТА СТРОКА ДЕРЖИТ ПОРТ 3000 ОТКРЫТЫМ ВСЕГДА!
app.listen(PORT, () => {
    console.log(`🚀 Бэкенд жестко запущен на http://localhost:${PORT}`);
});
