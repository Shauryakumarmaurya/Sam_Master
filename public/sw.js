// Basic Service Worker for PWA installability

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let the browser do its default thing for all requests.
  // We just need a fetch listener to satisfy the PWA requirements.
});
