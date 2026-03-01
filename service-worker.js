// service-worker.js
const CACHE_NAME = 'ngozistes-cache-v1';
const OFFLINE_URL = 'offline.html';

// Fichiers à mettre en cache
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/supabase-config.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Installation du service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache ouvert');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activation et nettoyage des anciens caches
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
    })
  );
  self.clients.claim();
});

// Intercepter les requêtes
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes vers des API ou des ressources externes non essentielles
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .catch(() => {
        // Si la requête échoue, essayer de servir depuis le cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // Si la page n'est pas en cache, servir la page hors ligne
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
          });
      })
  );
});