const CACHE_NAME = 'inv-app-v9';
const ASSETS = [
    '/',
    '/static/css/style.css',
    '/static/js/app.js',
    '/static/js/storage.js',
    '/static/js/scanner.js',
    'https://unpkg.com/html5-qrcode'
];

self.addEventListener('install', (event) => {
    // Force le SW à devenir actif immédiatement sans attendre la fermeture des onglets
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', (event) => {
    // Nettoie les anciens caches pour libérer de l'espace sur le téléphone
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('Suppression de l\'ancien cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});
self.addEventListener('fetch', e => {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});