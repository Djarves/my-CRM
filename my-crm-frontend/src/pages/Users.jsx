import { useEffect, useState } from 'react';

// Подключаем проверку прав и получение пользователей.
import {
    checkPlatformAccess,
    getPlatformUsers
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

    // Загружаем пользователей при открытии страницы.
    useEffect(() => {
        async function loadUsers() {
            try {
                // Проверяем права Super Admin.
                await checkPlatformAccess();

                // Получаем пользователей с backend.
                const data = await getPlatformUsers();

                setUsers(data);

            } catch (error) {
                setError(error.message);

            } finally {
                setLoading(false);
            }
        }

        loadUsers();
    }, []);

    // Пока загружаются данные.
    if (loading) {
        return <h2>Загрузка пользователей...</h2>;
    }

    // Если возникла ошибка.
    if (error) {
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

            <div className="users-list">

                {users.map((user) => (
                    <div
                        className="user-card"
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

                    </div>
                ))}

            </div>

        </div>
    );
}

export default Users;