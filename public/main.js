const buttons = document.querySelectorAll('.projects__button');
const modal = document.getElementById('modal');
const closeBtn = document.querySelector('.modal__close');

const title = document.getElementById('modal-title');
const description = document.getElementById('modal-description');

buttons.forEach(button => {
    button.addEventListener('click', () => {

        const project = button.dataset.project;

        if (project === 'autoservice') {
            title.textContent = 'AutoService Landing';
            description.textContent =
                'Адаптивный лендинг для автосервиса. Использовал HTML и CSS, проработал структуру и адаптив.';
        }

        if (project === 'metriks') {
            title.textContent = 'Real Estate Website';
            description.textContent =
                'Сайт недвижимости, сверстанный по макету. Использовал Flexbox и адаптивную верстку.';
        }

        if (project === 'brows') {
            title.textContent = 'Brow Studio';
            description.textContent =
                'Коммерческий проект для студии. Упор на чистый дизайн и удобство пользователя.';
        }

        if (project === 'movie') {
            title.textContent = 'Movie App';
            description.textContent =
                'Приложение с Firebase. Работа с API, асинхронность и динамический контент.';
        }

        if (project === 'todo') {
            title.textContent = 'Todo App';
            description.textContent =
                'Приложение задач. Работа с DOM и базовой логикой JavaScript.';
        }

        modal.classList.add('active');
    });
});

/* закрытие */
closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('active');
    }
});
