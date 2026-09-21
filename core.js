// ============================================================
// CORE - variabel global, canvas, utilitas dasar.
// Dimuat paling pertama.
// ============================================================

const W = 1280;
const H = 960;
// Dunia / battlefield sebenarnya: lebih luas dari layar (W×H adalah area
// TAMPILAN/HUD). Kamera mengikuti pemain — khas arena seperti Guardian
// Tales / Pokemon: pemain bebas roaming, layar ikut bergeser.
const WORLD_W = 2560;
const WORLD_H = 1920;
const canvas = document.getElementById("game");
let ctx = canvas.getContext("2d");

// Posisi kamera (pojok kiri-atas dunia yang terlihat di layar). Di-set
// tiap frame oleh hitungKamera() (draw.js) dan dipakai input untuk
// mengubah koordinat layar → dunia.
let kam = { x: 0, y: 0 };

// Geser kamera mengikuti pemain, dijepit ke batas dunia agar tidak keluar.
function hitungKamera() {
  const px = player ? player.x : WORLD_W / 2;
  const py = player ? player.y : WORLD_H / 2;
  const cx = WORLD_W > W ? Math.max(0, Math.min(WORLD_W - W, px - W / 2)) : Math.max(0, (W - WORLD_W) / 2);
  const cy = WORLD_H > H ? Math.max(0, Math.min(WORLD_H - H, py - H / 2)) : Math.max(0, (H - WORLD_H) / 2);
  kam.x = cx;
  kam.y = cy;
}

// ---------- State ----------
// statusGame: "title" (judul) | "select" (pilih karakter) | "main" (bermain)
//             | "upgrade" (pilih kartu antar gelombang) | "pause" | "over" (game over)
let karakter = null;
let statusGame = "title";
// Perangkat pemain: "desktop" (keyboard + mouse) atau "mobile" (layar sentuh).
// Dipilih di layar awal sebelum masuk menu utama.
// Perangkat yang dipakai (desktop/mobile); dibaca dari simpanan agar sejak
// awal (mis. skala bake latar) sudah tahu target perangkat.
let deviceTerpilih = (() => {
  try { return localStorage.getItem("soul-essence-device"); } catch (err) { return null; }
})();
let player, bullets, enemies, particles, rings, slashes, damages, souls;
let fires, freezes;
let flashes, hurtVig;
let deathPixels = [];
let score, gameOver, lastTime, spawnTimer, shake;
let errorBanner = null;

// Sistem ultimate: musuh menjatuhkan jiwa (partikel hijau) yang diserap
// untuk mengisi SOUL METER. Penebusan dengan tombol R (lihat skills.js).
const SOUL_MAX = 50;
const DROP_SOUL = { biasa: 3, cepet: 2, tank: 5 };

// Durasi charge tiap panah raksasa ultimate Kenzro (detik).
const ULT_CHARGE = 0.8;

// Kobaran api pasif ultimate Vender: bertahan selama sisa suara api (8 detik)
// dan membakar musuh yang menyentuhnya (burn sama seperti skill Vender).
const API_ULTI_LIFE = 8;

// Zona bekupasif ultimate Kenzro: area lurus yang membekukan musuh
// selama zona masih ada (6 detik).
const BEKU_ZONE_LIFE = 6;

// Sistem dash/menghindar (klik kanan).
const DASH_CD = 2; // cooldown per charge (detik)
const DASH_WAKTU = 0.18; // lama dash
// World 1280x960: kecepatan px/detik digandakan agar terasa sama.
const DASH_SPEED = 1240; // kecepatan dash
const DASH_INVULN = 0.3; // kebal sejenak setelah dash

// Radius hitbox pemain (dunia). Dipakai untuk tabrakan DAN ukuran render sprite.
const P_RADIUS = 14;

// ---------- Setup arena ----------
function resetArena({ skorBaru }) {
  player = {
    x: WORLD_W / 2,
    y: WORLD_H / 2,
    r: P_RADIUS,
    hp: karakter ? karakter.hp : 100,
    maxHp: karakter ? karakter.hp : 100,
    speed: karakter ? karakter.kecepatan : 180,
    attackCd: 0,
    specialCd: 0,
    specialMax: karakter ? karakter.specialCd : 3,
    specialBuff: 0,
    // Ultimate panah raksasa (Kenzro).
    ultBuff: false,
    ultArrows: 0,
    ultCd: 0,
    // Dash/menghindar (klik kanan). Kenzro punya 2 charge, Vender 1.
    dashMax: karakter && karakter.tipe === "jarak" ? 2 : 1,
    dashStacks: karakter && karakter.tipe === "jarak" ? 2 : 1,
    dashTimers: [],
    dashCd: 0,
    dashT: 0,
    dashAngle: 0,
    invuln: 0,
    hitFlash: 0,
    attackAnimT: 0,
    dir: -1
  };
  // Kartu upgrade (banyak gelombang): semua bonus di-reset tiap game baru.
  player.kartu = {};                       // { idKartu: berapaKaliDiambil }
  if (typeof perbaruiNotaKartu === "function") perbaruiNotaKartu();
  player.mult = { speed: 1, damage: 1, atk: 1, reach: 1, halfA: 1, bSpeed: 1, special: 1, status: 1, hpA: 0, regen: 0, jiwa: 1, dash: 0, crit: 0, armor: 0 };
  player.base = {
    speed: karakter ? karakter.kecepatan : 180,
    damage: karakter ? karakter.damage : 25,
    attackRate: karakter ? karakter.attackRate : 0.18,
    reach: karakter ? karakter.reach : 0,
    halfArc: karakter ? karakter.halfArc : 0,
    swingDuration: karakter ? karakter.swingDuration : 0.2,
    buffDurasi: karakter ? karakter.buffDurasi : 5,
    bekuDurasi: karakter ? karakter.bekuDurasi : 1,
    burnDurasi: 3,
    specialMax: karakter ? karakter.specialCd : 3,
    maxHp: karakter ? karakter.hp : 100,
    bulletSpeed: 840,
    dashMax: (karakter && karakter.tipe === "jarak") ? 2 : 1
  };
  if (typeof hitungStatKartu === "function") hitungStatKartu();
  pilihanKartu = null;
  bullets = [];
  enemies = [];
  particles = [];
  rings = [];
  slashes = [];
  fires = [];
  freezes = [];
  damages = [];
  souls = [];
  flashes = [];
  hurtVig = 0;
  deathPixels = [];
  soul = 0;
  // Level baru selalu mulai dari wave awal level yang dipilih.
  level = typeof levelPilihan === "number" ? waveMulaiLevel() : 0;
  levelSpawn = 0;
  tampilkanBannerLevel(level);
  if (skorBaru) {
    score = 0;
  }
  gameOver = false;
  spawnTimer = 0;
  shake = 0;
  lastTime = performance.now();
  // Animasi lingkungan map disetel ulang mengikuti arena yang baru.
  if (typeof ambBuat === "function") ambBuat();
}

