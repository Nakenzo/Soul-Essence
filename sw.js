/* ============================================================
   Service worker - cache aset game supaya bisa main offline.

   CARA KERJA VERSI INI
   ------------------------------------------------------------
   Game ini pakai cache-first: kalau file ada di cache, file itu
   langsung dipakai tanpa cek server. Ini cepat, tapi satu
   akibatnya: kalau nama cache tidak berubah, pemain SELALU
   dilayani file versi lama, padahal file baru sudah terupload.

   Jadi nomornya diambil dari manifest.json -> "build".
   Setiap mau rilis, cukup naikkan angka "build" satu saja.
   Tidak perlu sentuh file ini lagi.

   Contoh: rilis hari ini "build": 2 -> besok "build": 3.
   ============================================================ */

const CACHE_FALLBACK = "soul-essence-v2";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",
  "./core.js",
  "./save.js",
  "./audio.js",
  "./config.js",
  "./karakter.js",
  "./artefak.js",
  "./bosses.js",
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
  "./assets/enemies/musuh.png",
  "./assets/enemies/cepet.png",
  "./assets/enemies/tank.png",
  "./assets/sfx/gameover.mp3",
  "./assets/sfx/menang.mp3",
  "./assets/music/lobby.mp3",
  "./assets/music/game.mp3",
  "./assets/ui/logo-aura.png",
  "./assets/ui/logo-kamu.png",
  "./assets/ui/icon-192.png",
  "./assets/ui/icon-512.png",
  "./assets/ui/icon.png"
];

// Nama cache aktif, diisi saat install.
let CACHE_NAME = CACHE_FALLBACK;
// Kalau manifest.json gagal dibaca, jangan hapus cache apa pun (lebih aman
// daripada mengosongkan cache lalu pemain kehilangan aset offline).
let AMAN_UNTUK_HAPUS = false;

function namaCacheDari(manifest) {
  const b = manifest && manifest.build;
  return "soul-essence-v" + (Number.isFinite(b) ? b : 2);
}

self.addEventListener("install", (e) => {
  e.waitUntil(
    // cache: "reload" = paksa ambil dari jaringan, jangan dari cache browser.
    fetch("./manifest.json", { cache: "reload" })
      .then((r) => (r && r.ok ? r.json() : null))
      .then((manifest) => {
        CACHE_NAME = namaCacheDari(manifest);
        AMAN_UNTUK_HAPUS = true;
        return caches.open(CACHE_NAME);
      })
      .catch(() => caches.open(CACHE_NAME))
      .then((cache) => {
        // Cache per-item, jadi satu file 404 tidak menggagalkan seluruh batch.
        return Promise.all(
          ASSETS_TO_CACHE.map((u) =>
            fetch(u, { cache: "reload" })
              .then((r) => {
                if (r && r.ok) return cache.put(u, r);
                console.warn("Precache gagal (offline?): " + u);
              })
              .catch(() => console.warn("Precache gagal: " + u))
          )
        );
      })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      if (!AMAN_UNTUK_HAPUS) return;
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  // Hanya boleh baca dari cache versi ini, supaya tidak pernah warehouse
  // file basi dari cache lama yang belum terhapus.
  e.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(e.request).then((cachedResponse) => {
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
            cache.put(e.request, networkResponse.clone());
            return networkResponse;
          })
          .catch(() => new Response("Offline", { status: 503 }));
      })
    )
  );
});
