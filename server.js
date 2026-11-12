// Подключаем Express.
const express = require('express');
const axios = require('axios');

// Подключаем библиотеку для чтения cookie.
const cookieParser = require('cookie-parser');

// Подключаем CORS,
// чтобы frontend мог обращаться к backend.
const cors = require('cors');

// Загружаем переменные из .env.
require('dotenv').config();

// Показываем путь к сертификату.
console.log(
    'NODE_EXTRA_CA_CERTS:',
    process.env.NODE_EXTRA_CA_CERTS
);

// Показываем, существует ли файл сертификата.
const fs = require('fs');

console.log(
    'Сертификат существует:',
    fs.existsSync(
        process.env.NODE_EXTRA_CA_CERTS
    )
);

// Подключаем базу данных.
const pool = require('./db/database');

// Подключаем создание таблиц.
const initDatabase = require('./db/init');

// Подключаем маршруты лидов.
const leadsRoutes = require('./routes/leads.routes');

// Подключаем маршруты Push-уведомлений.
const pushRoutes = require('./routes/push.routes');

// Подключаем маршруты авторизации.
const authRoutes = require('./routes/auth.routes');

// Подключаем маршруты глобального управления SKLAD.
const platformRoutes = require('./routes/platform.routes');

// Создаём Express-приложение.
const app = express();

// Порт backend.
// Render передаст свой PORT через переменную окружения.
// Если мы запускаем проект локально, используем 3000.
const PORT = process.env.PORT || 3000;

// Список адресов, которым разрешено обращаться к backend.
const allowedOrigins = [
    'https://my-crm-dashboard.onrender.com',
    'http://localhost:5173'
];

// Настраиваем CORS.
app.use(cors({
    // Проверяем адрес frontend.
    origin: (origin, callback) => {

        // Разрешаем запросы с указанных адресов.
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // Не разрешаем запросы с других адресов.
        return callback(null, false);
    },

    // Разрешаем передачу cookie.
    credentials: true
}));

// Позволяем Express читать JSON.
app.use(express.json());
// Позволяем Express читать cookie из запросов.
app.use(cookieParser());

// Разрешаем отдавать файлы из public.
app.use(express.static('public'));

// Подключаем API авторизации.
app.use('/api/auth', authRoutes);

// Подключаем маршруты API.
app.use('/api/leads', leadsRoutes);
app.use('/api/push', pushRoutes);
// Подключаем API глобального управления платформой.
app.use('/api/platform', platformRoutes);

// Проверка доступности backend.
app.get('/api/ping', (req, res) => {
    res.status(200).send('pong');
});

// ==================================================
// СТАРТ СЕРВЕРА
// ==================================================

// Сначала проверяем базу,
// затем запускаем сервер.
async function startServer() {

    try {

        // Проверяем, что PostgreSQL отвечает.
        await pool.query('SELECT NOW()');

        console.log('✅ PostgreSQL подключён');


        // После успешной проверки базы
        // создаём необходимые таблицы.
        await initDatabase();


        // Только после успешной работы с базой
        // запускаем HTTP-сервер.
        app.listen(PORT, () => {

            console.log(
                `🚀 Backend запущен: http://localhost:${PORT}`
            );

        });

    } catch (error) {

        // Если PostgreSQL недоступен,
        // сервер не запускаем.
        console.error(
            '❌ Не удалось запустить backend:',
            error.message
        );

        process.exit(1);
    }
}

const SERVER_URL = 'https://my-crm-dashboard.onrender.com';

// Запускаем бесконечный цикл пинга каждые 10 минут (600 000 мс)
setInterval(async () => {
    try {
        const response = await axios.get(SERVER_URL);
        console.log(`[Пингер]: Сервер активен. Ответ базы/сервера: ${response.data}`);
    } catch (error) {
        console.error('[Пингер]: Ошибка удержания активности сервера:', error.message);
    }
}, 600000);


// Запускаем приложение.
startServer();