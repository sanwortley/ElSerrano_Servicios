self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Solo interceptar si no es una petición a la API (CORS) y asegurar respuesta válida
  if (event.request.mode === 'navigate' || (event.request.method === 'GET' && !event.request.url.includes('/api/'))) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then(response => {
          return response || new Response("Contenido no disponible (Sin conexión)", {
            status: 503,
            statusText: "Service Unavailable",
            headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
          });
        });
      })
    );
  }
});
