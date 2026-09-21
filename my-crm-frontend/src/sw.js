// Подключаем Workbox,
// который VitePWA вставит при сборке.
import { precacheAndRoute } from 'workbox-precaching';

// Кэшируем файлы приложения.
precacheAndRoute(self.__WB_MANIFEST);


// Получаем Push-уведомление.
self.addEventListener('push', (event) => {

  // Получаем данные от backend.
  const data = event.data
    ? event.data.json()
    : {};

  // Показываем системное уведомление.
  event.waitUntil(
    self.registration.showNotification(
      data.title || 'My CRM',
      {
        body:
          data.body ||
          'У вас новое уведомление',

        icon:
          data.icon ||
          '/icons/icon-192.png',
      }
    )
  );
});