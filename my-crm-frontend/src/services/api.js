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


// Проверяем, имеет ли пользователь глобальные права Super Admin.
export async function checkPlatformAccess() {

    // Отправляем запрос на защищённый маршрут backend.
    const response = await fetch(
        `${API_URL}/api/platform/check`,
        {
            // Передаём cookie с JWT-токеном.
            credentials: 'include',
        }
    );

    // Получаем ответ сервера.
    const data = await response.json();

    // Если сервер запретил доступ или вернул другую ошибку.
    if (!response.ok) {
        const error = new Error(
            data.message || 'Нет доступа к панели Super Admin'
        );

        // Сохраняем HTTP-статус ошибки.
        error.status = response.status;

        throw error;
    }

    // Возвращаем подтверждение доступа от backend.
    return data;
}

// Получаем общую статистику платформы SKLAD.
export async function getPlatformStats() {
    const response = await fetch(
        `${API_URL}/api/platform/stats`,
        {
            credentials: 'include'
        }
    );

    const data = await response.json();

    // Проверяем, успешно ли сервер обработал запрос.
    if (!response.ok) {
        const error = new Error(
            data.message ||
            data.error ||
            'Не удалось загрузить статистику платформы'
        );

        error.status = response.status;
        throw error;
    }

    return data;
}

// Получаем список всех организаций платформы.
export async function getOrganizations() {
    const response = await fetch(
        `${API_URL}/api/platform/organizations`,
        {
            credentials: 'include'
        }
    );

    const data = await response.json();

    // Проверяем результат запроса.
    if (!response.ok) {
        const error = new Error(
            data.message ||
            data.error ||
            'Не удалось загрузить организации'
        );

        error.status = response.status;
        throw error;
    }

    return data.organizations;
}

// Блокируем организацию.
export async function blockOrganization(id, reason) {

    // Отправляем PATCH-запрос на backend.
    const response = await fetch(
        `${API_URL}/api/platform/organizations/${id}/block`,
        {
            method: 'PATCH',
            credentials: 'include',

            // Передаём причину блокировки.
            headers: {
                'Content-Type': 'application/json',
            },

            body: JSON.stringify({
                reason,
            }),
        }
    );

    // Получаем ответ сервера.
    const data = await response.json();

    // Проверяем результат запроса.
    if (!response.ok) {
        throw new Error(
            data.message ||
            data.error ||
            'Не удалось заблокировать организацию'
        );
    }

    return data;
}


// Разблокируем организацию.
export async function unblockOrganization(id) {

    // Отправляем PATCH-запрос на backend.
    const response = await fetch(
        `${API_URL}/api/platform/organizations/${id}/unblock`,
        {
            method: 'PATCH',
            credentials: 'include',
        }
    );

    // Получаем ответ сервера.
    const data = await response.json();

    // Проверяем результат запроса.
    if (!response.ok) {
        throw new Error(
            data.message ||
            data.error ||
            'Не удалось разблокировать организацию'
        );
    }

    return data;
}

// Получаем список всех пользователей платформы.
export async function getPlatformUsers() {
    const response = await fetch(
        `${API_URL}/api/platform/users`,
        {
            credentials: 'include'
        }
    );

    const data = await response.json();

    // Проверяем результат запроса.
    if (!response.ok) {
        const error = new Error(
            data.message ||
            data.error ||
            'Не удалось загрузить пользователей'
        );

        error.status = response.status;
        throw error;
    }

    return data.users;
}

// Блокируем пользователя платформы.
export async function blockPlatformUser(id, reason) {

    // Отправляем PATCH-запрос на backend.
    const response = await fetch(
        `${API_URL}/api/platform/users/${id}/block`,
        {
            method: 'PATCH',
            credentials: 'include',

            // Передаём причину блокировки.
            headers: {
                'Content-Type': 'application/json',
            },

            body: JSON.stringify({
                reason,
            }),
        }
    );

    // Получаем ответ сервера.
    const data = await response.json();

    // Проверяем результат запроса.
    if (!response.ok) {
        throw new Error(
            data.message ||
            data.error ||
            'Не удалось заблокировать пользователя'
        );
    }

    return data;
}


// Разблокируем пользователя платформы.
export async function unblockPlatformUser(id) {

    // Отправляем PATCH-запрос на backend.
    const response = await fetch(
        `${API_URL}/api/platform/users/${id}/unblock`,
        {
            method: 'PATCH',
            credentials: 'include',
        }
    );

    // Получаем ответ сервера.
    const data = await response.json();

    // Проверяем результат запроса.
    if (!response.ok) {
        throw new Error(
            data.message ||
            data.error ||
            'Не удалось разблокировать пользователя'
        );
    }

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
        data.message || data.error || 'Ошибка авторизации'
    );
}

    // Возвращаем данные пользователя.
    return data;
}

// Выходим из аккаунта пользователя.
export async function logout() {

    // Отправляем POST-запрос на backend.
    const response = await fetch(
        `${API_URL}/api/auth/logout`,
        {
            method: 'POST',

            // Передаём cookie, чтобы backend мог её удалить.
            credentials: 'include',
        }
    );

    // Получаем ответ backend.
    const data = await response.json();

    // Проверяем, успешно ли прошёл выход.
    if (!response.ok) {
        throw new Error(
            data.error || data.message || 'Ошибка выхода из аккаунта'
        );
    }

    // Возвращаем результат выхода.
    return data;
}

// Регистрируем нового пользователя и его организацию.
export async function register(name, email, password, organizationName) {

    // Отправляем POST-запрос на backend.
    const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
            method: 'POST',

            // Разрешаем браузеру принять cookie с JWT.
            credentials: 'include',

            // Передаём данные в формате JSON.
            headers: {
                'Content-Type': 'application/json',
            },

            // Отправляем данные регистрации.
            body: JSON.stringify({
                name,
                email,
                password,
                organizationName,
            }),
        }
    );

    // Получаем ответ backend.
    const data = await response.json();

    // Проверяем, успешно ли прошла регистрация.
    if (!response.ok) {
        throw new Error(
            data.error || data.message || 'Ошибка регистрации'
        );
    }

    // Возвращаем данные созданного пользователя.
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


// Редактируем данные лида.
export async function updateLead(id, leadData) {

    // Отправляем PUT-запрос на backend.
    const response = await fetch(
        `${API_URL}/api/leads/${id}`,
        {
            method: 'PUT',
            credentials: 'include',

            // Передаём данные в формате JSON.
            headers: {
                'Content-Type': 'application/json',
            },

            // Отправляем новые данные лида.
            body: JSON.stringify(leadData),
        }
    );

    // Получаем ответ сервера.
    const data = await response.json();

    // Проверяем результат запроса.
    if (!response.ok) {
        throw new Error(
            data.error || 'Ошибка редактирования лида'
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