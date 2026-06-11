// Service Worker untuk GrowFarm Log PWA
// Fungsi: Cache file supaya app boleh buka offline

const CACHE_NAME = 'growfarm-v1';
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install: cache file yang perlu
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching files');
      return cache.addAll(FILES_TO_CACHE).catch(err => {
        console.log('Some files failed to cache:', err);
      });
    })
  );
  self.skipWaiting(); // Activate immediately
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Claim all clients
});

// Fetch: serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        console.log('Service Worker: Serving from cache', event.request.url);
        return response;
      }

      // Attempt network request
      return fetch(event.request).then((response) => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      }).catch((error) => {
        console.log('Service Worker: Fetch failed', event.request.url, error);
        // Offline fallback - return cached version or offline page
        return caches.match(event.request).catch(() => {
          return new Response('Offline - tidak boleh akses halaman ini offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
          });
        });
      });
    })
  );
});
