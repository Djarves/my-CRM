// ========================================
// КОНФИГУРАТОР
// ШАГ 1 — ВЫБОР ТИПА БИЗНЕСА
// ========================================


// Находим все кнопки выбора бизнеса
const businessOptions = document.querySelectorAll(
    '.configurator__option'
);


// Находим блок текущего шага
const configuratorStep = document.querySelector(
    '.configurator__step'
);


// Здесь будем хранить ответы пользователя
const configuratorData = {
    businessType: null,
    goal: null,
    sections: [],
    features: [],
};


// Перебираем все кнопки
businessOptions.forEach((button) => {

    // Отслеживаем нажатие на кнопку
    button.addEventListener('click', () => {

        // Получаем текст выбранной кнопки
        const selectedBusiness = button.textContent.trim();

        // Сохраняем ответ пользователя
        configuratorData.businessType = selectedBusiness;

        // Показываем выбранное значение в консоли
        console.log(
            'Выбранный бизнес:',
            configuratorData.businessType
        );

        // Переходим к следующему шагу
        showGoalStep();

    });

});


// ========================================
// ШАГ 2 — ЦЕЛЬ САЙТА
// ========================================

function showGoalStep() {

    // Заменяем содержимое текущего шага
    configuratorStep.innerHTML = `

        <span class="configurator__step-number">
            Шаг 2 из 5
        </span>

        <h3 class="configurator__question">
            Какая главная цель сайта?
        </h3>

        <div class="configurator__options">

            <button
                class="configurator__option"
                type="button"
            >
                Привлекать новых клиентов
            </button>

            <button
                class="configurator__option"
                type="button"
            >
                Показывать услуги
            </button>

            <button
                class="configurator__option"
                type="button"
            >
                Получать заявки
            </button>

            <button
                class="configurator__option"
                type="button"
            >
                Сайт-визитка
            </button>

        </div>
    `;


    // Находим кнопки, которые только что создали
    const goalOptions = configuratorStep.querySelectorAll(
        '.configurator__option'
    );


    // Перебираем кнопки целей
    goalOptions.forEach((button) => {

        // Отслеживаем нажатие
        button.addEventListener('click', () => {

            // Получаем текст выбранной цели
            const selectedGoal = button.textContent.trim();

            // Сохраняем цель в объекте
            configuratorData.goal = selectedGoal;

            // Показываем весь объект в консоли
            console.log(
                'Данные конфигуратора:',
                configuratorData
            );

            // Переходим к третьему шагу
            showSectionsStep();

        });

    });
}

// ========================================
// ШАГ 3 — РАЗДЕЛЫ САЙТА
// ========================================

function showSectionsStep() {

    configuratorStep.innerHTML = `

        <span class="configurator__step-number">
            Шаг 3 из 5
        </span>

        <h3 class="configurator__question">
            Какие разделы нужны на сайте?
        </h3>

        <p class="configurator__description">
            Можно выбрать несколько вариантов
        </p>

        <div class="configurator__options">

            <button
                class="configurator__option"
                type="button"
                data-section="Главная"
            >
                Главная
            </button>

            <button
                class="configurator__option"
                type="button"
                data-section="Услуги"
            >
                Услуги
            </button>

            <button
                class="configurator__option"
                type="button"
                data-section="Цены"
            >
                Цены
            </button>

            <button
                class="configurator__option"
                type="button"
                data-section="О компании"
            >
                О компании
            </button>

            <button
                class="configurator__option"
                type="button"
                data-section="Отзывы"
            >
                Отзывы
            </button>

            <button
                class="configurator__option"
                type="button"
                data-section="Контакты"
            >
                Контакты
            </button>

        </div>

        <div class="configurator__navigation">
    <button
        class="configurator__button configurator__button--back"
        type="button"
        id="sectionsBackButton"
    >
        ← Назад
    </button>

    <button
        class="configurator__button configurator__button--next"
        type="button"
        id="sectionsNextButton"
    >
        Далее →
    </button>
</div>

        
    `;


    // Находим кнопки разделов
    const sectionOptions =
        configuratorStep.querySelectorAll(
            '.configurator__option'
        );

    // Восстанавливаем визуальное выделение
// ранее выбранных разделов
sectionOptions.forEach((button) => {

    // Получаем название раздела из data-section
    const section =
        button.dataset.section;

    // Если этот раздел уже есть в массиве —
    // снова добавляем ему зелёную рамку
    if (
        configuratorData.sections.includes(section)
    ) {
        button.classList.add(
            'configurator__option--selected'
        );
    }

});    


    // Находим кнопку "Далее"
    const nextButton =
        configuratorStep.querySelector(
            '#sectionsNextButton'
        );

        // Находим кнопку "Назад"
    const backButton =
        configuratorStep.querySelector(
            '#sectionsBackButton'
        );

        // Возвращаемся на шаг 2
            backButton.addEventListener('click', () => {

        // Показываем предыдущий шаг
            showGoalStep();

});

    // Добавляем обработчик каждой кнопке
    sectionOptions.forEach((button) => {

        button.addEventListener('click', () => {

            // Получаем название раздела
            const section =
                button.dataset.section;


            // Проверяем, выбран ли уже этот раздел
            const isSelected =
                configuratorData.sections.includes(section);


            if (isSelected) {

                // Если уже выбран —
                // удаляем его из массива
                configuratorData.sections =
                    configuratorData.sections.filter(
                        (item) => item !== section
                    );

                // Убираем визуальное выделение
                button.classList.remove(
                    'configurator__option--selected'
                );

            } else {

                // Если ещё не выбран —
                // добавляем в массив
                configuratorData.sections.push(
                    section
                );

                // Добавляем визуальное выделение
                button.classList.add(
                    'configurator__option--selected'
                );
            }


            // Показываем текущий массив в консоли
            console.log(
                'Выбранные разделы:',
                configuratorData.sections
            );

        });

    });


    // Переход дальше
    nextButton.addEventListener('click', () => {

        // Проверяем, выбран ли хотя бы один раздел
        if (configuratorData.sections.length === 0) {

            alert(
                'Выберите хотя бы один раздел'
            );

            return;
        }


        // Показываем все собранные данные
        console.log(
            'Данные конфигуратора:',
            configuratorData
        );


        // Переходим к следующему шагу
        showFeaturesStep();

    });

}

