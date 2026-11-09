
import { useEffect, useState } from 'react';

// Подключаем функцию проверки прав Super Admin.
import {
    checkPlatformAccess,
    getPlatformStats
} from '../services/api';

import './SuperAdmin.css';

import { Link } from 'react-router-dom';

// Страница панели управления SKLAD.
function SuperAdmin() {

    // Состояние загрузки страницы.
    const [loading, setLoading] = useState(true);

    // Состояние ошибки доступа.
    const [error, setError] = useState('');

    // Данные пользователя после проверки.
    const [accessData, setAccessData] = useState(null);
    // Храним статистику платформы.
    const [stats, setStats] = useState(null);

    // Проверяем права при открытии страницы.
    useEffect(() => {

        async function verifyAccess() {
    try {
        // Сначала проверяем права Super Admin.
        const data = await checkPlatformAccess();
        setAccessData(data);

        // После успешной проверки загружаем статистику.
        const statsData = await getPlatformStats();
        setStats(statsData);

    } catch (error) {
        setError(error.message);
    } finally {
        setLoading(false);
    }
}
        verifyAccess();

    }, []);

    // Пока сервер проверяет доступ.
    if (loading) {
        return <h2>Проверяем доступ...</h2>;
    }

    // Если сервер отказал в доступе.
    if (error) {
        return (
            <div>
                <h1>Доступ запрещён</h1>
                <p>{error}</p>
            </div>
        );
    }

    // Если проверка прошла успешно.
    return (
    <div className="super-admin">

        {/* Заголовок панели */}
        <header className="super-admin-header">
            <h1>SKLAD — Super Admin</h1>
            <p>{accessData?.message}</p>
            <p>
                Глобальная роль: {accessData?.user?.platformRole}
            </p>
        </header>

        {/* Обзор платформы */}
        <h2>Обзор платформы</h2>

        {/* Карточки статистики */}
        <div className="super-admin-stats">

            <div className="super-admin-card">
                <h3>Организации</h3>
                <p>{stats?.organizations ?? 0}</p>
            </div>

            <div className="super-admin-card">
                <h3>Пользователи</h3>
                <p>{stats?.users ?? 0}</p>
            </div>

            <div className="super-admin-card">
                <h3>Все лиды</h3>
                <p>{stats?.leads ?? 0}</p>
            </div>

            <div className="super-admin-card">
                <h3>Организации с лидами</h3>
                <p>{stats?.activeOrganizations ?? 0}</p>
            </div>

            {/* Переход к управлению организациями */}
<Link
    to="/super-admin/organizations"
    className="super-admin-navigation-card"
>
    <div>
        <h2>Организации</h2>
        <p>
            Просмотр и управление организациями платформы
        </p>
    </div>

    <span>Перейти →</span>
</Link>

{/* Переход к управлению пользователями */}
<Link
    to="/super-admin/users"
    className="super-admin-navigation-card"
>
    <div>
        <h2>Пользователи</h2>
        <p>
            Просмотр всех пользователей платформы и их ролей
        </p>
    </div>

    <span>Перейти →</span>
</Link>

        </div>
    </div>
);
}

export default SuperAdmin;
