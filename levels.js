const TIPE_MUSUH = {
  biasa: { kunci: "musuh", r: 24, skala: 1, hpKali: 1, kecepatanKali: 1, warna: "#ff4d4d" },
  cepet: { kunci: "cepet", r: 18, skala: 0.75, hpKali: 0.6, kecepatanKali: 1.45, warna: "#4dc3ff" },
  tank: { kunci: "tank", r: 32, skala: 1.33, hpKali: 2.2, kecepatanKali: 0.6, warna: "#b26bff" },

  jamur: { kunci: "jamur", r: 22, skala: 1, hpKali: 1.3, kecepatanKali: 0.5, warna: "#86efac" },

  serigala: { kunci: "serigala", r: 28, skala: 1.35, hpKali: 1.2, kecepatanKali: 1.55, warna: "#aab3bc" },

  semak: { kunci: "semak", r: 34, skala: 1.45, hpKali: 2.4, kecepatanKali: 0.5, warna: "#3ea05f" },

  bos: { kunci: "bos", r: 72, skala: 2.4, hpKali: 12, kecepatanKali: 0.35, warna: "#14532d" }
};

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

  { jumlah: 6, hp: 80, kecepatan: [120, 200], campur: { biasa: 0.7, cepet: 0.2, tank: 0.05, jamur: 0.05 }, jedaSpawn: 1.3 },
  { jumlah: 8, hp: 95, kecepatan: [130, 210], campur: { biasa: 0.6, cepet: 0.2, tank: 0.08, jamur: 0.12 }, jedaSpawn: 1.2 },
  { jumlah: 10, hp: 110, kecepatan: [140, 220], campur: { biasa: 0.55, cepet: 0.22, tank: 0.08, jamur: 0.1, serigala: 0.05 }, jedaSpawn: 1.1 },
  { jumlah: 12, hp: 125, kecepatan: [145, 225], campur: { biasa: 0.5, cepet: 0.24, tank: 0.1, jamur: 0.1, serigala: 0.06 }, jedaSpawn: 1.0 },

  { jumlah: 14, hp: 150, kecepatan: [145, 235], campur: { jamur: 0.46, serigala: 0.4, semak: 0.14 }, jedaSpawn: 0.95 },
  { jumlah: 16, hp: 170, kecepatan: [150, 245], campur: { jamur: 0.44, serigala: 0.42, semak: 0.14 }, jedaSpawn: 0.9 },
  { jumlah: 18, hp: 190, kecepatan: [155, 250], campur: { jamur: 0.42, serigala: 0.44, semak: 0.14 }, jedaSpawn: 0.85 },
  { jumlah: 20, hp: 210, kecepatan: [160, 260], campur: { jamur: 0.4, serigala: 0.45, semak: 0.15 }, jedaSpawn: 0.8 },
  { jumlah: 22, hp: 230, kecepatan: [165, 270], campur: { jamur: 0.39, serigala: 0.46, semak: 0.15 }, jedaSpawn: 0.75 },
  { jumlah: 24, hp: 250, kecepatan: [170, 290], campur: { jamur: 0.37, serigala: 0.47, semak: 0.16 }, jedaSpawn: 0.7 },

  { jumlah: 6, hp: 90, kecepatan: [130, 210], campur: { biasa: 0.7, cepet: 0.2, tank: 0.05, jamur: 0.05 }, jedaSpawn: 1.3 },
  { jumlah: 8, hp: 105, kecepatan: [140, 220], campur: { biasa: 0.6, cepet: 0.2, tank: 0.08, jamur: 0.12 }, jedaSpawn: 1.2 },
  { jumlah: 10, hp: 120, kecepatan: [150, 230], campur: { biasa: 0.55, cepet: 0.22, tank: 0.08, jamur: 0.1, serigala: 0.05 }, jedaSpawn: 1.1 },
  { jumlah: 12, hp: 140, kecepatan: [155, 235], campur: { biasa: 0.5, cepet: 0.24, tank: 0.1, jamur: 0.1, serigala: 0.06 }, jedaSpawn: 1.0 },
  { jumlah: 14, hp: 165, kecepatan: [155, 245], campur: { jamur: 0.46, serigala: 0.4, semak: 0.14 }, jedaSpawn: 0.95 },
  { jumlah: 16, hp: 185, kecepatan: [160, 255], campur: { jamur: 0.44, serigala: 0.42, semak: 0.14 }, jedaSpawn: 0.9 },
  { jumlah: 18, hp: 210, kecepatan: [165, 260], campur: { jamur: 0.42, serigala: 0.44, semak: 0.14 }, jedaSpawn: 0.85 },
  { jumlah: 20, hp: 230, kecepatan: [170, 270], campur: { jamur: 0.4, serigala: 0.45, semak: 0.15 }, jedaSpawn: 0.8 },
  { jumlah: 22, hp: 255, kecepatan: [175, 280], campur: { jamur: 0.39, serigala: 0.46, semak: 0.15 }, jedaSpawn: 0.75 },

  { jumlah: 1, hp: 300, kecepatan: [170, 290], campur: { bos: 1 }, jedaSpawn: 1.2, bos: "raja-slime" }
];

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