// ========================================
// ШАГ 4 — ФУНКЦИИ САЙТА
// ========================================

function showFeaturesStep() {

    configuratorStep.innerHTML = `

        <span class="configurator__step-number">
            Шаг 4 из 5
        </span>

        <h3 class="configurator__question">
            Какие функции нужны на сайте?
        </h3>

        <p class="configurator__description">
            Можно выбрать несколько вариантов
        </p>

        <div class="configurator__options">

            <button
                class="configurator__option"
                type="button"
                data-feature="Форма заявки"
            >
                Форма заявки
            </button>

            <button
                class="configurator__option"
                type="button"
                data-feature="Онлайн-запись"
            >
                Онлайн-запись
            </button>

            <button
                class="configurator__option"
                type="button"
                data-feature="Карта"
            >
                Карта
            </button>

            <button
                class="configurator__option"
                type="button"
                data-feature="Галерея"
            >
                Галерея
            </button>

            <button
                class="configurator__option"
                type="button"
                data-feature="Отзывы"
            >
                Отзывы
            </button>

        </div>

        <div class="configurator__navigation">

    <button
        class="configurator__button configurator__button--back"
        type="button"
        id="featuresBackButton"
    >
        ← Назад
    </button>

    <button
        class="configurator__button configurator__button--next"
        type="button"
        id="featuresNextButton"
    >
        Далее →
    </button>

</div>
    `;


    const featureOptions =
        configuratorStep.querySelectorAll(
            '.configurator__option'
        );

    // Восстанавливаем визуальное выделение
// ранее выбранных функций
featureOptions.forEach((button) => {

    // Получаем название функции
    const feature =
        button.dataset.feature;

    // Если функция уже есть в массиве —
    // снова показываем её как выбранную
    if (
        configuratorData.features.includes(feature)
    ) {
        button.classList.add(
            'configurator__option--selected'
        );
    }

});


    const nextButton =
        configuratorStep.querySelector(
            '#featuresNextButton'
        );

        // Находим кнопку "Назад"
    const backButton =
         configuratorStep.querySelector(
            '#featuresBackButton'
        );

        // Возвращаемся на шаг 3
        backButton.addEventListener('click', () => {

        // Показываем предыдущий шаг
            showSectionsStep();

});


    featureOptions.forEach((button) => {

        button.addEventListener('click', () => {

            const feature =
                button.dataset.feature;


            const isSelected =
                configuratorData.features.includes(
                    feature
                );


            if (isSelected) {

                configuratorData.features =
                    configuratorData.features.filter(
                        (item) => item !== feature
                    );

                button.classList.remove(
                    'configurator__option--selected'
                );

            } else {

                configuratorData.features.push(
                    feature
                );

                button.classList.add(
                    'configurator__option--selected'
                );
            }


            console.log(
                'Выбранные функции:',
                configuratorData.features
            );

        });

    });


   nextButton.addEventListener('click', () => {

    // Переходим к последнему шагу
    showContactStep();

});

}

// ========================================
// ШАГ 5 — КОНТАКТЫ
// ========================================

