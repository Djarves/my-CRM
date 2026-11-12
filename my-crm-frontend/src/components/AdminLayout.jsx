
import { NavLink, Outlet, Link } from 'react-router-dom';

import './AdminLayout.css';

// Общая оболочка административной панели SKLAD.
function AdminLayout() {

    return (
        <div className="admin-layout">

            {/* Боковое меню */}
            <aside className="admin-sidebar">

                {/* Логотип */}
                <Link to="/super-admin" className="admin-logo">
                    <span className="admin-logo-icon">S</span>

                    <span>
                        SKLAD
                        <small>Управление платформой</small>
                    </span>
                </Link>

                {/* Навигация */}
                <nav className="admin-navigation">

                    <p className="admin-navigation-title">
                        ГЛАВНОЕ МЕНЮ
                    </p>

                    <NavLink
                        to="/super-admin"
                        end
                        className={({ isActive }) =>
                            isActive
                                ? 'admin-nav-link active'
                                : 'admin-nav-link'
                        }
                    >
                        <span>◫</span>
                        Главная
                    </NavLink>

                    <NavLink
                        to="/super-admin/organizations"
                        className={({ isActive }) =>
                            isActive
                                ? 'admin-nav-link active'
                                : 'admin-nav-link'
                        }
                    >
                        <span>▦</span>
                        Организации
                    </NavLink>

                    <NavLink
                        to="/super-admin/users"
                        className={({ isActive }) =>
                            isActive
                                ? 'admin-nav-link active'
                                : 'admin-nav-link'
                        }
                    >
                        <span>♙</span>
                        Пользователи
                    </NavLink>

                </nav>

                {/* Нижняя часть меню */}
                <div className="admin-sidebar-bottom">

                    <Link to="/" className="admin-back-link">
                        <span>←</span>
                        Вернуться в CRM
                    </Link>

                    <div className="admin-sidebar-footer">
                        SKLAD © 2026
                        <small>Панель управления</small>
                    </div>

                </div>

            </aside>

            {/* Основная рабочая область */}
            <main className="admin-main">

                {/* Верхняя панель */}
                <header className="admin-topbar">

                    <div>
                        <span className="admin-topbar-label">
                            ПАНЕЛЬ УПРАВЛЕНИЯ
                        </span>

                        <h2>Администрирование SKLAD</h2>
                    </div>

                    <div className="admin-profile">
                        <div className="admin-profile-avatar">
                            SA
                        </div>

                        <div>
                            <strong>Главный администратор</strong>
                            <small>Управление платформой</small>
                        </div>
                    </div>

                </header>

                {/* Здесь отображаются страницы */}
                <section className="admin-content">
                    <Outlet />
                </section>

            </main>

        </div>
    );
}

export default AdminLayout;
