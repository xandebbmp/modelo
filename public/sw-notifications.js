// Service Worker para BeautyFinance - Gerenciador de Notificações Push Fiscais
const SW_VERSION = 'beauty-finance-push-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listener para clique na notificação nativa do sistema operacional
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const urlToOpen = data.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Se já houver uma janela aberta do BeautyFinance, foca nela e redireciona
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if (data.url && 'navigate' in client) {
            client.navigate(urlToOpen);
          }
          return client.focus();
        }
      }
      // Se não houver janela aberta, abre uma nova
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Listener para fechamento de notificação pelo usuário
self.addEventListener('notificationclose', (event) => {
  // Opcional: registrar analytics ou telemetria de descarte
});

// Listener para eventos de Push enviados pelo backend ou simulador de segundo plano
self.addEventListener('push', (event) => {
  let pushData = {
    title: 'BeautyFinance - Alerta Fiscal',
    body: 'Você possui uma obrigação fiscal com vencimento próximo.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'alerta-fiscal-geral',
    data: { url: '/dashboard' }
  };

  if (event.data) {
    try {
      pushData = Object.assign(pushData, event.data.json());
    } catch (e) {
      pushData.body = event.data.text();
    }
  }

  const options = {
    body: pushData.body,
    icon: pushData.icon || '/favicon.ico',
    badge: pushData.badge || '/favicon.ico',
    tag: pushData.tag || 'alerta-fiscal-geral',
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    data: pushData.data || { url: '/dashboard' },
    actions: pushData.actions || [
      { action: 'open_dashboard', title: 'Ver no Painel' },
      { action: 'close', title: 'Dispensar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(pushData.title, options)
  );
});
