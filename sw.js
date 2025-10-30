const CACHE_NAME = 'budget-book-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  // Since scripts are loaded from a CDN, we can't cache them here easily
  // The browser will cache them based on HTTP headers
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
