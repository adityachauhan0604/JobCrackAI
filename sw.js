const CACHE_NAME = 'jobcrackai-v1';
const urlsToCache = [
    './index.html', './beginner.html', './intermediate.html', './expert.html'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => response || fetch(event.request))
    );
});
