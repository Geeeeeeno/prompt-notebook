/* Service Worker — アプリは cache-first、広告と ads.txt はネットワーク */
const CACHE_VERSION = 'prompt-notebook-v5';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './privacy.html',
  './operator.html',
  './contact.html',
  './js/app.js',
  './js/db.js',
  './js/logic.js',
  './js/tags.js',
  './js/icons.js',
  './js/sound.js',
  './js/bg.js',
  './js/ads-config.js',
  './js/ads.js',
  './icons/logo.svg',
  './icons/icon.svg',
  './icons/icon-maskable.svg',
  './icons/favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

const NETWORK_FIRST_PAGES = ['/privacy.html', '/operator.html', '/contact.html'];

function isAdNetworkRequest(url) {
  const host = url.hostname.toLowerCase();
  return (
    host === 'googlesyndication.com' ||
    host.endsWith('.googlesyndication.com') ||
    host.includes('googleads') ||
    host.includes('doubleclick')
  );
}

function isAdsTxt(url) {
  return url.pathname.endsWith('/ads.txt');
}

function isNetworkFirstPage(url) {
  return NETWORK_FIRST_PAGES.some((suffix) => url.pathname.endsWith(suffix));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  /* 広告配信はキャッシュせず、ブラウザの通常取得に任せる */
  if (isAdNetworkRequest(url)) return;

  /* install 中の precache など、SW 自身の取得は素通し */
  if (!event.clientId && !event.resultingClientId) return;

  if (url.origin !== self.location.origin) return;

  if (isAdsTxt(url)) {
    event.respondWith(networkOnly(request));
    return;
  }

  if (isNetworkFirstPage(url)) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

function networkOnly(request) {
  return fetch(request, { cache: 'no-store' }).catch(
    () =>
      new Response('ads.txt unavailable\n', {
        status: 504,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      }),
  );
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    return new Response('このページはオフラインでは開けません。\n', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request, { ignoreSearch: true });
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);
  return cached || network;
}
