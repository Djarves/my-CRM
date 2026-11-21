import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
// Подключаем функцию отправки заявки на backend.
import {
    createUniversalLead,
    getPublicOrganization,
    getPublicOrganizationServices,
} from '../services/api';

import './UniversalConfigurator.css';

// Публичный конфигуратор организации.
function UniversalConfigurator() {

    // Получаем slug организации из URL.
    // Например: /configurator/avtozapchasti
    const { slug } = useParams();

    // Информация об организации.
    const [organization, setOrganization] = useState(null);

    // Список услуг организации.
    const [services, setServices] = useState([]);

    // Список ID выбранных клиентом услуг.
    const [selectedServices, setSelectedServices] = useState([]);

    // Состояние загрузки организации.
    const [isOrganizationLoading, setIsOrganizationLoading] = useState(true);

    // Данные клиента.
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    // Состояние отправки формы.
    const [isLoading, setIsLoading] = useState(false);

    // Сообщение пользователю.
    const [message, setMessage] = useState('');

    // Загружаем информацию об организации при открытии страницы.
    useEffect(() => {

        async function loadOrganization() {
            try {

                // Получаем организацию по slug.
                const data = await getPublicOrganization(slug);

                // Сохраняем информацию об организации.
                setOrganization(data);

                // Получаем услуги этой организации.
                const organizationServices =
                    await getPublicOrganizationServices(slug);

                // Сохраняем список услуг.
                setServices(organizationServices);

            } catch (error) {

                // Показываем ошибку в консоли.
                console.error(
                    'Ошибка загрузки организации:',
                    error
                );

                setMessage(
                    error.message || 'Не удалось загрузить организацию.'
                );

            } finally {

                // Завершаем загрузку.
                setIsOrganizationLoading(false);
            }
        }

        loadOrganization();

    }, [slug]);

    // Отправляем заявку организации.
    async function handleSubmit(event) {

        // Запрещаем перезагрузку страницы.
        event.preventDefault();

        // Сбрасываем старое сообщение.
        setMessage('');

        try {

            // Показываем процесс отправки.
            setIsLoading(true);

            // Отправляем заявку на backend.
            await createUniversalLead(slug, {
                name: name.trim(),
                phone: phone.trim(),
                serviceIds: selectedServices,
                businessType: 'Не указано',
                goal: 'Заявка через универсальный конфигуратор',
                description: '',
                budget: 0,
                options: {},
            });

            // Очищаем поля после успешной отправки.
            setName('');
            setPhone('');

            // Показываем подтверждение.
            setMessage('Заявка успешно отправлена!');

        } catch (error) {

            // Выводим ошибку в консоль.
            console.error('Ошибка отправки заявки:', error);

            // Показываем сообщение пользователю.
            setMessage(
                error.message || 'Не удалось отправить заявку.'
            );

        } finally {

            // Завершаем состояние загрузки.
            setIsLoading(false);
        }
    }

    // Пока загружаем организацию, показываем загрузку.
    if (isOrganizationLoading) {
        return (
            <div className="universal-configurator">
                <div className="configurator-card">
                    <h1>Загрузка...</h1>
                    <p>Подождите, загружаем информацию об организации.</p>
                </div>
            </div>
        );
    }

    // Если организация не найдена или заблокирована.
    if (!organization) {
        return (
            <div className="universal-configurator">
                <div className="configurator-card">
                    <h1>Организация недоступна</h1>
                    <p>
                        К сожалению, эта страница сейчас недоступна.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="universal-configurator">

            <div className="configurator-card">

                <h1>
                    {isOrganizationLoading
                        ? 'Загрузка...'
                        : organization
                            ? organization.name
                            : 'Организация не найдена'}
                </h1>

                <p>
                    Заполните контактные данные,
                    и организация свяжется с вами.
                </p>


                {/* Заголовок каталога услуг. */}
                <div className="configurator-services">

                    <h2>Выберите нужные услуги</h2>

                    {/* Проверяем, есть ли услуги у организации. */}
                    {services.length === 0 ? (

                        <p>Пока нет доступных услуг.</p>

                    ) : (

                        <div className="services-list">

                            {/* Перебираем массив услуг. */}
                            {services.map((service) => (

                                <div
                                    className={
                                        selectedServices.includes(service.id)
                                            ? 'service-card selected'
                                            : 'service-card'
                                    }
                                    key={service.id}
                                    onClick={() => {
                                        setSelectedServices((currentServices) => {

                                            // Если услуга уже выбрана — убираем её.
                                            if (currentServices.includes(service.id)) {
                                                return currentServices.filter(
                                                    (id) => id !== service.id
                                                );
                                            }

                                            // Если не выбрана — добавляем.
                                            return [...currentServices, service.id];
                                        });
                                    }}
                                >

                                    {/* Название услуги. */}
                                    <h3>{service.name}</h3>

                                    {/* Описание услуги. */}
                                    <p>{service.description}</p>

                                    {/* Стоимость услуги. */}
                                    <div className="service-price">

                                        от {Number(service.price_from).toLocaleString('ru-RU')} ₽

                                        {service.price_to &&
                                            ` — ${Number(service.price_to).toLocaleString('ru-RU')} ₽`
                                        }

                                    </div>

                                </div>

                            ))}

                        </div>

                    )}

                </div>


                <form onSubmit={handleSubmit}>

                    <label>
                        Ваше имя

                        <input
                            type="text"
                            value={name}
                            onChange={(event) =>
                                setName(event.target.value)
                            }
                            placeholder="Введите ваше имя"
                            required
                        />
                    </label>

                    <label>
                        Номер телефона

                        <input
                            type="tel"
                            value={phone}
                            onChange={(event) =>
                                setPhone(event.target.value)
                            }
                            placeholder="+7..."
                        />
                    </label>

                    <button
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Отправляем...' : 'Отправить заявку'}
                    </button>

                </form>

                {/* Сообщение об отправке или ошибке. */}
                {message && (
                    <p className="configurator-message">
                        {message}
                    </p>
                )}

            </div>

        </div>
    );
}

export default UniversalConfigurator;