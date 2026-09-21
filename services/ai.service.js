// Модуль Node.js для создания уникального ID запроса.
const crypto = require('crypto');


// Сервис для работы с GigaChat.

// Получаем временный Access Token.
// Он нужен для отправки запросов к GigaChat API.
async function getAccessToken() {

    // Создаём уникальный ID запроса.
    const rqUID = crypto.randomUUID();

    // Отправляем запрос на получение временного токена.
    const response = await fetch(
        'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
        {
            method: 'POST',

            // Передаём необходимые заголовки.
            headers: {
                'Content-Type':
                    'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'RqUID': rqUID,

                // Наш постоянный Authorization Key.
                'Authorization':
                    `Basic ${process.env.GIGACHAT_AUTH_KEY}`,
            },

            // Указываем, что мы используем API для физлица.
            body: 'scope=GIGACHAT_API_PERS',
        }
    );

    // Если GigaChat вернул ошибку —
    // останавливаем выполнение и показываем причину.
    if (!response.ok) {

        const errorText =
            await response.text();

        throw new Error(
            `Ошибка получения токена: ${response.status} ${errorText}`
        );
    }

    // Преобразуем ответ из JSON.
    const data =
        await response.json();

    // Возвращаем временный токен.
    return data.access_token;
}


// Отправляем данные лида в GigaChat
// и получаем готовый AI-бриф.
async function generateAiBrief(lead) {

    // Получаем временный Access Token.
    const accessToken =
        await getAccessToken();

    // Формируем инструкцию для AI.
    const prompt = `
Ты помощник менеджера веб-студии.

Проанализируй заявку клиента и составь краткий структурированный бриф.

Информация о клиенте:

Имя: ${lead.name || 'не указано'}
Телефон: ${lead.phone || 'не указано'}
Email: ${lead.email || 'не указано'}
Тип бизнеса: ${lead.business_type || 'не указан'}
Цель сайта: ${lead.goal || 'не указана'}
Описание: ${lead.description || 'не указано'}
Бюджет клиента: ${lead.budget || 'не указан'}
Предварительная цена: ${lead.price_from || 0} - ${lead.price_to || 0} ₽

Выбранные параметры:
${JSON.stringify(lead.options || {}, null, 2)}

Составь ответ на русском языке.

Структура:

1. Кто клиент
2. Что ему нужно
3. Какой сайт ему подходит
4. Что важно уточнить
5. Предварительная оценка проекта

Пиши кратко и по делу.
`;

    // Отправляем запрос в GigaChat.
    const response = await fetch(
        'https://api.giga.chat/v1/chat/completions',
        {
            method: 'POST',

            headers: {
                'Content-Type':
                    'application/json',
                'Accept':
                    'application/json',

                // Передаём временный токен.
                'Authorization':
                    `Bearer ${accessToken}`,
            },

            body: JSON.stringify({

                // Используем модель GigaChat 3 Ultra.
                model: 'GigaChat-3-Ultra',

                // Передаём нашу инструкцию.
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            }),
        }
    );

    // Проверяем ответ GigaChat.
    if (!response.ok) {

        const errorText =
            await response.text();

        throw new Error(
            `Ошибка GigaChat: ${response.status} ${errorText}`
        );
    }

    // Получаем JSON-ответ.
    const data =
        await response.json();

    // Достаём текст ответа модели.
    const aiBrief =
        data.choices?.[0]?.message?.content;

    // Проверяем, что AI действительно что-то вернул.
    if (!aiBrief) {
        throw new Error(
            'GigaChat не вернул текст ответа'
        );
    }

    // Возвращаем готовый бриф.
    return aiBrief;
}


// Экспортируем функцию.
module.exports = {
    generateAiBrief,
};