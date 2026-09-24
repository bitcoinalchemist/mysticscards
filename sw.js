/*
 * sw.js — offline support for mysticscards.space
 * The installed app shell is cache-first; other same-origin requests refresh
 * from the network when available and fall back to the cache offline.
 * PRECACHE lists every deployed file.
 */
// Cache-key bump on every deployed change.
const CACHE = 'mysticscards-429';
const PRECACHE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'LICENSE',
  'NOTICES.md',
  'favicon.ico',
  'css/site.css',
  'js/store.js',
  'js/cardsdata.js',
  'js/relationshipdata.js',
  'js/castfield.js',
  'js/spread-grid.js',
  'js/quadrations.js',
  'js/finder.js',
  'js/olney.js',
  'js/richmonddata.js',
  'js/tzcoords.js',
  'js/lifescript.js',
  'js/in-time.js',
  'js/solar-time.js',
  'js/astronomy.js',
  'js/birthdays.js',
  'js/finder-trays.js',
  'js/planetdata.js',
  'js/site.js',
  'js/stars.js',
  'js/ambient-motion.js',
  'js/stardata.js',
  'assets/favicon.svg',
  'assets/apple-touch-icon.png',
  'assets/card-back-square-mini.webp',
  'assets/card-back-celestial.png',
  'assets/card-back-celestial-main.png',
  'assets/icon-192.png',
  'assets/icon-512.png',
  'assets/icon-512-maskable.png',
  'assets/og-image.png',
  'assets/fonts/inter-400.ttf',
  'assets/fonts/inter-500.ttf',
  'assets/fonts/inter-600.ttf',
  'assets/fonts/lora-400.ttf',
  'assets/fonts/lora-500.ttf',
  'assets/fonts/lora-600.ttf',
  'assets/fonts/lora-700.ttf',
  'assets/fonts/lora-400-italic.ttf',
  'assets/fonts/lora-500-italic.ttf',
  'assets/cards/JC.webp',
  'assets/cards/JD.webp',
  'assets/cards/JH.webp',
  'assets/cards/JOKER.webp',
  'assets/cards/JS.webp',
  'assets/cards/KC.webp',
  'assets/cards/KD.webp',
  'assets/cards/KH.webp',
  'assets/cards/KS.webp',
  'assets/cards/QC.webp',
  'assets/cards/QD.webp',
  'assets/cards/QH.webp',
  'assets/cards/QS.webp'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    if (req.mode === 'navigate') {
      const appRoot = new URL(self.registration.scope);
      const appIndex = new URL('index.html', appRoot);
      if (url.pathname === appRoot.pathname || url.pathname === appIndex.pathname) {
        e.respondWith(
          caches.match('index.html').then((shell) => shell || fetch(req))
        );
        return;
      }
    }

    const bypass = /\.(?:html|css|js)$/.test(url.pathname);
    e.respondWith(
      fetch(req, bypass ? { cache: 'reload' } : {})
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() =>
          caches.match(req, { ignoreSearch: true }).then((hit) => {
            if (hit) return hit;
            return Response.error();
          })
        )
    );
  }
});
