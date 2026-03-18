self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Se requiere que responda para que Chrome lo detecte como instalable
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
