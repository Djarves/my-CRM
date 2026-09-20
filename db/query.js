// Получаем наш общий Pool PostgreSQL.
const pool = require('./database');


// Выполняем SQL-запрос к базе данных.
async function query(text, params) {

    // Первая попытка выполнить запрос.
    try {

        return await pool.query(
            text,
            params
        );

    } catch (error) {

        // Проверяем, похожа ли ошибка
        // на внезапное закрытие соединения.
        const isConnectionError =
            error.message ===
            'Connection terminated unexpectedly';


        // Если это не ошибка соединения,
        // сразу передаём ошибку дальше.
        if (!isConnectionError) {
            throw error;
        }


        // Показываем в терминале,
        // что будем пробовать ещё раз.
        console.log(
            '🔄 Соединение с PostgreSQL оборвалось. Повторяем запрос...'
        );


        // Даём Pool возможность получить
        // новое соединение и повторяем запрос.
        return await pool.query(
            text,
            params
        );
    }
}


// Экспортируем нашу функцию.
module.exports = query;