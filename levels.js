// ============================================================
// LEVELS - definisi 10 level, tipe musuh, dan progres level.
// Naik level = habiskan semua musuh pada level yang berjalan.
// ============================================================

// Tipe musuh. Semua memakai sprite musuh.png; bedanya lewat ukuran,
// kecepatan, pengali HP, dan warna aura/HP bar.
// r digandakan mengikuti world 1280x960; skala musuh: 1 (art native 64px).
const TIPE_MUSUH = {
  biasa: { kunci: "musuh", r: 24, skala: 1, hpKali: 1, kecepatanKali: 1, warna: "#ff4d4d" },
  cepet: { kunci: "cepet", r: 18, skala: 0.75, hpKali: 0.6, kecepatanKali: 1.45, warna: "#4dc3ff" },
  tank: { kunci: "tank", r: 32, skala: 1.33, hpKali: 2.2, kecepatanKali: 0.6, warna: "#b26bff" },
  // ===== Monster HUTAN (level 2) =====
  // jamur: penyembur spora — menembak bola racun dari jarak (ability "spora").
  jamur: { kunci: "jamur", r: 22, skala: 1, hpKali: 1.3, kecepatanKali: 0.5, warna: "#86efac" },
  // serigala: cepat & melompat (ability "lunge") — sprint pendek ke pemain.
  serigala: { kunci: "serigala", r: 28, skala: 1.35, hpKali: 1.2, kecepatanKali: 1.55, warna: "#aab3bc" },
  // semak: lambat & tebal + menanam area duri beracun (ability "duri").
  semak: { kunci: "semak", r: 34, skala: 1.45, hpKali: 2.4, kecepatanKali: 0.5, warna: "#3ea05f" }
};

