const CACHE_NAME = "postgram-pwa-v1";
const DYNAMIC_CACHE_NAME = "postgram-dynamic-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.json",
];

const MAX_CACHE_SIZE = 50;

// Cache size limit function
const limitCacheSize = (name, size) => {
  caches.open(name).then((cache) => {
    cache.keys().then((keys) => {
      if (keys.length > size) {
        cache.delete(keys[0]).then(() => limitCacheSize(name, size));
      }
    });
  });
};

// Install event - Cache static assets
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Caching static assets");
        return cache.addAll(STATIC_ASSETS.map((url) => new Request(url, { cache: "reload" })));
      })
      .catch((err) => {
        console.error("[Service Worker] Cache install error:", err);
      })
  );
  self.skipWaiting(); // Activate immediately
});

// Activate event - Clean old caches
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...");
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME && key !== DYNAMIC_CACHE_NAME)
            .map((key) => {
              console.log("[Service Worker] Deleting old cache:", key);
              return caches.delete(key);
            })
        );
      })
      .then(() => {
        console.log("[Service Worker] Activated");
        return self.clients.claim(); // Take control of all pages
      })
  );
});

// Fetch event - Network first, cache fallback strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip unsupported schemes (chrome-extension, moz-extension, chrome://, about://, etc.)
  const unsupportedSchemes = [
    "chrome-extension:",
    "moz-extension:",
    "safari-extension:",
    "chrome:",
    "about:",
    "data:",
    "blob:",
    "file:",
  ];
  
  if (unsupportedSchemes.some((scheme) => request.url.startsWith(scheme))) {
    event.respondWith(fetch(request));
    return;
  }

  // Only cache http/https requests
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    event.respondWith(fetch(request));
    return;
  }

  // Skip Firebase storage and external APIs (don't cache)
  if (
    url.hostname.includes("firebasestorage.googleapis.com") ||
    url.hostname.includes("firestore.googleapis.com") ||
    url.hostname.includes("googleapis.com")
  ) {
    event.respondWith(fetch(request));
    return;
  }

  // Network first strategy for API calls
  if (url.pathname.includes("/api/") || url.hostname !== self.location.hostname) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses (only http/https)
          if (response && response.status === 200 && response.type === "basic") {
            try {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
                cache.put(request, responseClone).catch((err) => {
                  console.warn("[Service Worker] Failed to cache response:", err);
                });
                limitCacheSize(DYNAMIC_CACHE_NAME, MAX_CACHE_SIZE);
              });
            } catch (error) {
              console.warn("[Service Worker] Error caching response:", error);
            }
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // Cache first strategy for static assets
  event.respondWith(
    caches
      .match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== "basic") {
              return response;
            }

            // Cache the response (with error handling)
            try {
              const responseToCache = response.clone();
              caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache).catch((err) => {
                  console.warn("[Service Worker] Failed to cache response:", err);
                });
                limitCacheSize(DYNAMIC_CACHE_NAME, MAX_CACHE_SIZE);
              });
            } catch (error) {
              console.warn("[Service Worker] Error caching response:", error);
            }

            return response;
          })
          .catch(() => {
            // If it's a navigation request and we're offline, show offline page
            if (request.mode === "navigate") {
              return caches.match("/offline.html");
            }
            // For other requests, return a basic response
            return new Response("Offline - Content not available", {
              status: 503,
              statusText: "Service Unavailable",
            });
          });
      })
  );
});

// Background sync for offline contacts
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-contacts") {
    console.log("[Service Worker] Background sync triggered");
    event.waitUntil(
      // Sync will be handled by the app when it comes online
      Promise.resolve()
    );
  }
});

// Message event - Handle messages from the app
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
