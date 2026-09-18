// Функция отправки сообщения в Telegram.
async function sendTelegramMessage(text) {

    // Если токен или chat_id не указаны,
    // просто ничего не отправляем.
    if (
        !process.env.TELEGRAM_TOKEN ||
        !process.env.TELEGRAM_CHAT_ID
    ) {
        console.log(
            'ℹ️ Telegram не настроен'
        );

        return;
    }

    // Формируем официальный адрес Telegram Bot API.
    const url =
        `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`;

    try {

        // Отправляем POST-запрос Telegram.
        const response = await fetch(url, {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json',
            },

            body: JSON.stringify({
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text,
                parse_mode: 'HTML',
            }),
        });

        // Если Telegram ответил ошибкой,
        // показываем её.
        if (!response.ok) {
            const errorText = await response.text();

            throw new Error(errorText);
        }

        console.log(
            '✅ Telegram: уведомление отправлено'
        );

    } catch (error) {

        // Ошибка Telegram не должна
        // ронять наш сервер.
        console.error(
            '❌ Ошибка Telegram:',
            error.message
        );
    }
}

// Экспортируем функцию.
module.exports = {
    sendTelegramMessage,
};