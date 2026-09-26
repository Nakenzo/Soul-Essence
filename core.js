const W = 1280;
const H = 960;

const WORLD_W = 2560;
const WORLD_H = 1920;
const canvas = document.getElementById("game");
let ctx = canvas.getContext("2d");

let kam = { x: 0, y: 0 };

function hitungKamera() {
  const px = player ? player.x : WORLD_W / 2;
  const py = player ? player.y : WORLD_H / 2;
  const cx = WORLD_W > W ? Math.max(0, Math.min(WORLD_W - W, px - W / 2)) : Math.max(0, (W - WORLD_W) / 2);
  const cy = WORLD_H > H ? Math.max(0, Math.min(WORLD_H - H, py - H / 2)) : Math.max(0, (H - WORLD_H) / 2);
  kam.x = cx;
  kam.y = cy;
}

let karakter = null;
let statusGame = "title";

let deviceTerpilih = (() => {
  try { return localStorage.getItem("soul-essence-device"); } catch (err) { return null; }
})();
let player, bullets, enemies, particles, rings, slashes, damages, souls;
let fires, freezes;
let flashes, hurtVig;
let deathPixels = [];
let koin, gameOver, lastTime, spawnTimer, shake;
let errorBanner = null;

let animMati = null;
let zoomKamera = 1;

function aturFilterMati(g) {
  const cvs = document.getElementById("game");
  if (!cvs || !cvs.style) return;
  if (!(g > 0.01)) {
    cvs.style.filter = "";
    return;
  }
  const gg = Math.min(1, g);
  cvs.style.filter =
    "grayscale(" + gg.toFixed(3) +
    ") blur(" + (gg * 2.5).toFixed(2) + "px)" +
    " brightness(" + (1 - gg * 0.25).toFixed(3) + ")";
}

const SOUL_MAX = 50;
const DROP_SOUL = { biasa: 3, cepet: 2, tank: 5, jamur: 4, serigala: 3, semak: 6, bos: 40 };

const ULT_CHARGE = 0.8;

const API_ULTI_LIFE = 8;

const BEKU_ZONE_LIFE = 6;

const DASH_CD = 2;
const DASH_WAKTU = 0.18;

const DASH_SPEED = 1240;
const DASH_INVULN = 0.3;

const P_RADIUS = 14;

let enemyShots = [];
let hazards = [];

function resetArena({ koinBaru }) {

  const bon = karakter && typeof bonusStatKarakter === "function"
    ? bonusStatKarakter(karakter.kunci)
    : { hp: 1, damage: 1, kecepatan: 1 };
  const stHP = karakter ? Math.round(karakter.hp * bon.hp) : 100;
  const stDMG = karakter ? Math.round(karakter.damage * bon.damage) : 25;
  const stSPD = karakter ? Math.round(karakter.kecepatan * bon.kecepatan) : 180;
  player = {
    x: WORLD_W / 2,
    y: WORLD_H / 2,
    r: P_RADIUS,
    hp: stHP,
    maxHp: stHP,
    speed: stSPD,
    attackCd: 0,
    specialCd: 0,
    specialMax: karakter ? karakter.specialCd : 3,
    specialBuff: 0,

    ultBuff: false,
    ultArrows: 0,
    ultCd: 0,

    dashMax: karakter && karakter.tipe === "jarak" ? 2 : 1,
    dashStacks: karakter && karakter.tipe === "jarak" ? 2 : 1,
    dashTimers: [],
    dashCd: 0,
    dashT: 0,
    dashAngle: 0,
    invuln: 0,
    hitFlash: 0,
    attackAnimT: 0,
    dir: -1,
    dirY: 1,
    domVertikal: false
  };

  player.kartu = {};
  if (typeof perbaruiNotaKartu === "function") perbaruiNotaKartu();
  player.mult = { speed: 1, damage: 1, atk: 1, reach: 1, halfA: 1, bSpeed: 1, special: 1, status: 1, hpA: 0, regen: 0, jiwa: 1, dash: 0, crit: 0, armor: 0, koin: 1 };
  player.base = {
    speed: stSPD,
    damage: stDMG,
    attackRate: karakter ? karakter.attackRate : 0.18,
    reach: karakter ? karakter.reach : 0,
    halfArc: karakter ? karakter.halfArc : 0,
    swingDuration: karakter ? karakter.swingDuration : 0.2,
    buffDurasi: karakter ? karakter.buffDurasi : 5,
    bekuDurasi: karakter ? karakter.bekuDurasi : 1,
    burnDurasi: 3,
    specialMax: karakter ? karakter.specialCd : 3,
    maxHp: stHP,
    bulletSpeed: 840,
    dashMax: (karakter && karakter.tipe === "jarak") ? 2 : 1
  };
  if (typeof hitungStatKartu === "function") hitungStatKartu();
  pilihanKartu = null;
  bullets = [];
  enemies = [];
  enemyShots = [];
  hazards = [];
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
  bossIntro = null;

  level = typeof levelPilihan === "number" ? waveMulaiLevel() : 0;
  levelSpawn = 0;
  tampilkanBannerLevel(level);
  if (koinBaru) {
    koin = 0;
  }
  gameOver = false;
  spawnTimer = 0;
  shake = 0;

  animMati = null;
  zoomKamera = 1;
  if (typeof aturFilterMati === "function") aturFilterMati(0);
  lastTime = performance.now();

  if (typeof ambBuat === "function") ambBuat();
}

let bgPartikels = [];

function buatBgPartikel() {
  bgPartikels = [];

  for (let i = 0; i < 55; i++) {
    const es = Math.random() < 0.45;
    bgPartikels.push({
      jenis: "titik",
      x: Math.random() * W,
      y: Math.random() * H,
      size: 2 + Math.random() * 2,
      speed: 16 + Math.random() * 28,
      alpha: 0.15 + Math.random() * 0.45,
      warna: es ? "es" : "emas",
      fase: Math.random() * Math.PI * 2
    });
  }

  for (let i = 0; i < 7; i++) {
    bgPartikels.push({
      jenis: "orb",
      x: Math.random() * W,
      y: Math.random() * H,
      size: 5 + Math.random() * 7,
      speed: 6 + Math.random() * 10,
      alpha: 0.2 + Math.random() * 0.25,
      warna: Math.random() < 0.5 ? "es" : "emas",
      fase: Math.random() * Math.PI * 2,
      drift: (Math.random() - 0.5) * 14
    });
  }
}

function updateBgPartikel(dt) {
  const t = performance.now() / 1000;
  for (const p of bgPartikels) {
    p.y -= p.speed * dt;
    if (p.jenis === "orb") {

      p.x += Math.sin(t * 0.7 + p.fase) * p.drift * dt;
      p.alpha = (0.2 + 0.12 * Math.sin(t * 1.4 + p.fase)) *
        (p.warna === "es" ? 1 : 0.9);
    }
    if (p.y < -12) {
      p.y = H + 12;
      p.x = Math.random() * W;
    }
    if (p.x < -20) p.x = W + 10;
    if (p.x > W + 20) p.x = -10;
  }
}

function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

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

function addFlash(warna, alpha, dur) {
  flashes.push({ warna: warna, alpha: alpha, t: 0, life: dur });
}

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
