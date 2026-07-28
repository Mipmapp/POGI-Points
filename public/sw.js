// SSAAM Service Worker
// Strategy:
//  - HTML navigation  → network-first  (always pull latest when online)
//  - Hashed JS/CSS    → cache-first    (Vite gives them unique filenames; safe to cache forever)
//  - Images / fonts   → stale-while-revalidate
//  - /apis/* & /api/* → network-only   (never cache API calls)
//
// Auto-update: when a new SW installs it calls skipWaiting() immediately so
// the waiting SW takes over right away. The client detects the controller
// change and reloads once to serve the fresh shell.

const CACHE_NAME = 'ssaam-v1';

// App-shell files to pre-cache on install (static public assets)
const PRECACHE_URLS = [
  '/',
  '/ccs.png',
  '/ccs-logo.png',
  '/manifest.json',
];

// ─── Install ────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  // Take over immediately — don't wait for old tabs to close
  self.skipWaiting();
});

// ─── Activate ───────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  // Claim all open clients so they immediately use this SW
  self.clients.claim();
});

// ─── Fetch ──────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Never cache API calls — always go to network
  if (url.pathname.startsWith('/apis/') || url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Hashed assets (Vite output: /assets/xxx-[hash].js, /assets/xxx-[hash].css)
  // These are immutable → cache-first
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML navigation → network-first so new deployments are always fetched
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Everything else (images, icons, fonts) → stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// ─── Strategies ─────────────────────────────────────────────────────────────

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await caches.match(request);
    return cached || caches.match('/');
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) cache.put(request, networkResponse.clone());
    return networkResponse;
  }).catch(() => null);
  return cached || await fetchPromise || new Response('Offline', { status: 503 });
}
