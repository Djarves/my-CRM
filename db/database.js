// Получаем Pool из библиотеки pg.
// Pool управляет подключениями к PostgreSQL.
const { Pool } = require('pg');

// Загружаем переменные из файла .env
require('dotenv').config();

// Создаём пул подключения к PostgreSQL.
// DATABASE_URL хранится в .env.
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Если соединение с PostgreSQL оборвалось,
// выводим ошибку, но не роняем сервер.
pool.on('error', (err) => {
    console.error(
        '⚠️ Ошибка PostgreSQL:',
        err.message
    );
});

// Проверяем подключение к PostgreSQL при запуске сервера.
pool.query('SELECT NOW()')
    .then(() => {
        console.log('✅ PostgreSQL подключён');
    })
    .catch((err) => {
        console.error(
            '❌ PostgreSQL НЕ подключён:',
            err.message
        );
    });
// Экспортируем pool,
// чтобы другие файлы могли работать с базой.
module.exports = pool;