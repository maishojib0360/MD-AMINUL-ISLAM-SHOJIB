// Minimal Service Worker to enable Chrome and Mobile installation (PWA)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through strategy to allow direct network access while satisfying Chrome's PWA install criteria
  event.respondWith(fetch(event.request));
});
