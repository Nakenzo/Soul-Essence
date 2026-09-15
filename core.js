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
let player, bullets, enemies, particles, rings, slashes;
let score, gameOver, lastTime, spawnTimer, shake;
let errorBanner = null;

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
    specialMax: 3,
    dir: -1
  };
  bullets = [];
  enemies = [];
  particles = [];
  rings = [];
  slashes = [];
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