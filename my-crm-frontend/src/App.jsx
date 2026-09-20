import { useState, useEffect } from 'react';

import './App.css';

// Импортируем функции для работы с backend.
import {
  getLeads,
  createLead,
  updateLeadStatus,
  deleteLead,
} from './services/api';


function App() {

  // Здесь теперь хранятся НЕ clients,
  // а leads из нашей новой системы.
  const [leads, setLeads] = useState([]);

  // Храним лида, которого пользователь открыл.
  // Если здесь null — ни один лид не выбран.
  const [selectedLead, setSelectedLead] = useState(null);

  // Показывает, открыта ли форма редактирования.
  const [isEditing, setIsEditing] = useState(false);


  // Поля формы.
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [phone, setPhone] = useState('');
  const [editName, setEditName] = useState('');


  // ==================================================
  // ЗАГРУЗКА ЛИДОВ
  // ==================================================

  async function fetchLeads() {

    try {

      // Получаем лидов через api.js.
      const data = await getLeads();

      // Сохраняем их в React state.
      setLeads(data);

    } catch (error) {

      console.error(
        'Ошибка загрузки лидов:',
        error
      );
    }
  }


  // Загружаем лидов,
  // когда CRM впервые открывается.
  useEffect(() => {

    fetchLeads();

  }, []);


  // ==================================================
  // СОЗДАНИЕ ЛИДА
  // ==================================================

  async function handleAddLead(event) {

    // Запрещаем браузеру
    // перезагрузить страницу.
    event.preventDefault();


    // Проверяем имя.
    if (!name.trim()) {

      alert('Имя клиента обязательно!');

      return;
    }


    try {

      // Создаём новый лид.
      await createLead({

        name,

        phone,

        budget: Number(budget) || 0,

        // Пока тестовые значения.
        // Позже сюда придут данные
        // из нашего конфигуратора.
        businessType: 'Не указан',

        goal: 'Не указана',

        description: '',

        options: {},

        source: 'crm',
      });


      // Очищаем форму.
      setName('');
      setBudget('');
      setPhone('');


      // Снова получаем данные из БД.
      await fetchLeads();


    } catch (error) {

      console.error(
        'Ошибка создания лида:',
        error
      );

      alert(
        'Не удалось создать лида'
      );
    }
  }


  // ==================================================
  // ПЕРЕМЕЩЕНИЕ ПО ВОРОНКЕ
  // ==================================================

// Перемещение лида по этапам воронки.
async function handleMoveLead(
  id,
  currentStatus,
  direction
) {
  // Все основные этапы нашей воронки.
  const statuses = [
    'NEW',
    'CONTACTED',
    'DISCUSSION',
    'OFFER',
    'WON',
    'LOST'
  ];

  // Находим позицию текущего статуса.
  const currentIndex =
    statuses.indexOf(currentStatus);

    // Если лид находится в LOST,
// возвращаем его обратно в начало воронки.
if (direction === 'restore') {
  try {
    await updateLeadStatus(
      id,
      'NEW'
    );

    await fetchLeads();
  } catch (error) {
    console.error(
      'Ошибка восстановления лида:',
      error
    );
  }

  return;
}

    // Если лид потерян —
 // сразу переводим его в LOST.
if (direction === 'lost') {
  try {
    await updateLeadStatus(
      id,
      'LOST'
    );

    await fetchLeads();
  } catch (error) {
    console.error(
      'Ошибка изменения статуса:',
      error
    );
  }

  return;
}

  // Вычисляем новый индекс.
  const newIndex =
    direction === 'next'
      ? currentIndex + 1
      : currentIndex - 1;

  // Если дальше или назад идти нельзя —
  // ничего не делаем.
  if (
    newIndex < 0 ||
    newIndex >= statuses.length
  ) {
    return;
  }

  // Получаем новый статус.
  const nextStatus =
    statuses[newIndex];

  try {
    // Отправляем новый статус на backend.
    await updateLeadStatus(
      id,
      nextStatus
    );

    // После изменения снова загружаем лиды
    // из базы данных.
    await fetchLeads();
  } catch (error) {
    console.error(
      'Ошибка изменения статуса:',
      error
    );
  }
}

// ==================================================
// УДАЛЕНИЕ ЛИДА
// ==================================================

async function handleDeleteLead(id) {

  // Спрашиваем подтверждение перед удалением.
  const confirmed = window.confirm(
    'Удалить этого лида?'
  );

  // Если пользователь нажал "Отмена",
  // прекращаем выполнение функции.
  if (!confirmed) {
    return;
  }

  try {

    // Отправляем DELETE-запрос на backend.
    await deleteLead(id);

    // Получаем актуальные данные из БД.
    await fetchLeads();

  } catch (error) {

    console.error(
      'Ошибка удаления лида:',
      error
    );

    alert(
      'Не удалось удалить лида'
    );
  }
}


  // ==================================================
  // ОТОБРАЖЕНИЕ
  // ==================================================

  return (

    <div className="crm-container">

      <header className="crm-header">

        <h1>
          📊 Моя Fullstack CRM-система
        </h1>

      </header>


      {/* ФОРМА НОВОГО ЛИДА */}

      <form
        onSubmit={handleAddLead}
        className="client-form"
      >

        <h3>
          ➕ Добавить новый лид
        </h3>


        <div className="form-inputs">

          <input
            type="text"
            placeholder="ФИО клиента или компания"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
          />


          <input
            type="number"
            placeholder="Бюджет (₽)"
            value={budget}
            onChange={(event) =>
              setBudget(event.target.value)
            }
          />


          <input
            type="text"
            placeholder="Номер телефона"
            value={phone}
            onChange={(event) =>
              setPhone(event.target.value)
            }
          />


          <button type="submit">
            Добавить
          </button>

        </div>

      </form>


      {/* ==================================================
          ВОРОНКА
          ================================================== */}

      <div className="kanban-board">


        {/* NEW */}

        <KanbanColumn
          title="🆕 Новые"
          status="NEW"
          leads={leads}
          onMove={handleMoveLead}
          onDelete={handleDeleteLead}
          onSelect={setSelectedLead}
        />


        {/* CONTACTED */}

        <KanbanColumn
          title="📞 Связались"
          status="CONTACTED"
          leads={leads}
          onMove={handleMoveLead}
          onDelete={handleDeleteLead}
          onSelect={setSelectedLead}
        />


        {/* DISCUSSION */}

        <KanbanColumn
          title="💬 Обсуждение"
          status="DISCUSSION"
          leads={leads}
          onMove={handleMoveLead}
          onDelete={handleDeleteLead}
          onSelect={setSelectedLead}
        />


        {/* OFFER */}

        <KanbanColumn
          title="📄 Предложение"
          status="OFFER"
          leads={leads}
          onMove={handleMoveLead}
          onDelete={handleDeleteLead}
          onSelect={setSelectedLead}
        />


        {/* WON */}

        <KanbanColumn
          title="💰 Сделка"
          status="WON"
          leads={leads}
          onMove={handleMoveLead}
          onDelete={handleDeleteLead}
          onSelect={setSelectedLead}
        />


        {/* LOST */}

        <KanbanColumn
          title="❌ Потеряно"
          status="LOST"
          leads={leads}
          onMove={handleMoveLead}
          onDelete={handleDeleteLead}
          onSelect={setSelectedLead}
        />

      </div>

        {selectedLead && (
          <div className="lead-modal"
          onClick={() => setSelectedLead(null)}
          >
            <div className="lead-modal-content"
            onClick={(event) => event.stopPropagation()}
            >

              <button
                onClick={() => setSelectedLead(null)}
                className="lead-modal-close"
              >
                ✕
              </button>

      <h2>
        {selectedLead.name}
      </h2>

      <p>
        <strong>Телефон:</strong>{' '}
        {selectedLead.phone || '—'}
      </p>

      <p>
        <strong>Email:</strong>{' '}
        {selectedLead.email || '—'}
      </p>

      <p>
        <strong>Бизнес:</strong>{' '}
        {selectedLead.business_type || '—'}
      </p>

      <p>
        <strong>Цель:</strong>{' '}
        {selectedLead.goal || '—'}
      </p>

      <p>
        <strong>Бюджет:</strong>{' '}
        {(selectedLead.budget || 0).toLocaleString()} ₽
      </p>

      <p>
        <strong>Предварительная цена:</strong>{' '}
        {selectedLead.price_from || 0}
        {' '}–{' '}
        {selectedLead.price_to || 0} ₽
      </p>

      <p>
        <strong>Дата создания:</strong>{' '}
        {new Date(selectedLead.created_at).toLocaleString('ru-RU')}
      </p>

      <p>
        <strong>Статус:</strong>{' '}
        {selectedLead.status}
      </p>

        <button
          className="btn-edit-lead"
          onClick={() => {
             // Берём имя выбранного лида и кладём его в поле редактирования.
              setEditName(selectedLead.name || '');
              setIsEditing(true);
            console.log('✏️ Редактируем лид:', selectedLead);
          }}
        >
          ✏️ Редактировать
        </button>

       {isEditing && (
        <div className="edit-form">

          <label>
            Имя:

            <input
              type="text"
              value={editName}
              onChange={(event) => {
                setEditName(event.target.value);
             }}
            />
          </label>

           </div>
        )}

      <p>
        <strong>Описание:</strong>
      </p>

      <p>
        {selectedLead.description || 'Нет описания'}
      </p>

      <p>
        <strong>AI-бриф:</strong>
      </p>

      <p>
        {selectedLead.ai_brief || 'AI-бриф пока отсутствует'}
      </p>

    </div>
  </div>
)}

    </div>
  );
}


