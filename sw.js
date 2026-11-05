const VERSION = '1.2.1';
const NOTES = "1.2.1 测试版：重写神经专题工具介绍，补充11个项目的文献背景、基础概念、阅读提示与原文页码；保留查体步骤、分类规则及中英对照图表。";
// Scope-specific prefix prevents deleting caches owned by other apps on this origin.
const PREFIX = `anesthesia:${self.registration.scope}:`;
const CACHE = `${PREFIX}${VERSION}`;
const ASSETS = ['./','./index.html','./releases/1.2.1/app.js','./releases/1.2.1/formulas.js','./releases/1.2.1/styles.css','./releases/1.2.1/glucose.js','./releases/1.2.1/figures.js','./releases/1.2.1/figure-data-a.js','./releases/1.2.1/figure-data-b.js','./releases/1.2.1/neuro.js','./releases/1.2.1/neuro-data.js','./releases/1.2.1/neuro-background.js','./releases/1.2.1/neuro-figures.js','./releases/1.2.1/neuro.css','./releases/1.2.1/neuro-payload-1.js','./releases/1.2.1/neuro-payload-2.js','./releases/1.2.1/neuro-payload-3.js','./releases/1.2.1/neuro-payload-4.js','./releases/1.2.1/neuro-payload-5.js','./releases/1.2.1/neuro-payload-6.js','./releases/1.2.1/neuro-payload-7.js','./releases/1.2.1/neuro-payload-8.js','./manifest.webmanifest','./icons/icon.svg','./icons/icon-192.png','./icons/icon-512.png'];
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
