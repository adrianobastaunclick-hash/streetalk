// STREETALK caches only its public app shell; private requests always use the network.
const CACHE_NAME = 'streetalk-v2-m0';
const ASSETS_TO_CACHE = ['/', '/index.html', '/manifest.json'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('streetalk-') && key !== CACHE_NAME).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin ||
      /^\/(api|socket\.io)(\/|$)/.test(url.pathname)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => {
      if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put('/index.html', copy)));
      }
      return response;
    }).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return await cache.match('/index.html') || Response.error();
    }));
    return;
  }
  if (!ASSETS_TO_CACHE.includes(url.pathname) || url.search) return;
  event.respondWith(caches.open(CACHE_NAME).then(async cache =>
    await cache.match(event.request) || fetch(event.request)
  ));
});