// ==================================================
// КОЛОНКА KANBAN
// ==================================================

function KanbanColumn({
  title,
  status,
  leads,
  onMove,
  onDelete,
  onSelect,
}) {

  // Оставляем только лидов
  // текущего статуса.
  const columnLeads = leads.filter(
    (lead) =>
      lead.status === status
  );


  return (

    <div className="kanban-column">

      <div className="column-header">

        {title}

        {' '}

        ({columnLeads.length})

      </div>


      <div className="column-body">

        {columnLeads.map((lead) => (

          <div
            key={lead.id}
            className="client-card"
            onClick={() => onSelect(lead)}
            
          >

          <button
            onClick={(event) => {
              event.stopPropagation();
              onDelete(lead.id);
              }}
            className="btn-delete"
          >
            🗑️
          </button>

            <h3>
              {lead.name}
            </h3>


            <p>
              <strong>
                Бюджет:
              </strong>{' '}

              {(lead.budget || 0)
                .toLocaleString()}

              {' '}₽
            </p>


            <p>
              <strong>
                Тел:
              </strong>{' '}

              {lead.phone || '—'}
            </p>


            <p>
              <strong>
                Предварительно:
              </strong>{' '}

              {lead.price_from || 0}
              {' '}–{' '}
              {lead.price_to || 0}
              {' '}₽
            </p>

      
<div className="lead-actions">

  {/* Если лид потерян — даём возможность вернуть его */}
  {status === 'LOST' && (
    <button
      onClick={() =>
        onMove(
          lead.id,
          lead.status,
          'restore'
        )
      }
      className="btn-move"
    >
      ↩️ Вернуть
    </button>
  )}

  {/* Кнопка назад для обычных этапов */}
  {status !== 'NEW' &&
    status !== 'LOST' && (
      <button
        onClick={(event) => {
          event.stopPropagation();
          onMove(lead.id, lead.status, 'prev');
            }}
        className="btn-move"
      >
        ⬅️ Назад
      </button>
  )}

  {/* Кнопка вперёд */}
  {status !== 'WON' &&
    status !== 'LOST' && (
      <button
        onClick={(event) => {
          event.stopPropagation();
          onMove(lead.id, lead.status, 'next');
            }}
        className="btn-move"
      >
        Вперёд ➡️
      </button>
  )}

  {/* Перевести в "Потеряно" */}
  {status !== 'LOST' &&
    status !== 'WON' && (
      <button
        onClick={(event) => {
         event.stopPropagation();
          onMove(lead.id, lead.status, 'lost');
           }}
        className="btn-lost"
      >
        ❌ Потеряно
      </button>
  )}

</div>

          </div>

        ))}

      </div>

    </div>
  );
}


export default App;