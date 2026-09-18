import { useState, useEffect } from 'react';

import './App.css';

// Импортируем функции для работы с backend.
import {
  getLeads,
  createLead,
  updateLeadStatus,
} from './services/api';


function App() {

  // Здесь теперь хранятся НЕ clients,
  // а leads из нашей новой системы.
  const [leads, setLeads] = useState([]);


  // Поля формы.
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [phone, setPhone] = useState('');


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

  async function handleMoveLead(
    id,
    currentStatus
  ) {

    // Определяем следующий статус.
    let nextStatus;


    if (currentStatus === 'NEW') {
      nextStatus = 'CONTACTED';
    }

    if (currentStatus === 'CONTACTED') {
      nextStatus = 'DISCUSSION';
    }

    if (currentStatus === 'DISCUSSION') {
      nextStatus = 'OFFER';
    }

    if (currentStatus === 'OFFER') {
      nextStatus = 'WON';
    }


    // Если следующего статуса нет,
    // ничего не делаем.
    if (!nextStatus) {
      return;
    }


    try {

      // Отправляем новый статус
      // на backend.
      await updateLeadStatus(
        id,
        nextStatus
      );


      // Получаем актуальные данные.
      await fetchLeads();


    } catch (error) {

      console.error(
        'Ошибка изменения статуса:',
        error
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
        />


        {/* CONTACTED */}

        <KanbanColumn
          title="📞 Связались"
          status="CONTACTED"
          leads={leads}
          onMove={handleMoveLead}
        />


        {/* DISCUSSION */}

        <KanbanColumn
          title="💬 Обсуждение"
          status="DISCUSSION"
          leads={leads}
          onMove={handleMoveLead}
        />


        {/* OFFER */}

        <KanbanColumn
          title="📄 Предложение"
          status="OFFER"
          leads={leads}
          onMove={handleMoveLead}
        />


        {/* WON */}

        <KanbanColumn
          title="💰 Сделка"
          status="WON"
          leads={leads}
          onMove={handleMoveLead}
        />


        {/* LOST */}

        <KanbanColumn
          title="❌ Потеряно"
          status="LOST"
          leads={leads}
          onMove={handleMoveLead}
        />

      </div>

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
          >

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


            {status !== 'WON' &&
              status !== 'LOST' && (

                <button
                  onClick={() =>
                    onMove(
                      lead.id,
                      lead.status
                    )
                  }
                  className="btn-move"
                >
                  Следующий этап ➡️
                </button>

              )}

          </div>

        ))}

      </div>

    </div>
  );
}


export default App;