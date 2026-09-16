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
  };

  return (
    <div className="crm-container">
      <header className="crm-header">
        <h1>📊 Моя Fullstack CRM-система</h1>
      </header>

      {/* ФОРМА ДОБАВЛЕНИЯ КЛИЕНТА */}
      <form onSubmit={handleAddClient} className="client-form">
        <h3>➕ Добавить нового клиента в базу Neon</h3>
        <input 
          type="text" 
          placeholder="ФИО клиента или компания" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
        />
        <input 
          type="number" 
          placeholder="Бюджет сделки (₽)" 
          value={budget} 
          onChange={(e) => setBudget(e.target.value)} 
        />
        <input 
          type="text" 
          placeholder="Номер телефона" 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)} 
        />
        <button type="submit">Сохранить в базу</button>
      </form>

      {/* СПИСОК КАРТОЧЕК */}
      <h2>👥 Текущие сделки в работе:</h2>
      <div className="clients-grid">
        {clients.length === 0 ? (
          <p className="no-data">В базе данных PostgreSQL пока нет клиентов. Заполните форму выше!</p>
        ) : (
          clients.map((client) => (
            <div key={client.id} className="client-card">
              <button onClick={() => handleDeleteClient(client.id)} className="btn-delete">❌</button>
              <h3>👤 {client.name}</h3>
              <p><strong>Статус:</strong> <span className="status-badge">{client.status}</span></p>
              <p><strong>Бюджет:</strong> {client.budget.toLocaleString()} ₽</p>
              <p><strong>Телефон:</strong> {client.phone || 'Не указан'}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;