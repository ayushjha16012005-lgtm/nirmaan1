/* NIRMAAN Service Worker - PWA & WebAPK */
const CACHE_NAME = "nirmaan-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle GET requests
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // NEVER cache or intercept non-same-origin requests (Supabase, Gemini, Map tiles, Google fonts)
  if (url.origin !== self.location.origin) return;

  // NEVER intercept /install/ routes
  if (url.pathname.startsWith("/install")) return;

  // Navigation requests: Network-first, fallback to cached /index.html
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const freshResponse = await fetch(req);
          if (freshResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put("/index.html", freshResponse.clone());
          }
          return freshResponse;
        } catch (err) {
          const cached = await caches.match("/index.html");
          if (cached) return cached;
          throw err;
        }
      })()
    );
    return;
  }

  // Same-origin static assets: /assets/*, /icons/*, /css/*: Stale-while-revalidate
  if (
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/css/")
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(req);

        const fetchPromise = fetch(req)
          .then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(req, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })()
    );
  }
});
