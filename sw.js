const CACHE_NAME = 'finnotrato-v2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './js/config.js',
    './js/state.js',
    './js/auth.js',
    './js/api.js',
    './js/booking.js',
    './js/reports.js',
    './js/ui.js',
    './js/views.js',
    './js/app.js',
    './manifest.json',
    './favicon.ico',
    './icon-192.png',
    './icon-512.png'
];

// Instalação do Service Worker e Cache inicial
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[Service Worker] Caching app shell');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting(); // Força a ativação imediata
});

// Ativação e Limpeza de caches antigos
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(keyList.map(key => {
                if (key !== CACHE_NAME) {
                    console.log('[Service Worker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim(); // Assume o controle das abas abertas imediatamente
});

// Estratégia Network-First (Melhor para apps realtime)
// Tenta buscar a versão mais nova na rede; se falhar (offline), usa o cache.
self.addEventListener('fetch', event => {
    // Ignorar requisições para o Supabase (API real-time e dados dinâmicos)
    if (event.request.url.includes('supabase.co')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(networkResponse => {
                // Se a rede respondeu, atualiza o cache e retorna a resposta
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            })
            .catch(() => {
                // Se a rede falhar (offline), tenta buscar no cache
                return caches.match(event.request);
            })
    );
});

// ─────────────────────────────────────────────────────────────────
// 🔔 PUSH NOTIFICATIONS — Funciona com app fechado (requer HTTPS)
// ─────────────────────────────────────────────────────────────────

// Recebe notificações push do servidor (Supabase Edge Function)
self.addEventListener('push', event => {
    let data = { title: '🔔 Novo Agendamento!', body: 'Um cliente acabou de agendar.' };

    try {
        if (event.data) {
            data = event.data.json();
        }
    } catch(e) {}

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: './icon-192.png',
            badge: './icon-192.png',
            tag: 'novo-agendamento',
            renotify: true,
            vibrate: [200, 100, 200, 100, 200], // Padrão de vibração mais longo
            data: { url: self.location.origin }
        })
    );
});

// Ao clicar na notificação — abre/foca o app na aba de agendamentos
self.addEventListener('notificationclick', event => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            // Se o app já estiver aberto, apenas foca nele
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Se não estiver aberto, abre uma nova janela
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data?.url || '/');
            }
        })
    );
});
