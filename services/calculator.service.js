
// Разрешённые разделы сайта.
const ALLOWED_SECTIONS = [
    'Главная',
    'Услуги',
    'Цены',
    'О компании',
    'Отзывы',
    'Контакты',
];

// Стоимость дополнительных функций.
const FEATURE_PRICES = {
    'Форма заявки': 1500,
    'Онлайн-запись': 3500,
    'Карта': 500,
    'Галерея': 1000,
    'Отзывы': 500,
};

// Проверяем и очищаем параметры конфигуратора.
function sanitizeOptions(options = {}) {

    // Принимаем только обычный объект.
    const safeOptions =
        options &&
            typeof options === 'object' &&
            !Array.isArray(options)
            ? options
            : {};

    // Получаем массив разделов.
    const sections = Array.isArray(safeOptions.sections)
        ? safeOptions.sections
        : [];

    // Получаем массив функций.
    const features = Array.isArray(safeOptions.features)
        ? safeOptions.features
        : [];

    // Оставляем только разрешённые разделы.
    const safeSections = [
        ...new Set(
            sections
                .filter(
                    (section) =>
                        typeof section === 'string' &&
                        ALLOWED_SECTIONS.includes(section)
                )
                .slice(0, ALLOWED_SECTIONS.length)
        )
    ];

    // Оставляем только разрешённые функции.
    const safeFeatures = [
        ...new Set(
            features
                .filter(
                    (feature) =>
                        typeof feature === 'string' &&
                        Object.prototype.hasOwnProperty.call(
                            FEATURE_PRICES,
                            feature
                        )
                )
                .slice(0, Object.keys(FEATURE_PRICES).length)
        )
    ];

    // Возвращаем очищенные параметры.
    return {
        sections: safeSections,
        features: safeFeatures,
    };
}

// Рассчитываем стоимость сайта.
function calculatePrice(options = {}) {

    // Сначала очищаем входящие данные.
    const safeOptions = sanitizeOptions(options);

    // Начальная стоимость сайта.
    let price = 10000;

    // Главная страница входит в базовую стоимость.
    const additionalSections = safeOptions.sections.filter(
        (section) => section !== 'Главная'
    );

    // Каждый дополнительный раздел стоит 700 ₽.
    price += additionalSections.length * 700;

    // Добавляем стоимость выбранных функций.
    safeOptions.features.forEach((feature) => {
        price += FEATURE_PRICES[feature];
    });

    // Возвращаем предварительный диапазон стоимости.
    return {
        priceFrom: price,
        priceTo: price + 5000,
    };
}

// Экспортируем функции.
module.exports = {
    calculatePrice,
    sanitizeOptions,
};
