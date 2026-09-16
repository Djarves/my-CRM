import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [clients, setClients] = useState([]);
  // Состояния для полей формы нового клиента
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [phone, setPhone] = useState('');

  // 1. Функция загрузки клиентов с бэкенда
  const fetchClients = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/clients');
      const data = await response.json();
      setClients(data);
    } catch (err) {
      console.error('Ошибка при получении данных:', err);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // 2. Функция отправки формы (Добавление клиента)
  const handleAddClient = async (e) => {
    e.preventDefault(); // Отменяем перезагрузку страницы при отправке формы
    if (!name) return alert('Имя клиента обязательно!');

    try {
      const response = await fetch('http://localhost:3000/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, budget: Number(budget) || 0, phone }),
      });

      if (response.ok) {
        // Очищаем форму после успешной отправки
        setName('');
        setBudget('');
        setPhone('');
        fetchClients(); // Обновляем список на экране, перечитывая БД
      }
    } catch (err) {
      console.error('Ошибка при добавлении клиента:', err);
    }
  };

  // 3. Функция удаления клиента
  const handleDeleteClient = async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/clients/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchClients(); // Обновляем список
      }
    } catch (err) {
      console.error('Ошибка при удалении:', err);
    }
  }; // <-- ВОТ ЭТУ СКОБКУ МЫ ДОБАВИЛИ, ЧТОБЫ ЗАКРЫТЬ УДАЛЕНИЕ!

  // 4. Функция перевода клиента на следующий этап воронки
  const handleMoveClient = async (id, currentStatus) => {
    let nextStatus = '';
    
    // Определяем следующий шаг по цепочке
    if (currentStatus === 'Новая заявка') nextStatus = 'В работе';
    if (currentStatus === 'В работе') nextStatus = 'Сайт сдан';
    if (!nextStatus) return; // Если уже "Сайт сдан", двигать дальше некуда

    try {
      const response = await fetch(`http://localhost:3000/api/clients/${id}`, {
        method: 'PUT', // Метод обновления данных
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      
      if (response.ok) {
        const updatedData = await response.json();
        // Если сервер прислал массив, сразу сохраняем его, иначе просто перечитываем базу
        if (Array.isArray(updatedData)) {
          setClients(updatedData);
        } else {
          fetchClients();
        }
      }
    } catch (err) {
      console.error('Ошибка при обновлении статуса:', err);
    }
  };
  

  return (
    <div className="crm-container">
      <header className="crm-header">
        <h1>📊 Моя Fullstack CRM-система</h1>
      </header>

      {/* ФОРМА ДОБАВЛЕНИЯ КЛИЕНТА */}
      <form onSubmit={handleAddClient} className="client-form">
        <h3>➕ Добавить новую сделку</h3>
        <div className="form-inputs">
          <input 
            type="text" 
            placeholder="ФИО клиента или компания" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
          />
          <input 
            type="number" 
            placeholder="Бюджет (₽)" 
            value={budget} 
            onChange={(e) => setBudget(e.target.value)} 
          />
          <input 
            type="text" 
            placeholder="Номер телефона" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
          />
          <button type="submit">Добавить</button>
        </div>
      </form>

      {/* КАНБАН-ДОСКА С КОЛОНКАМИ */}
      <div className="kanban-board">
        
        {/* КОЛОНКА 1: НОВЫЕ ЗАЯВКИ */}
        <div className="kanban-column">
          <div className="column-header new">Новая заявка ({clients.filter(c => c.status === 'Новая заявка').length})</div>
          <div className="column-body">
            {clients.filter(c => c.status === 'Новая заявка').map(client => (
              <div key={client.id} className="client-card">
                <button onClick={() => handleDeleteClient(client.id)} className="btn-delete">❌</button>
                <h3>{client.name}</h3>
                <p><strong>Бюджет:</strong> {client.budget.toLocaleString()} ₽</p>
                <p><strong>Тел:</strong> {client.phone || '—'}</p>
                <button onClick={() => handleMoveClient(client.id, client.status)} className="btn-move">В работу ➡️</button>
              </div>
            ))}
          </div>
        </div>

        {/* КОЛОНКА 2: В РАБОТЕ */}
        <div className="kanban-column">
          <div className="column-header in-progress">В работе ({clients.filter(c => c.status === 'В работе').length})</div>
          <div className="column-body">
            {clients.filter(c => c.status === 'В работе').map(client => (
              <div key={client.id} className="client-card">
                <button onClick={() => handleDeleteClient(client.id)} className="btn-delete">❌</button>
                <h3>{client.name}</h3>
                <p><strong>Бюджет:</strong> {client.budget.toLocaleString()} ₽</p>
                <p><strong>Тел:</strong> {client.phone || '—'}</p>
                <button onClick={() => handleMoveClient(client.id, client.status)} className="btn-move font-done">Сдан 👑</button>
              </div>
            ))}
          </div>
        </div>

        {/* КОЛОНКА 3: ГОТОВО */}
        <div className="kanban-column">
          <div className="column-header done">Сайт сдан ({clients.filter(c => c.status === 'Сайт сдан').length})</div>
          <div className="column-body">
            {clients.filter(c => c.status === 'Сайт сдан').map(client => (
              <div key={client.id} className="client-card">
                <button onClick={() => handleDeleteClient(client.id)} className="btn-delete">❌</button>
                <h3>{client.name}</h3>
                <p><strong>Бюджет:</strong> {client.budget.toLocaleString()} ₽</p>
                <p><strong>Тел:</strong> {client.phone || '—'}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;