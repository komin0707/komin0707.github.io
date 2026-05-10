/* global DecompressionStream, Response, URL, caches, clients, fetch, self */

const CACHE_NAME = 'vent-simulator-2d-v1';
const APP_SHELL_URLS = ['/', '/manifest.webmanifest', '/pwa-icon.svg'];
const ASSET_CONTENT_TYPES = {
  css: 'text/css; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  if (isCompressedRuntimeAsset(event.request)) {
    event.respondWith(readCompressedRuntimeAsset(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((response) => {
        if (!response.ok) return response;

        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)));
        return response;
      });
    }),
  );
});

function isCompressedRuntimeAsset(request) {
  const url = new URL(request.url);
  return url.origin === self.location.origin && /^\/assets\/.+\.(?:css|js)$/.test(url.pathname);
}

async function readCompressedRuntimeAsset(request) {
  const url = new URL(request.url);
  const extension = url.pathname.endsWith('.css') ? 'css' : 'js';

  const response = await fetch(`${url.pathname}.gz`, { cache: 'no-store' });
  if (!response.ok || !response.body) return fetch(request);

  const body =
    response.headers.get('Content-Encoding') === 'gzip'
      ? response.body
      : typeof DecompressionStream === 'function'
        ? response.body.pipeThrough(new DecompressionStream('gzip'))
        : null;

  if (!body) return fetch(request);

  return new Response(body, {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': ASSET_CONTENT_TYPES[extension],
    },
  });
}
