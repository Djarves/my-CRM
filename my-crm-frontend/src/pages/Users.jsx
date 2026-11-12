
import { useEffect, useState } from 'react';

// Подключаем функции для работы с пользователями.
import {
    checkPlatformAccess,
    getPlatformUsers,
    blockPlatformUser,
    unblockPlatformUser
} from '../services/api';

// Подключаем стили.
import './Users.css';

function Users() {

    // Список пользователей.
    const [users, setUsers] = useState([]);

    // Состояние загрузки.
    const [loading, setLoading] = useState(true);

    // Сообщение об ошибке.
    const [error, setError] = useState('');

    // Сообщение об успешном действии.
    const [message, setMessage] = useState('');

    // ID пользователя, с которым сейчас выполняется действие.
    const [processingId, setProcessingId] = useState(null);

    // Загружаем пользователей с backend.
    async function loadUsers() {
        const data = await getPlatformUsers();
        setUsers(data);
    }

    // Загружаем пользователей при открытии страницы.
    useEffect(() => {

        async function init() {
            try {
                // Проверяем права Super Admin.
                await checkPlatformAccess();

                // Получаем список пользователей.
                await loadUsers();

            } catch (error) {
                setError(error.message);

            } finally {
                setLoading(false);
            }
        }

        init();

    }, []);

    // Блокируем пользователя.
    async function handleBlockUser(user) {

        // Не разрешаем повторное действие,
        // пока предыдущий запрос не завершён.
        if (processingId !== null) return;

        // Запрашиваем причину блокировки.
        const reason = window.prompt(
            `Укажи причину блокировки пользователя ${user.name}:`
        );

        // Если нажали Отмена.
        if (reason === null) return;

        // Проверяем, что причина не пустая.
        if (!reason.trim()) {
            setError('Необходимо указать причину блокировки.');
            return;
        }

        try {
            setProcessingId(user.id);
            setError('');
            setMessage('');

            // Отправляем запрос на backend.
            await blockPlatformUser(user.id, reason.trim());

            // Обновляем список пользователей.
            await loadUsers();

            setMessage(`Пользователь ${user.name} заблокирован.`);

        } catch (error) {
            setError(error.message);

        } finally {
            setProcessingId(null);
        }
    }

    // Разблокируем пользователя.
    async function handleUnblockUser(user) {

        if (processingId !== null) return;

        // Запрашиваем подтверждение действия.
        const confirmed = window.confirm(
            `Разблокировать пользователя ${user.name}?`
        );

        if (!confirmed) return;

        try {
            setProcessingId(user.id);
            setError('');
            setMessage('');

            // Отправляем запрос на backend.
            await unblockPlatformUser(user.id);

            // Обновляем список пользователей.
            await loadUsers();

            setMessage(`Пользователь ${user.name} разблокирован.`);

        } catch (error) {
            setError(error.message);

        } finally {
            setProcessingId(null);
        }
    }

    // Пока загружаются данные.
    if (loading) {
        return <h2>Загрузка пользователей...</h2>;
    }

    // Если возникла ошибка загрузки.
    if (error && users.length === 0) {
        return (
            <div>
                <h1>Ошибка загрузки</h1>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="users-page">

            <header className="users-header">
                <h1>Пользователи SKLAD</h1>

                <p>
                    Управление пользователями платформы
                </p>
            </header>

            {/* Сообщения об успешных действиях и ошибках. */}
            {message && (
                <p className="users-message">
                    {message}
                </p>
            )}

            {error && (
                <p className="users-error">
                    {error}
                </p>
            )}

            <div className="users-list">

                {users.map((user) => {

                    // Определяем, является ли пользователь Super Admin.
                    const isSuperAdmin =
                        user.platform_role === 'super_admin';

                    // Определяем, заблокирован ли пользователь.
                    const isBlocked = user.is_blocked === true;

                    return (
                        <div
                            className={`user-card ${isBlocked ? 'user-card--blocked' : ''}`}
                            key={user.id}
                        >
                            <h2>{user.name}</h2>

                            <p>Email: {user.email}</p>

                            <p>
                                Организация: {
                                    user.organization_name || 'Не назначена'
                                }
                            </p>

                            <p>
                                Роль организации: {
                                    user.organization_role || 'Нет роли'
                                }
                            </p>

                            <p>
                                Роль платформы: {user.platform_role}
                            </p>

                            <p>
                                Регистрация: {
                                    new Date(
                                        user.created_at
                                    ).toLocaleDateString('ru-RU')
                                }
                            </p>

                            {/* Статус пользователя. */}
                            <p>
                                Статус: {
                                    isBlocked ? 'Заблокирован' : 'Активен'
                                }
                            </p>

                            {/* Информация о блокировке. */}
                            {isBlocked && (
                                <>
                                    <p>
                                        Причина блокировки: {
                                            user.blocked_reason || 'Не указана'
                                        }
                                    </p>

                                    <p>
                                        Дата блокировки: {
                                            user.blocked_at
                                                ? new Date(
                                                    user.blocked_at
                                                ).toLocaleString('ru-RU')
                                                : 'Не указана'
                                        }
                                    </p>
                                </>
                            )}

                            {/* Super Admin нельзя блокировать через интерфейс. */}
                            {!isSuperAdmin && (
                                <div className="user-actions">

                                    {isBlocked ? (
                                        <button
                                            type="button"
                                            onClick={() => handleUnblockUser(user)}
                                            disabled={processingId !== null}
                                        >
                                            {processingId === user.id
                                                ? 'Обработка...'
                                                : 'Разблокировать'}
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleBlockUser(user)}
                                            disabled={processingId !== null}
                                        >
                                            {processingId === user.id
                                                ? 'Обработка...'
                                                : 'Заблокировать'}
                                        </button>
                                    )}

                                </div>
                            )}

                            {isSuperAdmin && (
                                <p>
                                    Главный администратор платформы
                                </p>
                            )}

                        </div>
                    );
                })}

            </div>

        </div>
    );
}

export default Users;