function showContactStep() {

    configuratorStep.innerHTML = `

        <span class="configurator__step-number">
            Шаг 5 из 5
        </span>

        <h3 class="configurator__question">
            Куда отправить расчёт?
        </h3>

        <p class="configurator__description">
            Оставьте свои контакты, и мы свяжемся
            с вами для обсуждения проекта.
        </p>

        <div class="configurator__form">

            <input
                class="configurator__input"
                type="text"
                id="configurator-name"
                placeholder="Ваше имя"
            >

            <input
                class="configurator__input"
                type="tel"
                id="configurator-phone"
                placeholder="Телефон"
            >

            <input
                class="configurator__input"
                type="email"
                id="configurator-email"
                placeholder="Email"
            >

            <div class="configurator__navigation">

            <button
                class="configurator__button configurator__button--back"
                id="contactBackButton"
                type="button"
            >
                ← Назад
            </button>

            <button
                 class="configurator__button configurator__button--next"
                id="configurator-submit"
                type="button"
            >
            Получить расчёт →
            </button>

            </div>

        </div>
    `;


    // Находим поля формы
    const nameInput =
        document.querySelector('#configurator-name');

    const phoneInput =
        document.querySelector('#configurator-phone');

    const emailInput =
        document.querySelector('#configurator-email');


    // Находим кнопку отправки
    const submitButton =
        document.querySelector('#configurator-submit');

    // Находим кнопку "Назад"
    const backButton =
        document.querySelector('#contactBackButton');    

        // Возвращаемся на шаг 4
        backButton.addEventListener('click', () => {

        // Показываем предыдущий шаг
            showFeaturesStep();

        });


    // Обрабатываем отправку
    submitButton.addEventListener('click', () => {

        // Получаем значения полей
        const name =
            nameInput.value.trim();

        const phone =
            phoneInput.value.trim();

        const email =
            emailInput.value.trim();


        // Проверяем имя
        if (!name) {

            alert('Введите ваше имя');

            return;
        }


        // Проверяем телефон
        if (!phone) {

            alert('Введите номер телефона');

            return;
        }


        // Сохраняем контакты
        configuratorData.contact = {
            name,
            phone,
            email,
        };


       // Показываем собранные данные
        console.log(
            '🔥 ГОТОВЫЕ ДАННЫЕ:',
            configuratorData
        );


        // Отправляем заявку на сервер
        sendLead()
            .then(() => {

                // Если сервер успешно принял заявку,
                // показываем результат пользователю
                showResultStep();

            })
            .catch(() => {

                // Если сервер недоступен,
                // сообщаем пользователю об ошибке
                alert(
                    'Не удалось отправить заявку. Попробуйте ещё раз.'
                );

    });
    });

}

// ========================================
// РЕЗУЛЬТАТ
// ========================================

function showResultStep() {

    // Рассчитываем стоимость проекта
    const price = calculatePrice();


    // Сохраняем рассчитанную стоимость
    configuratorData.price = price;


    // Показываем результат пользователю
    configuratorStep.innerHTML = `

        <span class="configurator__step-number">
            Готово
        </span>

        <h3 class="configurator__question">
            Спасибо, ${configuratorData.contact.name}!
        </h3>

        <p class="configurator__description">
            Предварительная стоимость вашего сайта:
        </p>

        <div class="configurator__price">

            ${price.priceFrom.toLocaleString()}
            –
            ${price.priceTo.toLocaleString()} ₽

        </div>

        <p class="configurator__description">
            Это предварительный расчёт.
            Точная стоимость определяется после
            обсуждения проекта.
        </p>

    `;


    // Показываем финальный объект
    console.log(
        '📦 Финальный объект:',
        configuratorData
    );

}


// ========================================
// РАСЧЁТ СТОИМОСТИ
// ========================================

function calculatePrice() {

    // Начальная стоимость сайта
    let price = 15000;


    // Каждый дополнительный раздел
    // увеличивает стоимость
    price += configuratorData.sections.length * 3000;


    // Каждая дополнительная функция
    // тоже увеличивает стоимость
    price += configuratorData.features.length * 5000;


    // Некоторые функции могут стоить дороже
    if (
        configuratorData.features.includes(
            'Онлайн-запись'
        )
    ) {
        price += 5000;
    }


    // Формируем диапазон цены
    const priceFrom = price;

    const priceTo = price + 10000;


    // Возвращаем результат
    return {
        priceFrom,
        priceTo,
    };
}


// ========================================
// ОТПРАВКА ЛИДА В BACKEND
// ========================================

async function sendLead() {

    try {

        // Отправляем данные конфигуратора на сервер
        const response = await fetch(
            'http://localhost:3000/api/leads',
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json',
                },

                body: JSON.stringify({

                    // Данные клиента
                    name: configuratorData.contact.name,
                    phone: configuratorData.contact.phone,
                    email: configuratorData.contact.email,

                    // Данные проекта
                    businessType:
                        configuratorData.businessType,

                    goal:
                        configuratorData.goal,

                    // Превращаем массивы в текст
                    description:
                        `Разделы: ${configuratorData.sections.join(', ')}.
Функции: ${configuratorData.features.join(', ')}.`,

                    // Бюджет пока не указываем
                    budget: 0,

                    // Источник заявки
                    source: 'configurator',

                    // Дополнительные данные
                    options: {
                        sections: configuratorData.sections,
                        features: configuratorData.features,
                    },

                }),
            }
        );


        // Получаем ответ сервера
        const data = await response.json();


        // Проверяем, успешно ли создан лид
        if (!response.ok) {

            throw new Error(
                data.error || 'Ошибка отправки заявки'
            );

        }


        console.log(
            '✅ Лид создан:',
            data
        );


        return data;


    } catch (error) {

        console.error(
            '❌ Ошибка отправки лида:',
            error
        );

        throw error;

    }

}