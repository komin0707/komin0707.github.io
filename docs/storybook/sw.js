/* global DecompressionStream, Response, URL, caches, clients, fetch, self */

const CACHE_NAME = 'vent-simulator-2d-v1';
const APP_SHELL_URLS = ['/', '/manifest.webmanifest', '/pwa-icon.svg'];
const MEMORY_CACHE_MAX_ENTRIES = 32;
const memoryCache = new Map();
const STRATEGIES = {
  appShell: 'cache-first',
  conditionalRequests: 'origin-managed-etag-last-modified-304',
  rangeRequests: 'origin-managed-byte-range',
  runtimeAssets: 'stale-while-revalidate',
  telemetry: 'network-first',
};
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

  const memoryResponse = readMemoryCache(event.request);
  if (memoryResponse) {
    event.respondWith(Promise.resolve(memoryResponse));
    return;
  }

  if (isCompressedRuntimeAsset(event.request)) {
    event.respondWith(readCompressedRuntimeAsset(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        event.waitUntil(refreshRuntimeCache(event.request));
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        if (!response.ok) return response;

        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)));
        writeMemoryCache(event.request, response.clone());
        return response;
      });
    }),
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag !== 'vent-simulator-background-sync') return;
  event.waitUntil(Promise.resolve());
});

self.addEventListener('backgroundfetchsuccess', (event) => {
  event.waitUntil(Promise.resolve());
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
      Vary: 'Accept-Encoding',
    },
  });
}

function readMemoryCache(request) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/assets/')) return null;
  return memoryCache.get(url.pathname)?.clone() ?? null;
}

function writeMemoryCache(request, response) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/assets/')) return;
  memoryCache.set(url.pathname, response);
  while (memoryCache.size > MEMORY_CACHE_MAX_ENTRIES) {
    const firstKey = memoryCache.keys().next().value;
    memoryCache.delete(firstKey);
  }
}

async function refreshRuntimeCache(request) {
  const response = await fetch(request);
  if (!response.ok) return;
  writeMemoryCache(request, response.clone());
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response);
}

self.__VENT_CACHE_STRATEGIES__ = STRATEGIES;
