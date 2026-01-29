const CACHE = 'inv-ayisha-ashfack-v3';
self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/', '/static/css/style.css', '/static/js/app.js', '/static/js/storage.js'])));
});
self.addEventListener('fetch', e => {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});