// campur: bobot tiap tipe musuh di level itu (tinggi bobot = makin sering).
// LEVELS 0..9 = Level 1 (Padang Terbuka) — 10 wave.
// LEVELS 10..19 = Level 2 (Hutan) — 10 wave, jejamur/serigala/semak muncul.
const LEVELS = [
  { jumlah: 6, hp: 25, kecepatan: [80, 160], campur: { biasa: 1 }, jedaSpawn: 1.4 },
  { jumlah: 8, hp: 30, kecepatan: [90, 170], campur: { biasa: 0.8, cepet: 0.2 }, jedaSpawn: 1.3 },
  { jumlah: 10, hp: 36, kecepatan: [100, 180], campur: { biasa: 0.7, cepet: 0.25, tank: 0.05 }, jedaSpawn: 1.2 },
  { jumlah: 12, hp: 45, kecepatan: [110, 190], campur: { biasa: 0.65, cepet: 0.25, tank: 0.1 }, jedaSpawn: 1.1 },
  { jumlah: 14, hp: 55, kecepatan: [120, 200], campur: { biasa: 0.6, cepet: 0.25, tank: 0.15 }, jedaSpawn: 1.0 },
  { jumlah: 16, hp: 65, kecepatan: [130, 210], campur: { biasa: 0.55, cepet: 0.28, tank: 0.17 }, jedaSpawn: 0.9 },
  { jumlah: 18, hp: 75, kecepatan: [140, 230], campur: { biasa: 0.5, cepet: 0.3, tank: 0.2 }, jedaSpawn: 0.85 },
  { jumlah: 20, hp: 85, kecepatan: [150, 240], campur: { biasa: 0.45, cepet: 0.3, tank: 0.25 }, jedaSpawn: 0.8 },
  { jumlah: 22, hp: 95, kecepatan: [160, 260], campur: { biasa: 0.4, cepet: 0.32, tank: 0.28 }, jedaSpawn: 0.75 },
  { jumlah: 26, hp: 110, kecepatan: [180, 280], campur: { biasa: 0.35, cepet: 0.35, tank: 0.3 }, jedaSpawn: 0.7 },
  // ---- LEVEL 2: HUTAN ----
// Jumlah musuh mengikuti pola level 1 (6→26), hanya sedikit lebih padat di
// akhir. Kesulitannya dinaikkan lewat jenis monster + hp, bukan jumlah.
  { jumlah: 6, hp: 80, kecepatan: [120, 200], campur: { biasa: 0.7, cepet: 0.2, tank: 0.05, jamur: 0.05 }, jedaSpawn: 1.3 },
  { jumlah: 8, hp: 95, kecepatan: [130, 210], campur: { biasa: 0.6, cepet: 0.2, tank: 0.08, jamur: 0.12 }, jedaSpawn: 1.2 },
  { jumlah: 10, hp: 110, kecepatan: [140, 220], campur: { biasa: 0.55, cepet: 0.22, tank: 0.08, jamur: 0.1, serigala: 0.05 }, jedaSpawn: 1.1 },
  { jumlah: 12, hp: 125, kecepatan: [145, 225], campur: { biasa: 0.5, cepet: 0.24, tank: 0.1, jamur: 0.1, serigala: 0.06 }, jedaSpawn: 1.0 },
  // Wave 5+. Slime lama (biasa/cepet/tank) HILANG — hanya monster hutan.
  { jumlah: 14, hp: 150, kecepatan: [145, 235], campur: { jamur: 0.46, serigala: 0.4, semak: 0.14 }, jedaSpawn: 0.95 },
  { jumlah: 16, hp: 170, kecepatan: [150, 245], campur: { jamur: 0.44, serigala: 0.42, semak: 0.14 }, jedaSpawn: 0.9 },
  { jumlah: 18, hp: 190, kecepatan: [155, 250], campur: { jamur: 0.42, serigala: 0.44, semak: 0.14 }, jedaSpawn: 0.85 },
  { jumlah: 20, hp: 210, kecepatan: [160, 260], campur: { jamur: 0.4, serigala: 0.45, semak: 0.15 }, jedaSpawn: 0.8 },
  { jumlah: 22, hp: 230, kecepatan: [165, 270], campur: { jamur: 0.39, serigala: 0.46, semak: 0.15 }, jedaSpawn: 0.75 },
  { jumlah: 24, hp: 250, kecepatan: [170, 290], campur: { jamur: 0.37, serigala: 0.47, semak: 0.16 }, jedaSpawn: 0.7 }
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

// ============================================================
// DAFTAR LEVEL — menu pemilihan level setelah layar judul.
// Setiap level menentukan LINGKUP waves dari LEVELS (mulai & selesai).
// Level berikutnya nanti bisa punya peta & susunan musuh sendiri.
// ============================================================
const DAFTAR_LEVEL = [
  {
    kunci: "lvl1",
    nama: "Level 1",
    judul: "Padang Terbuka",
    deskripsi: "Mulai petualanganmu di padang rumput.",
    mulaiWave: 0,     // index LEVELS permulaan (0 = wave pertama)
    selesaiWave: 10,  // jumlah wave di level ini (10 = semua LEVELS)
    warna: "#4ade80"
  },
  {
    kunci: "lvl2",
    nama: "Level 2",
    judul: "Hutan Ajaib",
    deskripsi: "Monster hutan mulai muncul.",
    mulaiWave: 10,    // level 2 = wave ke-11 (index 10)
    selesaiWave: 20,  // sampai wave ke-20
    warna: "#a3e635"
  }
];

// Level yang sedang dipilih pemain (index DAFTAR_LEVEL).
let levelPilihan = 0;

// ---------- Progres level ----------
// level: index LEVELS (mulai 0). levelSpawn: jumlah musuh sudah di-spawn.
// levelBanner: tulisan besar transisi antar level.
let level = 0;
let levelSpawn = 0;
let levelBanner = null;

// Batas wave level yang sedang diputar (dari DAFTAR_LEVEL).
function waveMulaiLevel()   { const l = DAFTAR_LEVEL[levelPilihan] || {}; return l.mulaiWave || 0; }
function waveSelesaiLevel() { const l = DAFTAR_LEVEL[levelPilihan] || {}; return l.selesaiWave || LEVELS.length; }
function totalWaveLevel()   { return Math.max(1, waveSelesaiLevel() - waveMulaiLevel()); }

function mutarBanner(teks, durasi) {
  levelBanner = { teks: teks, t: 0, life: durasi };
}

function tampilkanBannerLevel(lv) {
  mutarBanner("WAVES " + (lv - waveMulaiLevel() + 1) + "/" + totalWaveLevel(), 1.6);
}

// Semua musuh level ini habis -> wave berikutnya (atau menang).
function levelSelesai() {
  koin += 50 + level * 10;
  player.hp = Math.min(player.maxHp, player.hp + 30);
  spawnParticles(player.x, player.y, "#ffd23f", 24);

  if (level + 1 >= waveSelesaiLevel()) {
    koin += 100;
    sfxMenang();
    tampilkanMenang();
    return;
  }

  // Selesai wave -> jeda sejenak, pilih 1 dari 3 kartu upgrade.
  // (Kartu TIDAK diberikan saat game baru dimulai / tulisan "WAVES 1".)
  if (typeof mulaiKartuUpgrade === "function") {
    mulaiKartuUpgrade();
    return;
  }

  sfxLevel();
  level += 1;
  levelSpawn = 0;
  spawnTimer = 0.6;
  tampilkanBannerLevel(level);
}