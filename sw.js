// Service Worker untuk GrowFarm Log PWA
// Versi: v3 (cache version dinaikkan untuk paksa update)

const CACHE_NAME = 'growfarm-v3';

// Install: skip waiting supaya update terus aktif
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate: padam SEMUA cache lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: hanya cache file dari domain sendiri (same-origin)
// Abaikan chrome-extension, CDN luar, dll — terus pakai network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip kalau bukan GET, atau bukan http/https (cth chrome-extension)
  if (event.request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Hanya cache file dari domain app sendiri
  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin) {
    // Network-first: cuba ambil terbaru dulu, fallback ke cache kalau offline
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, copy).catch(() => {});
            });
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
  // CDN luar (React, Tailwind, XLSX): biar browser handle sendiri, jangan cache
});