// ---------- Background partikel dekoratif (layar judul/pilih) ----------
let bgPartikels = [];

function buatBgPartikel() {
  bgPartikels = [];
  for (let i = 0; i < 45; i++) {
    bgPartikels.push({
      x: Math.random() * W,
      y: Math.random() * H,
      size: 2 + Math.random() * 2,
      speed: 16 + Math.random() * 24,
      alpha: 0.15 + Math.random() * 0.4
    });
  }
}

function updateBgPartikel(dt) {
  for (const p of bgPartikels) {
    p.y -= p.speed * dt;
    if (p.y < -5) {
      p.y = H + 5;
      p.x = Math.random() * W;
    }
  }
}

// ---------- Utilitas ----------
function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

// Jarak titik ke ruas garis (untuk deteksi tabrakan lintasan cepat).
function segDist(sx, sy, ex, ey, px, py) {
  const dx = ex - sx, dy = ey - sy;
  const l2 = dx * dx + dy * dy;
  let t = l2 === 0 ? 0 : ((px - sx) * dx + (py - sy) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  const cx = sx + t * dx, cy = sy + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function spawnParticles(x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 240;
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.4 + Math.random() * 0.3,
      t: 0,
      size: 4 + Math.random() * 6,
      color: color
    });
  }
}

// Teks damage melayang: kuning = damage ke musuh, merah = ke karakter.
function spawnDamage(x, y, teks, warna) {
  damages.push({
    x: x,
    y: y,
    teks: String(teks),
    warna: warna,
    t: 0,
    life: 0.8
  });
}

// Flash layar penuh (efek ledakan ultimate, game over, dll).
function addFlash(warna, alpha, dur) {
  flashes.push({ warna: warna, alpha: alpha, t: 0, life: dur });
}

// ---------- Efek Pixel Disintegration ----------
const _pixelCache = new Map();
function sampePixelDariSprite(img, skala) {
  try {
    if (!img || !img.complete || img.naturalWidth === 0) return [];
    const cacheKey = img.src + "|" + skala.toFixed(1);
    if (_pixelCache.has(cacheKey)) return _pixelCache.get(cacheKey);
    const nw = img.naturalWidth || img.width;
    const nh = img.naturalHeight || img.height;
    if (nw === 0 || nh === 0) return [];
    const tc = document.createElement("canvas");
    tc.width = nw;
    tc.height = nh;
    const tx = tc.getContext("2d");
    if (!tx) return [];
    tx.drawImage(img, 0, 0, nw, nh);
    const data = tx.getImageData(0, 0, nw, nh).data;
    const pixels = [];
    const step = Math.max(1, Math.floor(4 / skala));
    for (let y = 0; y < nh; y += step) {
      for (let x = 0; x < nw; x += step) {
        const i = (y * nw + x) * 4;
        if (data[i + 3] > 80) {
          pixels.push({
            ox: (x - nw / 2) * skala,
            oy: (y - nh / 2) * skala,
            r: data[i], g: data[i + 1], b: data[i + 2]
          });
        }
      }
    }
    if (_pixelCache.size > 200) _pixelCache.clear();
    _pixelCache.set(cacheKey, pixels);
    return pixels;
  } catch (_) {
    return [];
  }
}

function buatDeathPixels(x, y, img, skala) {
  try {
    if (deathPixels.length > 500) return;
    const pixels = sampePixelDariSprite(img, skala);
    const maxPx = Math.min(80, 500 - deathPixels.length);
    if (maxPx <= 0) return;
    const picked = pixels.length > maxPx
      ? pixels.filter((_, i) => i % Math.ceil(pixels.length / maxPx) === 0)
      : pixels;
    for (const px of picked) {
      const ang = Math.atan2(px.oy, px.ox) + (Math.random() - 0.5) * 1.2;
      const sp = 60 + Math.random() * 220;
      deathPixels.push({
        x: x + px.ox,
        y: y + px.oy,
        vx: Math.cos(ang) * sp + (Math.random() - 0.5) * 80,
        vy: Math.sin(ang) * sp - 40 - Math.random() * 100,
        r: px.r, g: px.g, b: px.b,
        size: Math.max(1.5, 2.5 * skala),
        t: 0,
        life: 0.5 + Math.random() * 0.6,
        grav: 120 + Math.random() * 80
      });
    }
  } catch (_) {}
}
