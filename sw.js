const VERSION = '1.2.0';
const NOTES = "1.2.0 测试版：新增脊髓损伤神经功能评估专题（ISNCSCI 2026第9版），含16份中文图表、原文对照、10例运动平面讲解及离线查看。";
// Scope-specific prefix prevents deleting caches owned by other apps on this origin.
const PREFIX = `anesthesia:${self.registration.scope}:`;
const CACHE = `${PREFIX}${VERSION}`;
const ASSETS = ['./','./index.html','./releases/1.2.0/app.js','./releases/1.2.0/formulas.js','./releases/1.2.0/styles.css','./releases/1.2.0/glucose.js','./releases/1.2.0/figures.js','./releases/1.2.0/figure-data-a.js','./releases/1.2.0/figure-data-b.js','./releases/1.2.0/neuro.js','./releases/1.2.0/neuro-data.js','./releases/1.2.0/neuro-figures.js','./releases/1.2.0/neuro.css','./releases/1.2.0/neuro-payload-1.js','./releases/1.2.0/neuro-payload-2.js','./releases/1.2.0/neuro-payload-3.js','./releases/1.2.0/neuro-payload-4.js','./releases/1.2.0/neuro-payload-5.js','./releases/1.2.0/neuro-payload-6.js','./releases/1.2.0/neuro-payload-7.js','./releases/1.2.0/neuro-payload-8.js','./manifest.webmanifest','./icons/icon.svg','./icons/icon-192.png','./icons/icon-512.png'];
const assetURLs = ASSETS.map(path => new URL(path, self.registration.scope).href);
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try { await cache.addAll(assetURLs.map(url => new Request(url, { cache: 'reload' }))); }
    catch (error) { await caches.delete(CACHE); throw error; }
    // No skipWaiting: the current version remains active until explicit approval.
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  // Version metadata always comes from the network; never cache parameters or arbitrary requests.
  if (url.pathname.endsWith('/version.json')) return;
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => (await caches.open(CACHE)).match(new URL('./index.html', self.registration.scope).href))());
    return;
  }
  if (assetURLs.includes(url.href)) event.respondWith((async () => (await (await caches.open(CACHE)).match(event.request)) || fetch(event.request))());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE_UPDATE') event.waitUntil(self.skipWaiting());
  if (event.data?.type === 'VERSION') event.ports[0]?.postMessage({ version: VERSION, notes: NOTES });
  if (event.data?.type === 'CACHE_READY') event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const matches = await Promise.all(assetURLs.map(url => cache.match(url)));
    event.ports[0]?.postMessage({ ready: matches.every(Boolean), version: VERSION });
  })());
});
