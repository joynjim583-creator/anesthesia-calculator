const VERSION = '1.3.3';
const NOTES = "1.3.3：精简来源出处展示，图表直接显示并可点击放大，保留原文对照、收藏与离线使用。";
// Scope-specific prefix prevents deleting caches owned by other apps on this origin.
const PREFIX = `anesthesia:${self.registration.scope}:`;
const CACHE = `${PREFIX}${VERSION}`;
const ASSETS = ['./','./index.html','./icons/icon-192.png','./icons/icon-512.png','./icons/icon.svg','./manifest.webmanifest','./releases/1.3.0/styles.css','./releases/1.3.0/neuro.css','./releases/1.3.3/cardio.css','./releases/1.3.2/glucose.css','./releases/1.3.3/presentation.css','./releases/1.3.3/app.js','./releases/1.3.3/presentation.js','./releases/1.3.3/cardio.js','./releases/1.3.1/cardio-translated.js','./releases/1.3.1/cardio-zh-1.js','./releases/1.3.1/cardio-zh-2.js','./releases/1.3.1/cardio-zh-3.js','./releases/1.3.1/cardio-zh-4.js','./releases/1.3.1/cardio-zh-5.js','./releases/1.3.1/cardio-zh-6.js','./releases/1.3.0/cardio-data.js','./releases/1.3.0/cardio-tables.js','./releases/1.3.0/cardio-flows.js','./releases/1.3.0/cardio-images.js','./releases/1.3.0/cardio-payload-1.js','./releases/1.3.0/cardio-payload-2.js','./releases/1.3.0/cardio-payload-3.js','./releases/1.3.0/cardio-payload-4.js','./releases/1.3.0/cardio-payload-5.js','./releases/1.3.0/cardio-payload-6.js','./releases/1.3.0/cardio-payload-7.js','./releases/1.3.0/cardio-payload-8.js','./releases/1.3.0/cardio-payload-9.js','./releases/1.3.0/cardio-payload-10.js','./releases/1.3.0/cardio-payload-11.js','./releases/1.3.0/cardio-payload-12.js','./releases/1.3.0/cardio-original.js','./releases/1.3.3/neuro.js','./releases/1.3.0/neuro-figures.js','./releases/1.3.0/neuro-payload-1.js','./releases/1.3.0/neuro-payload-2.js','./releases/1.3.0/neuro-payload-3.js','./releases/1.3.0/neuro-payload-4.js','./releases/1.3.0/neuro-payload-5.js','./releases/1.3.0/neuro-payload-6.js','./releases/1.3.0/neuro-payload-7.js','./releases/1.3.0/neuro-payload-8.js','./releases/1.3.0/neuro-data.js','./releases/1.3.0/neuro-background.js','./releases/1.3.3/glucose.js','./releases/1.3.2/glucose-data.js','./releases/1.3.2/figures.js','./releases/1.3.2/glucose-images-1.js','./releases/1.3.2/glucose-images-2.js','./releases/1.3.2/glucose-images-3.js','./releases/1.3.2/glucose-images-4.js','./releases/1.3.2/glucose-images-5.js','./releases/1.3.2/glucose-images-6.js','./releases/1.3.2/glucose-images-7.js','./releases/1.3.2/glucose-images-8.js','./releases/1.3.2/glucose-images-9.js','./releases/1.3.2/glucose-images-10.js','./releases/1.3.2/glucose-images-11.js','./releases/1.3.2/glucose-images-12.js','./releases/1.3.2/glucose-images-13.js','./releases/1.3.2/glucose-images-14.js','./releases/1.3.2/glucose-images-15.js','./releases/1.3.2/glucose-images-16.js','./releases/1.3.2/glucose-images-17.js','./releases/1.3.2/glucose-images-18.js','./releases/1.3.2/glucose-images-19.js','./releases/1.3.2/glucose-images-20.js','./releases/1.3.2/glucose-original.js','./releases/1.3.0/formulas.js'];
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
