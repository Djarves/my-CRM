import { useEffect, useState } from 'react';

// Подключаем функцию получения организаций.
import {
    checkPlatformAccess,
    getOrganizations,
    blockOrganization,
    unblockOrganization
} from '../services/api';

// Подключаем стили.
import './Organizations.css';

function Organizations() {
    // Список организаций.
    const [organizations, setOrganizations] = useState([]);

    // Состояние загрузки.
    const [loading, setLoading] = useState(true);

    // Сообщение об ошибке.
    const [error, setError] = useState('');

        // ID организации, для которой выполняется действие.
    const [processingId, setProcessingId] = useState(null);

    // Блокируем организацию.
    async function handleBlockOrganization(organization) {

        // Запрашиваем причину блокировки.
        const reason = window.prompt(
            `Укажи причину блокировки организации "${organization.name}":`
        );

        // Если пользователь отменил ввод.
        if (reason === null) {
            return;
        }

        // Проверяем, что причина не пустая.
        if (!reason.trim()) {
            alert('Необходимо указать причину блокировки.');
            return;
        }

        try {
            setProcessingId(organization.id);

            // Отправляем запрос на backend.
            await blockOrganization(
                organization.id,
                reason.trim()
            );

            // Обновляем список организаций.
            const data = await getOrganizations();
            setOrganizations(data);

            alert('Организация заблокирована.');

        } catch (error) {
            alert(error.message);

        } finally {
            setProcessingId(null);
        }
    }

    // Разблокируем организацию.
    async function handleUnblockOrganization(organization) {

        // Запрашиваем подтверждение действия.
        const confirmed = window.confirm(
            `Разблокировать организацию "${organization.name}"?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setProcessingId(organization.id);

            // Отправляем запрос на backend.
            await unblockOrganization(organization.id);

            // Обновляем список организаций.
            const data = await getOrganizations();
            setOrganizations(data);

            alert('Организация разблокирована.');

        } catch (error) {
            alert(error.message);

        } finally {
            setProcessingId(null);
        }
    }

    // Загружаем организации при открытии страницы.
    useEffect(() => {
       async function loadOrganizations() {
    try {
        // Сначала проверяем права Super Admin.
        await checkPlatformAccess();

        // Если проверка успешна, загружаем организации.
        const data = await getOrganizations();

        setOrganizations(data);

    } catch (error) {
        setError(error.message);
    } finally {
        setLoading(false);
    }
}

        loadOrganizations();
    }, []);

    // Пока данные загружаются.
    if (loading) {
        return <h2>Загрузка организаций...</h2>;
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
        <div className="organizations-page">

            <header className="organizations-header">
                <h1>Организации SKLAD</h1>
                <p>
                    Управление организациями платформы
                </p>
            </header>

            <div className="organizations-list">

                {organizations.map((organization) => (
                    <div
                        className="organization-card"
                        key={organization.id}
                    >
                        <h2>{organization.name}</h2>

                        <p>ID: {organization.id}</p>

                        <p>
                            Адрес: {organization.slug}
                        </p>

                        <p>
                            Пользователи: {organization.users_count}
                        </p>

                        <p>
                            Лиды: {organization.leads_count}
                        </p>

                        {/* Статус организации. */}
<p>
    Статус: {
        organization.is_blocked
            ? 'Заблокирована'
            : 'Активна'
    }
</p>

{/* Причина блокировки. */}
{organization.is_blocked && (
    <p>
        Причина: {organization.blocked_reason || 'Не указана'}
    </p>
)}

{/* Кнопки управления блокировкой. */}
{organization.is_blocked ? (
    <button
        onClick={() => handleUnblockOrganization(organization)}
        disabled={processingId === organization.id}
    >
        {processingId === organization.id
            ? 'Обработка...'
            : 'Разблокировать'}
    </button>
) : (
    <button
        onClick={() => handleBlockOrganization(organization)}
        disabled={processingId === organization.id}
    >
        {processingId === organization.id
            ? 'Обработка...'
            : 'Заблокировать'}
    </button>
)}

                        <p>
                            Создана: {
                                new Date(
                                    organization.created_at
                                ).toLocaleDateString('ru-RU')
                            }
                        </p>
                    </div>
                ))}

            </div>

        </div>
    );
}

export default Organizations;