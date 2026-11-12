import { useState, useEffect } from 'react';

// Подключаем компоненты маршрутизации.
import { Routes, Route, Navigate } from 'react-router-dom';

// Подключаем отдельную страницу Super Admin.
import SuperAdmin from './pages/SuperAdmin';

import Organizations from './pages/Organizations';

import Users from './pages/Users';

import './App.css';

// Импортируем функции для работы с backend.
import {
  getLeads,
  createLead,
  updateLeadStatus,
  updateLead,
  deleteLead,
  getMe,
  login,
  logout,
  register,
} from './services/api';

import AdminLayout from './components/AdminLayout';

function CrmApp() {

  // Здесь теперь хранятся НЕ clients,
  // а leads из нашей новой системы.
  const [leads, setLeads] = useState([]);

  // Данные текущего пользователя.
const [user, setUser] = useState(null);

// Определяем режим окна авторизации.
// login — вход, register — регистрация.
const [authMode, setAuthMode] = useState('login');

// Имя нового пользователя.
// Имя пользователя при регистрации.
const [registerName, setRegisterName] = useState('');

// Название организации нового пользователя.
const [organizationName, setOrganizationName] = useState('');

// Данные организации пользователя.
const [organization, setOrganization] = useState(null);

// Пока true — проверяем авторизацию.
const [authLoading, setAuthLoading] = useState(true);

// Сообщение об ошибке авторизации.
const [authError, setAuthError] = useState('');

// Значения полей формы входа.
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');

// Показывает, выполняется ли вход.
const [loginLoading, setLoginLoading] = useState(false);

    // Храним состояние разрешения на уведомления.
  // Возможные значения:
  // 'default' — пользователь ещё ничего не выбрал.
  // 'granted' — уведомления разрешены.
  // 'denied' — уведомления запрещены.
  const [notificationPermission, setNotificationPermission] =
    useState(
      'Notification' in window
        ? Notification.permission
        : 'unsupported'
    );

  // Храним лида, которого пользователь открыл.
  // Если здесь null — ни один лид не выбран.
  const [selectedLead, setSelectedLead] = useState(null);

  // Показывает, открыта ли форма редактирования.
  const [isEditing, setIsEditing] = useState(false);


  // Поля формы.
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [phone, setPhone] = useState('');
  // Поля редактирования выбранного лида.
const [editName, setEditName] = useState('');
const [editPhone, setEditPhone] = useState('');
const [editEmail, setEditEmail] = useState('');
const [editBudget, setEditBudget] = useState('');

// Показывает, выполняется ли сохранение лида.
const [isSavingLead, setIsSavingLead] = useState(false);


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


// Проверяем авторизацию при открытии CRM.
useEffect(() => {

  // Нужен, чтобы не обновлять состояние
  // после размонтирования компонента.
  let isMounted = true;

  async function checkAuth() {
    try {
      // Запрашиваем данные текущего пользователя.
      const data = await getMe();

      if (!isMounted) return;

      // Сохраняем пользователя.
      setUser(data.user);

      // Загружаем лидов только после проверки.
      await fetchLeads();

    } catch (error) {

      if (!isMounted) return;

      // 401 означает, что пользователь не вошёл.
      if (error.status === 401) {
        setUser(null);
      } else {
        // Например, backend временно недоступен.
        setAuthError(error.message);
      }

    } finally {

      // Проверка авторизации завершена.
      if (isMounted) {
        setAuthLoading(false);
      }
    }
  }

  checkAuth();

  // Очистка при размонтировании.
  return () => {
    isMounted = false;
  };

}, []);

// Вход пользователя в CRM.
async function handleLogin(event) {

  // Не даём форме перезагрузить страницу.
  event.preventDefault();

  // Сбрасываем предыдущую ошибку.
  setAuthError('');

  try {
    // Показываем, что вход выполняется.
    setLoginLoading(true);

    // Отправляем email и пароль на backend.
    const data = await login(email, password);

    // Сохраняем авторизованного пользователя.
    setUser(data.user);

    // Загружаем лидов его организации.
    await fetchLeads();

    // Очищаем пароль после входа.
    setPassword('');

  } catch (error) {

    // Показываем ошибку на экране.
    setAuthError(error.message);

  } finally {

    // Возвращаем кнопку в обычное состояние.
    setLoginLoading(false);
  }
}

// Регистрируем нового пользователя.
async function handleRegister(event) {

  // Не даём форме перезагрузить страницу.
  event.preventDefault();

  // Сбрасываем предыдущую ошибку.
  setAuthError('');

  try {

    // Показываем, что регистрация выполняется.
    setLoginLoading(true);

    // Отправляем данные регистрации на backend.
    const data = await register(
  registerName,
  email,
  password,
  organizationName
);

    // Сохраняем авторизованного пользователя.
    setUser(data.user);

    // Загружаем заявки его организации.
    await fetchLeads();

    // Очищаем пароль.
    setPassword('');

  } catch (error) {

    // Показываем ошибку регистрации.
    setAuthError(error.message);

  } finally {

    // Возвращаем кнопку в обычное состояние.
    setLoginLoading(false);
  }
}

// Выход пользователя из CRM.
async function handleLogout() {

  try {

    // Отправляем запрос на backend для удаления cookie.
    await logout();

    // Удаляем пользователя из состояния React.
    setUser(null);

    // Очищаем список лидов.
    setLeads([]);

    // Закрываем открытую карточку лида.
    setSelectedLead(null);

    // Очищаем возможную ошибку авторизации.
    setAuthError('');

    // Очищаем пароль.
    setPassword('');

  } catch (error) {

    // Показываем ошибку, если выйти не удалось.
    console.error('Ошибка выхода:', error);

    setAuthError(error.message);
  }
}

  // ==================================================
  // УВЕДОМЛЕНИЯ
  // ==================================================

 async function handleEnableNotifications() {

  console.log('🔔 Нажата кнопка уведомлений');


  // Проверяем, поддерживает ли браузер уведомления.
  if (!('Notification' in window)) {
    alert('Этот браузер не поддерживает уведомления.');
    return;
  }

  // Проверяем поддержку настоящих Push-уведомлений.
  if (!('PushManager' in window)) {
    alert('Этот браузер не поддерживает Push-уведомления.');
    return;
  }

  // Запрашиваем разрешение пользователя.
  const permission =
    await Notification.requestPermission();

  // Сохраняем результат.
  setNotificationPermission(permission);

  // Если разрешение не получено — прекращаем работу.
  if (permission !== 'granted') {
    return;
  }

  // Ждём готовности Service Worker.
  const registration =
    await navigator.serviceWorker.ready;
    
    console.log('✅ Service Worker готов:', registration);

  // Получаем публичный VAPID-ключ.
  const vapidPublicKey =
    import.meta.env.VITE_VAPID_PUBLIC_KEY;

    console.log(
    '🔑 VAPID public key:',
    vapidPublicKey
);

  // Создаём настоящую Push-подписку.
  const subscription =
    await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidPublicKey,
    });

  // Пока просто смотрим подписку в Console.
  console.log(
    '🔔 Push-подписка создана:',
    subscription
  );

