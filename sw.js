const CACHE_NAME = "soul-essence-v1";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",
  "./core.js",
  "./save.js",
  "./audio.js",
  "./config.js",
  "./maps.js",
  "./texture.js",
  "./menu.js",
  "./input.js",
  "./levels.js",
  "./upgrades.js",
  "./skills.js",
  "./entities.js",
  "./draw.js",
  "./ambience.js",
  "./main.js",
  "./assets/fonts/ZenDots.woff2",
  "./assets/characters/kenzro.png",
  "./assets/characters/rin.png",
  "./assets/weapons/panah.png",
  "./assets/weapons/pedang.png",
  "./assets/maps/padang.png",
  "./assets/ui/icon-192.png",
  "./assets/ui/icon-512.png",
  "./assets/ui/icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request)
        .then((networkResponse) => {
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== "basic"
          ) {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => cachedResponse);
    })
  );
});
