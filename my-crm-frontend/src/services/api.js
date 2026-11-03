// Адрес backend берём из переменной окружения Vite.
// Локально и на Render можно использовать разные адреса.
const API_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:3000';

    // Проверяем, авторизован ли пользователь.
export async function getMe() {

    // Запрашиваем данные текущего пользователя.
    const response = await fetch(
        `${API_URL}/api/auth/me`,
        {
            // Передаём cookie с JWT-токеном.
            credentials: 'include',
        }
    );

    // Получаем ответ backend.
    const data = await response.json();

    // Если пользователь не авторизован
    // или сервер вернул другую ошибку.
    if (!response.ok) {
        const error = new Error(
            data.error || 'Не удалось проверить авторизацию'
        );

        // Сохраняем HTTP-статус ошибки.
        error.status = response.status;

        throw error;
    }

    // Возвращаем данные пользователя и организации.
    return data;
}


// Авторизуем пользователя.
export async function login(email, password) {

    // Отправляем запрос на вход.
    const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
            method: 'POST',

            // Разрешаем браузеру принять cookie от backend.
            credentials: 'include',

            // Сообщаем, что отправляем JSON.
            headers: {
                'Content-Type': 'application/json',
            },

            // Передаём email и пароль.
            body: JSON.stringify({
                email,
                password,
            }),
        }
    );

    // Получаем ответ сервера.
    const data = await response.json();

    // Проверяем, успешно ли прошёл вход.
    if (!response.ok) {
        throw new Error(
            data.error || 'Ошибка авторизации'
        );
    }

    // Возвращаем данные пользователя.
    return data;
}


// Получаем все лиды.
export async function getLeads() {

    // Отправляем запрос на backend.
    const response = await fetch(
        `${API_URL}/api/leads`,
        {
            credentials: 'include',
        }
    );

    // Получаем ответ сервера в формате JSON.
    const data = await response.json();

    // Если сервер вернул ошибку, не возвращаем её как список лидов.
    if (!response.ok) {
        throw new Error(
            data.error || `Ошибка загрузки лидов: ${response.status}`
        );
    }

    // Возвращаем только успешный ответ.
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
            credentials: 'include',
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
            credentials: 'include',
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
            credentials: 'include',
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