// Отправляем Push-подписку на backend.
console.log(
  '📡 Отправляем Push-подписку на backend...'
);

try {

  // Отправляем Push-подписку на backend.
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/push/subscribe`,
    {
      method: 'POST',

      // Передаём cookie с JWT на backend.
      credentials: 'include',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify(subscription),
    }
  );

  // Получаем ответ backend.
  const data = await response.json();

  // Проверяем, успешно ли сохранена подписка.
  if (!response.ok) {
    throw new Error(
      data.message || `Ошибка сервера: ${response.status}`
    );
  }

  console.log('✅ Push-подписка сохранена:', data);

  // Показываем уведомление только после успешного ответа.
  registration.showNotification(
    'SKLAD',
    {
      body: 'Push-подписка успешно сохранена! 🔔',
      icon: '/icons/icon-192.png',
    }
  );

} catch (error) {

  // Записываем ошибку в консоль.
  console.error(
    '❌ Ошибка сохранения Push-подписки:',
    error
  );

  // Сообщаем пользователю о проблеме.
  alert(
    error.message || 'Не удалось сохранить Push-подписку'
  );

  return;
}
}
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


// Сохраняем изменения лида.
async function handleSaveLead() {

  // Проверяем, выбран ли лид.
  if (!selectedLead) {
    return;
  }

  // Проверяем, что имя не пустое.
  if (!editName.trim()) {
    alert('Имя клиента обязательно');
    return;
  }

  try {

    // Блокируем повторное нажатие кнопки.
    setIsSavingLead(true);


    // Отправляем все изменённые данные на backend.
const data = await updateLead(
  selectedLead.id,
  {
    name: editName.trim(),
    phone: editPhone.trim(),
    email: editEmail.trim(),
    budget: editBudget === ''
      ? null
      : Number(editBudget),
  }
);

    // Получаем обновлённого лида.
    const updatedLead = data.lead;
    // Проверяем, какие данные вернул backend.
console.log('Ответ backend:', updatedLead);

    // Обновляем лид в общем списке CRM.
    setLeads((previousLeads) =>
      previousLeads.map((lead) =>
        lead.id === updatedLead.id
          ? updatedLead
          : lead
      )
    );

    // Обновляем открытую карточку.
    setSelectedLead(updatedLead);

    // Закрываем режим редактирования.
    setIsEditing(false);

  } catch (error) {

    console.error(
      'Ошибка сохранения лида:',
      error
    );

    alert(error.message || 'Не удалось сохранить изменения');

  } finally {

    // Разрешаем повторное сохранение.
    setIsSavingLead(false);
  }
}


  // ==================================================
  // ОТОБРАЖЕНИЕ
  // ==================================================

  // Пока проверяем авторизацию — не показываем CRM.
if (authLoading) {
  return (
    <div className="auth-screen">
      <h2>Проверяем авторизацию...</h2>
    </div>
  );
}

// Если пользователя нет — показываем форму авторизации.
if (!user) {
  return (
    <div className="auth-screen">

      <form
        className="auth-card"
        onSubmit={
          authMode === 'login'
            ? handleLogin
            : handleRegister
        }
      >

        {/* Название платформы. */}
        <h2>Авторизация</h2>

        {/* Переключение между входом и регистрацией. */}
        <div className="auth-tabs">

          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setAuthError('');
            }}
          >
            Вход
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setAuthError('');
            }}
          >
            Регистрация
          </button>

        </div>

        {/* Поле имени показываем только при регистрации. */}
        {authMode === 'register' && (
          <input
            type="text"
            placeholder="Ваше имя"
            value={registerName}
            onChange={(event) =>
              setRegisterName(event.target.value)
            }
            required
          />
        )}

        {/* Поле организации показываем только при регистрации. */}
        {authMode === 'register' && (
          <input
            type="text"
            placeholder="Название организации"
            value={organizationName}
            onChange={(event) =>
              setOrganizationName(event.target.value)
            }
            required
          />
        )}

        {/* Email нужен для обоих режимов. */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        {/* Пароль нужен для обоих режимов. */}
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {/* Показываем сообщение об ошибке. */}
        {authError && (
          <p className="auth-error">
            {authError}
          </p>
        )}

        {/* Кнопка отправки формы. */}
        <button
          type="submit"
          disabled={loginLoading}
        >
          {loginLoading
            ? 'Подождите...'
            : authMode === 'login'
              ? 'Войти'
              : 'Зарегистрироваться'}
        </button>

      </form>

    </div>
  );
}

  return (

    <div className="crm-container">

      <header className="crm-header">

  <h1>
     SKLAD
  </h1>
{/* Кнопка перехода в панель Super Admin. */}
{user.platformRole === 'super_admin' && (
  <button
    onClick={() => {
      window.location.href = '/super-admin';
    }}
  >
    ⚙️ Панель Super Admin
  </button>
)}
      {/* Кнопка выхода из аккаунта. */}
  <button
    onClick={handleLogout}
  >
    🚪 Выйти
  </button>
  <button
    onClick={handleEnableNotifications}
  >
    {notificationPermission === 'granted'
      ? '🔔 Уведомления включены'
      : '🔔 Включить уведомления'}
  </button>

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

    // Заполняем форму данными выбранного лида.
    setEditName(selectedLead.name || '');
    setEditPhone(selectedLead.phone || '');
    setEditEmail(selectedLead.email || '');
    setEditBudget(
      selectedLead.budget !== null &&
      selectedLead.budget !== undefined
        ? String(selectedLead.budget)
        : ''
    );

    // Открываем режим редактирования.
    setIsEditing(true);

    console.log('✏️ Редактируем лид:', selectedLead);
  }}
>
  ✏️ Редактировать
</button>

{isEditing && (
  <div className="edit-form">

    {/* Имя клиента. */}
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

    {/* Телефон клиента. */}
    <label>
      Телефон:

      <input
        type="tel"
        value={editPhone}
        onChange={(event) => {
          setEditPhone(event.target.value);
        }}
      />
    </label>

    {/* Email клиента. */}
    <label>
      Email:

      <input
        type="email"
        value={editEmail}
        onChange={(event) => {
          setEditEmail(event.target.value);
        }}
      />
    </label>

    {/* Бюджет клиента. */}
    <label>
      Бюджет (₽):

      <input
        type="number"
        min="0"
        value={editBudget}
        onChange={(event) => {
          setEditBudget(event.target.value);
        }}
      />
    </label>

    {/* Сохранение изменений. */}
    <button
      onClick={handleSaveLead}
      disabled={isSavingLead}
    >
      {isSavingLead ? 'Сохраняем...' : '💾 Сохранить'}
    </button>

    {/* Отмена редактирования. */}
    <button
      onClick={() => {
        setIsEditing(false);
      }}
      disabled={isSavingLead}
    >
      Отмена
    </button>

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



 // Главное приложение SKLAD с маршрутизацией.

function App() {
    return (
        <Routes>

            {/* Основная CRM остаётся без изменений */}
            <Route path="/" element={<CrmApp />} />

            {/* Общая оболочка административной панели */}
            <Route path="/super-admin" element={<AdminLayout />}>

                {/* Главная страница Super Admin */}
                <Route index element={<SuperAdmin />} />

                {/* Управление организациями */}
                <Route
                    path="organizations"
                    element={<Organizations />}
                />

                {/* Управление пользователями */}
                <Route
                    path="users"
                    element={<Users />}
                />

            </Route>

            {/* Несуществующие страницы перенаправляем в CRM */}
            <Route
                path="*"
                element={<Navigate to="/" replace />}
            />

        </Routes>
    );
}

export default App;



