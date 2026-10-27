// Network-first offline support for the standalone Nature Cards site.
// Bump this key whenever deployable files change. No public window APIs.
const CACHE = 'mysticscards-standalone-v048-20261027-16';
const PRECACHE = [
  './', 'index.html', 'manifest.webmanifest', 'favicon.ico',
  'LICENSE', 'NOTICES.md', 'LEGAL.md',
  'licenses/Inter-OFL.txt', 'licenses/Lora-OFL.txt', 'licenses/astronomy-MIT.txt',
  'assets/favicon.svg', 'assets/apple-touch-icon.png',
  'assets/icon-192.png', 'assets/icon-512.png',
  'assets/icon-512-maskable.png', 'assets/og-image.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE)
    .then(cache => cache.addAll(PRECACHE))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key !== CACHE &&
      (key.startsWith('mysticscards-') || key.startsWith('nature-cards-v048-')))
      .map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  const scope = self.registration.scope;
  const isShell = url.pathname === new URL('./', scope).pathname ||
    url.pathname === new URL('index.html', scope).pathname;
  const cacheKey = isShell ? new URL('index.html', scope).href : url.href;
  const known = isShell || PRECACHE.some(path => new URL(path, scope).href === url.href);
  if (!known) return;
  event.respondWith(fetch(request, { cache: 'no-cache' }).then(response => {
    if (response.ok) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(cacheKey, copy)));
    }
    return response;
  }).catch(() => caches.match(cacheKey).then(cached => cached || Response.error())));
});
