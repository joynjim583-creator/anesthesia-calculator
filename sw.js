const VERSION = '1.3.0';
const NOTES = "1.3.0 测试版：新增非心脏手术围术期心血管管理专题；按情景与章节查阅，保留推荐强度、适用条件，提供6幅流程与15张表的中文整理及原文离线对照。";
// Scope-specific prefix prevents deleting caches owned by other apps on this origin.
const PREFIX = `anesthesia:${self.registration.scope}:`;
const CACHE = `${PREFIX}${VERSION}`;
const ASSETS = ['./','./index.html','./releases/1.3.0/app.js','./releases/1.3.0/cardio-data.js','./releases/1.3.0/cardio-flows.js','./releases/1.3.0/cardio-images.js','./releases/1.3.0/cardio-original.js','./releases/1.3.0/cardio-payload-1.js','./releases/1.3.0/cardio-payload-10.js','./releases/1.3.0/cardio-payload-11.js','./releases/1.3.0/cardio-payload-12.js','./releases/1.3.0/cardio-payload-2.js','./releases/1.3.0/cardio-payload-3.js','./releases/1.3.0/cardio-payload-4.js','./releases/1.3.0/cardio-payload-5.js','./releases/1.3.0/cardio-payload-6.js','./releases/1.3.0/cardio-payload-7.js','./releases/1.3.0/cardio-payload-8.js','./releases/1.3.0/cardio-payload-9.js','./releases/1.3.0/cardio-tables.js','./releases/1.3.0/cardio.css','./releases/1.3.0/cardio.js','./releases/1.3.0/figure-data-a.js','./releases/1.3.0/figure-data-b.js','./releases/1.3.0/figures.js','./releases/1.3.0/formulas.js','./releases/1.3.0/glucose.js','./releases/1.3.0/neuro-background.js','./releases/1.3.0/neuro-data.js','./releases/1.3.0/neuro-figures.js','./releases/1.3.0/neuro-payload-1.js','./releases/1.3.0/neuro-payload-2.js','./releases/1.3.0/neuro-payload-3.js','./releases/1.3.0/neuro-payload-4.js','./releases/1.3.0/neuro-payload-5.js','./releases/1.3.0/neuro-payload-6.js','./releases/1.3.0/neuro-payload-7.js','./releases/1.3.0/neuro-payload-8.js','./releases/1.3.0/neuro.css','./releases/1.3.0/neuro.js','./releases/1.3.0/styles.css','./manifest.webmanifest','./icons/icon.svg','./icons/icon-192.png','./icons/icon-512.png'];
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
