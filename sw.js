const CACHE_NAME = 'finnotrato-v1';
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
});

// Estratégia Stale-While-Revalidate
// Serve do cache primeiro, mas busca versão nova em paralelo
self.addEventListener('fetch', event => {
    // Ignorar requisições para o Supabase (API real-time e dados dinâmicos)
    if (event.request.url.includes('supabase.co')) {
        return;
    }

    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request).then(response => {
                const fetchPromise = fetch(event.request).then(networkResponse => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
                return response || fetchPromise;
            });
        })
    );
});
