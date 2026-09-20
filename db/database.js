// Получаем Pool из библиотеки pg.
// Pool управляет подключениями к PostgreSQL.
const { Pool } = require('pg');

// Загружаем переменные из файла .env.
require('dotenv').config();


// Создаём пул подключения к PostgreSQL.
const pool = new Pool({
    // Берём строку подключения из .env.
    connectionString: process.env.DATABASE_URL,

    // Максимум 10 одновременных подключений.
    max: 10,

    // Неиспользуемое соединение закрывается
    // после 30 секунд простоя.
    idleTimeoutMillis: 30000,

    // Если новое соединение не устанавливается
    // за 5 секунд — считаем попытку неудачной.
    connectionTimeoutMillis: 5000,

    // Разрешаем TCP keep-alive.
    keepAlive: true,

    // Начинаем keep-alive через 10 секунд.
    keepAliveInitialDelayMillis: 10000,
});


// Если Pool обнаружил ошибку у соединения,
// выводим её в терминал.
pool.on('error', (err) => {

    console.error(
        '⚠️ Ошибка PostgreSQL:',
        err.message
    );

});


// Экспортируем Pool.
// Его будут использовать контроллеры,
// initDatabase() и другие части backend.
module.exports = pool;