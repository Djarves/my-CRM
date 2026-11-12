
import { useEffect, useState } from 'react';

import {
    checkPlatformAccess,
    getPlatformStats
} from '../services/api';

import './SuperAdmin.css';

import { Link } from 'react-router-dom';

// Главная страница управления SKLAD.
function SuperAdmin() {

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [accessData, setAccessData] = useState(null);
    const [stats, setStats] = useState(null);

    // Проверяем права и загружаем статистику.
    useEffect(() => {

        async function verifyAccess() {
            try {
                const data = await checkPlatformAccess();
                setAccessData(data);

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

    if (loading) {
        return <h2>Проверяем доступ...</h2>;
    }

    if (error) {
        return (
            <div className="super-admin">
                <h1>Доступ запрещён</h1>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="super-admin">

            {/* Заголовок панели */}
            <header className="super-admin-header">
                <h1>Главная панель</h1>
                <p>{accessData?.message}</p>
                <span>
                    Глобальная роль: {accessData?.user?.platformRole}
                </span>
            </header>

            {/* Статистика платформы */}
            <section className="super-admin-section">

                <h2>Обзор платформы</h2>

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

                </div>
            </section>

            {/* Управление платформой */}
            <section className="super-admin-section">

                <h2>Управление платформой</h2>

                <div className="super-admin-navigation">

                    <Link
                        to="/super-admin/organizations"
                        className="super-admin-navigation-card"
                    >
                        <div>
                            <h3>Организации</h3>
                            <p>Просмотр и управление организациями платформы</p>
                        </div>
                        <span>Перейти →</span>
                    </Link>

                    <Link
                        to="/super-admin/users"
                        className="super-admin-navigation-card"
                    >
                        <div>
                            <h3>Пользователи</h3>
                            <p>Просмотр пользователей платформы и их ролей</p>
                        </div>
                        <span>Перейти →</span>
                    </Link>

                </div>
            </section>

        </div>
    );
}

export default SuperAdmin;
