// Адрес backend берём из переменной окружения Vite.
// Локально и на Render можно использовать разные адреса.
const API_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:3000';


// Получаем все лиды.
export async function getLeads() {

    // Отправляем GET-запрос на backend.
    const response = await fetch(
        `${API_URL}/api/leads`
    );

    // Превращаем ответ сервера из JSON
    // в обычный JavaScript-объект.
    const data = await response.json();

    // Возвращаем данные в App.jsx.
    return data;
}


// Создаём нового лида.
export async function createLead(leadData) {

    // Отправляем POST-запрос.
    const response = await fetch(
        `${API_URL}/api/leads`,
        {
            // Говорим серверу,
            // что отправляем новые данные.
            method: 'POST',

            // Данные отправляем в формате JSON.
            headers: {
                'Content-Type': 'application/json',
            },

            // Превращаем JavaScript-объект
            // в JSON-строку.
            body: JSON.stringify(leadData),
        }
    );

    // Получаем ответ сервера.
    const data = await response.json();

    // Если сервер сообщил об ошибке,
    // создаём ошибку.
    if (!response.ok) {
        throw new Error(
            data.error || 'Ошибка создания лида'
        );
    }

    // Возвращаем созданного лида.
    return data;
}


// Изменяем статус лида.
export async function updateLeadStatus(
    id,
    status
) {

    // Отправляем PUT-запрос.
    const response = await fetch(
        `${API_URL}/api/leads/${id}/status`,
        {
            method: 'PUT',

            headers: {
                'Content-Type': 'application/json',
            },

            // Передаём новый статус.
            body: JSON.stringify({
                status,
            }),
        }
    );

    // Получаем JSON от сервера.
    const data = await response.json();

    // Проверяем успешность запроса.
    if (!response.ok) {
        throw new Error(
            data.error || 'Ошибка изменения статуса'
        );
    }

    // Возвращаем обновлённый лид.
    return data;
}

// Удаление лида.
export async function deleteLead(id) {

    // Отправляем DELETE-запрос на backend.
    const response = await fetch(
        `${API_URL}/api/leads/${id}`,
        {
            method: 'DELETE',
        }
    );

    // Получаем ответ сервера.
    const data = await response.json();

    // Если сервер вернул ошибку.
    if (!response.ok) {
        throw new Error(
            data.error || 'Ошибка удаления лида'
        );
    }

    // Возвращаем результат.
    return data;
}