const MAX_SERIGALA = 6;

function pilihTipeTanpaSerigala(campur) {
  let total = 0;
  const bersih = {};
  for (const k in campur) {
    if (k !== "serigala") { bersih[k] = campur[k]; total += campur[k]; }
  }
  if (total <= 0) return "biasa";
  let r = Math.random() * total;
  for (const k in bersih) {
    r -= bersih[k];
    if (r <= 0) return k;
  }
  return "biasa";
}

const DAFTAR_LEVEL = [
  {
    kunci: "lvl1",
    nama: "Level 1",
    judul: "Padang Terbuka",
    deskripsi: "Mulai petualanganmu di padang rumput.",
    mulaiWave: 0,
    selesaiWave: 10,
    warna: "#4ade80"
  },
  {
    kunci: "lvl2",
    nama: "Level 2",
    judul: "Hutan Ajaib",
    deskripsi: "Monster hutan mulai muncul.",
    mulaiWave: 10,
    selesaiWave: 20,
    warna: "#a3e635"
  },
  {
    kunci: "lvl3",
    nama: "Level 3",
    judul: "Rawa Gulita",
    deskripsi: "Slime raksasa hijau tua menjaga rawa.",
    mulaiWave: 20,
    selesaiWave: 30,
    warna: "#16a34a"
  }
];

let levelPilihan = 0;

let level = 0;
let levelSpawn = 0;
let levelBanner = null;

function waveMulaiLevel()   { const l = DAFTAR_LEVEL[levelPilihan] || {}; return l.mulaiWave || 0; }
function waveSelesaiLevel() { const l = DAFTAR_LEVEL[levelPilihan] || {}; return l.selesaiWave || LEVELS.length; }
function totalWaveLevel()   { return Math.max(1, waveSelesaiLevel() - waveMulaiLevel()); }

function mutarBanner(teks, durasi, boss, sub) {
  levelBanner = { teks: teks, sub: sub || "", t: 0, life: durasi, boss: boss === true };
}

function tampilkanBannerLevel(lv) {
  const lvlDef = LEVELS[lv];
  const label = "WAVES " + (lv - waveMulaiLevel() + 1) + "/" + totalWaveLevel();
  if (lvlDef && lvlDef.bos) {
    mutarBanner("BOSS DATANG!", 2.4, true, label);
  } else {
    mutarBanner(label, 1.6);
  }
}

function levelSelesai() {
  koin += 50 + level * 10;
  player.hp = Math.min(player.maxHp, player.hp + 30);

  if (player.kartu && player.kartu.darahKetiga) {
    player.hp = Math.min(player.maxHp, player.hp + 15 * player.kartu.darahKetiga);
  }
  spawnParticles(player.x, player.y, "#ffd23f", 24);

  if (level + 1 >= waveSelesaiLevel()) {
    koin += 100;
    sfxMenang();
    tampilkanMenang();
    return;
  }

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
