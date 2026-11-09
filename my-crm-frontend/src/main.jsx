// Импортируем StrictMode для дополнительной проверки React.
import { StrictMode } from 'react';

// Импортируем createRoot для запуска React.
import { createRoot } from 'react-dom/client';

// Импортируем BrowserRouter для маршрутизации.
import { BrowserRouter } from 'react-router-dom';

// Подключаем общие стили.
import './index.css';

// Импортируем главное приложение.
import App from './App.jsx';

// Находим HTML-элемент root и запускаем React.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Подключаем маршрутизацию ко всему приложению. */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);