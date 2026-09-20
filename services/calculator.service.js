function calculatePrice(options = {}) {

    // Начальная стоимость сайта.
    let price = 15000;

    // Получаем массив выбранных разделов.
    const sections = options.sections || [];

    // Получаем массив выбранных функций.
    const features = options.features || [];

    // Каждый выбранный раздел добавляет 3000 ₽.
    price += sections.length * 3000;

    // Каждая выбранная функция добавляет 5000 ₽.
    price += features.length * 5000;

    // Онлайн-запись дополнительно увеличивает стоимость
    // ещё на 5000 ₽.
    if (
        features.includes('Онлайн-запись')
    ) {
        price += 5000;
    }

    // Возвращаем диапазон цены.
    return {
        priceFrom: price,
        priceTo: price + 10000,
    };
}

// Экспортируем функцию.
module.exports = {
    calculatePrice,
};