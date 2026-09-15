// ============================================================
// LEVELS - definisi 10 level, tipe musuh, dan progres level.
// Naik level = habiskan semua musuh pada level yang berjalan.
// ============================================================

// Tipe musuh. Semua memakai sprite musuh.png; bedanya lewat ukuran,
// kecepatan, pengali HP, dan warna aura/HP bar.
const TIPE_MUSUH = {
  biasa: { kunci: "musuh", r: 12, skala: 1, hpKali: 1, kecepatanKali: 1, warna: "#ff4d4d" },
  cepet: { kunci: "cepet", r: 9, skala: 0.75, hpKali: 0.6, kecepatanKali: 1.45, warna: "#4dc3ff" },
  tank: { kunci: "tank", r: 16, skala: 1.33, hpKali: 2.2, kecepatanKali: 0.6, warna: "#b26bff" }
};

// campur: bobot tiap tipe musuh di level itu (tinggi bobot = makin sering).
const LEVELS = [
  { jumlah: 6, hp: 25, kecepatan: [40, 80], campur: { biasa: 1 }, jedaSpawn: 1.4 },
  { jumlah: 8, hp: 30, kecepatan: [45, 85], campur: { biasa: 0.8, cepet: 0.2 }, jedaSpawn: 1.3 },
  { jumlah: 10, hp: 36, kecepatan: [50, 90], campur: { biasa: 0.7, cepet: 0.25, tank: 0.05 }, jedaSpawn: 1.2 },
  { jumlah: 12, hp: 45, kecepatan: [55, 95], campur: { biasa: 0.65, cepet: 0.25, tank: 0.1 }, jedaSpawn: 1.1 },
  { jumlah: 14, hp: 55, kecepatan: [60, 100], campur: { biasa: 0.6, cepet: 0.25, tank: 0.15 }, jedaSpawn: 1.0 },
  { jumlah: 16, hp: 65, kecepatan: [65, 105], campur: { biasa: 0.55, cepet: 0.28, tank: 0.17 }, jedaSpawn: 0.9 },
  { jumlah: 18, hp: 75, kecepatan: [70, 115], campur: { biasa: 0.5, cepet: 0.3, tank: 0.2 }, jedaSpawn: 0.85 },
  { jumlah: 20, hp: 85, kecepatan: [75, 120], campur: { biasa: 0.45, cepet: 0.3, tank: 0.25 }, jedaSpawn: 0.8 },
  { jumlah: 22, hp: 95, kecepatan: [80, 130], campur: { biasa: 0.4, cepet: 0.32, tank: 0.28 }, jedaSpawn: 0.75 },
  { jumlah: 26, hp: 110, kecepatan: [90, 140], campur: { biasa: 0.35, cepet: 0.35, tank: 0.3 }, jedaSpawn: 0.7 }
];

// Pilih tipe musuh dengan pemberatan campur level.
function pilihTipeMusuh(campur) {
  let total = 0;
  for (const k in campur) total += campur[k];
  let r = Math.random() * total;
  for (const k in campur) {
    r -= campur[k];
    if (r <= 0) return k;
  }
  return "biasa";
}

// ---------- Progres level ----------
// level: index LEVELS (mulai 0). levelSpawn: jumlah musuh sudah di-spawn.
// levelBanner: tulisan besar transisi antar level.
let level = 0;
let levelSpawn = 0;
let levelBanner = null;

function mutarBanner(teks, durasi) {
  levelBanner = { teks: teks, t: 0, life: durasi };
}

function tampilkanBannerLevel(lv) {
  mutarBanner("LEVEL " + (lv + 1), 1.6);
}

// Semua musuh level ini habis -> level berikutnya (atau menang).
function levelSelesai() {
  score += 50 + level * 10;
  player.hp = Math.min(player.maxHp, player.hp + 30);
  spawnParticles(player.x, player.y, "#ffd23f", 24);

  if (level + 1 >= LEVELS.length) {
    score += 100;
    tampilkanMenang();
    return;
  }

  level += 1;
  levelSpawn = 0;
  spawnTimer = 0.6;
  tampilkanBannerLevel(level);
}