const CACHE_NAME = 'composition-lab-runtime-v29';
const STATIC_SHELL = [
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names => Promise.all(
      names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isNavigation = event.request.mode === 'navigate';
  const isIndex = url.pathname.endsWith('/Composer-Lab/') || url.pathname.endsWith('/Composer-Lab/index.html');

  // Hauptseite niemals aus dem Service-Worker-Cache bedienen.
  // Dadurch sieht die APK nach jedem Neustart den aktuellen veröffentlichten Stand.
  if (isNavigation || isIndex) {
    event.respondWith(
      fetch(new Request(event.request, {cache: 'no-store'}))
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Laufzeit-Dateien bevorzugt aus dem Netz holen; nur offline auf Cache zurückfallen.
  event.respondWith(
    fetch(new Request(event.request, {cache: 'no-store'}))
      .then(response => {
        if (response && response.ok && url.origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
