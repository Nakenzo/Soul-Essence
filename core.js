// ============================================================
// CORE - variabel global, canvas, utilitas dasar.
// Dimuat paling pertama.
// ============================================================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;

// ---------- State ----------
// statusGame: "title" (judul) | "select" (pilih karakter) | "main" (bermain) | "over" (game over)
let karakter = null;
let statusGame = "title";
let pernahMain = false;
let player, bullets, enemies, particles, rings, slashes, damages, souls;
let flashes, hurtVig;
let score, gameOver, lastTime, spawnTimer, shake;
let errorBanner = null;

// Sistem ultimate: musuh menjatuhkan jiwa (partikel hijau) yang diserap
// untuk mengisi SOUL METER. Penebusan dengan tombol R (lihat skills.js).
const SOUL_MAX = 50;
const DROP_SOUL = { biasa: 3, cepet: 2, tank: 5 };

// Durasi charge tiap panah raksasa ultimate Kenzro (detik).
const ULT_CHARGE = 0.8;

// Sistem dash/menghindar (klik kanan).
const DASH_CD = 2; // cooldown per charge (detik)
const DASH_WAKTU = 0.18; // lama dash
const DASH_SPEED = 620; // kecepatan dash
const DASH_INVULN = 0.3; // kebal sejenak setelah dash

// ---------- Setup arena ----------
function resetArena({ skorBaru }) {
  player = {
    x: W / 2,
    y: H / 2,
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
    dir: -1
  };
  bullets = [];
  enemies = [];
  particles = [];
  rings = [];
  slashes = [];
  damages = [];
  souls = [];
  flashes = [];
  hurtVig = 0;
  soul = 0;
  // Level baru selalu mulai dari LEVEL 1.
  level = 0;
  levelSpawn = 0;
  spawnTimer = 0.8;
  tampilkanBannerLevel(0);
  if (skorBaru) {
    score = 0;
  }
  gameOver = false;
  spawnTimer = 0;
  shake = 0;
  lastTime = performance.now();
}

// ---------- Background partikel dekoratif (layar judul/pilih) ----------
let bgPartikels = [];

function buatBgPartikel() {
  bgPartikels = [];
  for (let i = 0; i < 45; i++) {
    bgPartikels.push({
      x: Math.random() * W,
      y: Math.random() * H,
      size: 1 + Math.random() * 2,
      speed: 8 + Math.random() * 18,
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
    const speed = 40 + Math.random() * 120;
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.4 + Math.random() * 0.3,
      t: 0,
      size: 2 + Math.random() * 3,
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