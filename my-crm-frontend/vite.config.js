import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Настройки Vite.
export default defineConfig({
   server: {
    host: true,
  },

  plugins: [
    // Подключаем React.
    react(),

    // Настройки PWA.
    VitePWA({
      // Если появится новая версия приложения,
      // service worker сможет обновить её автоматически.
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      // Информация о нашем приложении.
      manifest: {
        name: 'My CRM',
        short_name: 'My CRM',
        description: 'CRM для управления клиентами и заявками',

        // Цвет интерфейса приложения.
        theme_color: '#ffffff',

        // Цвет фона при запуске.
        background_color: '#ffffff',

        // Открываем CRM как отдельное приложение,
        // а не как обычную вкладку браузера.
        display: 'standalone',

        // Страница, которая открывается при запуске.
        start_url: '/',
        lang: 'ru-RU',

        
        icons: [
  {
    src: '/icons/icon-192.png',
    sizes: '192x192',
    type: 'image/png',
  },
  {
    src: '/icons/icon-512.png',
    sizes: '512x512',
    type: 'image/png',
  },
],
      },
    }),
  ],
})