/* 圏外・停電でも開けるようにするための仕組み（サービスワーカー）
   一度スマホで開いておけば、そのあとは電波がなくても表示できます。
   ページを直したときは、下の CACHE の番号を v2, v3 … と増やしてください。 */
const CACHE = 'anpi-v3';
const FILES = [
  './',
  './index.html',
  './config.js',
  './contacts-loader.js',
  './submit.js',
  './contacts.json',
  './manifest.json',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});
