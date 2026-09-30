function jurusKenzro() {
  player.specialBuff = (player.buffDurasi || karakter.buffDurasi) || 5;
  sfxJurus();
  addFlash("rgba(125, 211, 252, 0.28)", 0.5, 0.35);
  spawnParticles(player.x, player.y, "#7dd3fc", 18);
  rings.push({ x: player.x, y: player.y, r: 20, maxR: 180, life: 0.4, t: 0 });
}

function jurusVender() {
  const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  sfxTebasan();
  addFlash("rgba(255, 110, 20, 0.25)", 0.5, 0.3);
  const ox = player.x + Math.cos(angle) * 70;
  const oy = player.y + Math.sin(angle) * 70;
  slashes.push({
    x: ox,
    y: oy,
    angle: angle,
    reach: 440,
    halfArc: 1.5,
    t: 0,
    life: 0.35,
    hit: new Set(),
    dmg: 75,
    skill: true
  });
  shake = 0.35;
  spawnParticles(ox, oy, "#ff8c3f", 14);
}

const FUNGSI_SKILL = {};

function daftarkanSkill(kunci, slot, fn) {
  FUNGSI_SKILL[kunci + "_" + slot] = fn;
}

function castSpecial() {
  if (gameOver || animMati || karakter === null || statusGame !== "main" || player.specialCd > 0) return;
  player.specialCd = player.specialMax;
  const slot = skillPakai(karakter.kunci);
  const fn = FUNGSI_SKILL[karakter.kunci + "_" + slot];
  if (typeof fn === "function") fn();
  else jurusBawaan();
}

function jurusBawaan() {
  if (karakter.tipe === "dekat") jurusVender();
  else jurusKenzro();
}

function rilisUltimate() {
  if (animMati || gameOver) return;
  if (soul < SOUL_MAX) return;
  soul = 0;
  lancarkanUltimate();
}

function lancarkanUltimate() {
  if (karakter.tipe === "dekat") jurusUltimateVender();
  else jurusUltimateKenzro();
}

function jurusUltimateKenzro() {
  player.ultBuff = true;
  player.ultArrows = 3;
  player.ultCd = 0;
  sfxUltimateKenzro();
  addFlash("rgba(191, 233, 255, 0.55)", 1, 0.45);
  rings.push({ x: player.x, y: player.y, r: 20, maxR: 260, life: 0.45, t: 0 });
  spawnParticles(player.x, player.y, "#7dd3fc", 26);
  shake = 0.4;
}

function jurusUltimateVender() {
  const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  sfxUltimateVender();
  addFlash("rgba(255, 60, 10, 0.6)", 1, 0.5);
  slashes.push({
    x: player.x,
    y: player.y,
    angle: angle,
    reach: 800,
    halfArc: Math.PI,
    t: 0,
    life: 0.6,
    hit: new Set(),
    dmg: 150,
    skill: true,
    burst: true
  });
  shake = 0.7;
  spawnParticles(player.x, player.y, "#ff8c3f", 30);

  const JUMLAH_API = 10;
  for (let i = 0; i < JUMLAH_API; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 140 + Math.random() * 600;
    fires.push({
      x: player.x + Math.cos(a) * r,
      y: player.y + Math.sin(a) * r,
      t: 0,
      life: API_ULTI_LIFE,
      radius: 32 + Math.random() * 14,
      phase: Math.random() * Math.PI * 2,
      spark: Math.random() * 0.1,
      warna: Math.random() < 0.6 ? "#ff8c3f" : "#ffd23f"
    });
  }
}

// SLOT 3, 4, 5 = PLACEHOLDER
// Ganti isi tiap fungsi ini dengan ide skill kamu. Nama skill-nya
// diatur di config.js (atau default "SKILL 3/4/5").
// Fungsi-fungsi ini membaca karakter.tipe sendiri, jadi karakter
// baru otomatis dapat arah & warna yang benar tanpa diedit manual.

function arahMaus() {
  return Math.atan2(mouse.y - player.y, mouse.x - player.x);
}

function warnaJurus() {
  return karakter.tipe === "dekat"
    ? { flash: "rgba(255, 110, 20, 0.28)", partikel: "#ff8c3f" }
    : { flash: "rgba(125, 211, 252, 0.28)", partikel: "#7dd3fc" };
}

function skillUji3() {
  const w = warnaJurus();
  sfxJurus();
  addFlash(w.flash, 0.5, 0.3);
  rings.push({ x: player.x, y: player.y, r: 20, maxR: 200, life: 0.4, t: 0 });
  slashes.push({
    x: player.x, y: player.y, angle: arahMaus(),
    reach: 220, halfArc: Math.PI, t: 0, life: 0.35,
    hit: new Set(), dmg: 55, skill: true
  });
  shake = 0.3;
  spawnParticles(player.x, player.y, w.partikel, 16);
}

function skillUji4() {
  const w = warnaJurus();
  sfxTebasan();
  addFlash(w.flash, 0.4, 0.25);
  const a = arahMaus();
  slashes.push({
    x: player.x + Math.cos(a) * 60, y: player.y + Math.sin(a) * 60, angle: a,
    reach: 520, halfArc: 0.7, t: 0, life: 0.32,
    hit: new Set(), dmg: 90, skill: true
  });
  shake = 0.35;
  spawnParticles(player.x, player.y, w.partikel, 12);
}

function skillUji5() {
  const w = warnaJurus();
  sfxJurus();
  addFlash(w.flash, 0.7, 0.4);
  rings.push({ x: player.x, y: player.y, r: 20, maxR: 300, life: 0.5, t: 0 });
  slashes.push({
    x: player.x, y: player.y, angle: arahMaus(),
    reach: 320, halfArc: Math.PI, t: 0, life: 0.45,
    hit: new Set(), dmg: 130, skill: true, burst: true
  });
  shake = 0.6;
  spawnParticles(player.x, player.y, w.partikel, 26);
}

// ========== SKILL VENDER SLOT 3: INFERNO ==========
// Tebasan pedang yang MELAJU ke titik mouse: hanya tebasan yang melesat
// (badan pemain tetap diam), busur tipis supaya bukan kipas lebar.
function skillVenderInferno() {
  const angle = arahMaus();
  sfxApiLapis("jurus-vender-api");
  addFlash("rgba(255, 110, 20, 0.28)", 0.5, 0.32);
  const ox = player.x + Math.cos(angle) * 26;
  const oy = player.y + Math.sin(angle) * 26;
  slashes.push({
    x: ox,
    y: oy,
    angle: angle,
    reach: 235,
    halfArc: Math.PI / 2,
    t: 0,
    life: 2.6,
    laju: 1150,
    tebal: 1.85,
    gambar: 0.22,
    hantamBarier: true,
    jejak: [],
    hit: new Set(),
    dmg: 120,
    skill: true,
    apiBesar: true
  });
  shake = 0.45;
  spawnParticles(player.x, player.y, "#ff8c3f", 16);
}

// ========== SKILL KENZRO SLOT 3: FROZFALL ==========
// Beberapa panah beku menembak ke atas, lalu pecah jadi 3 anak panah
// per musuh terdekat dan menghujikannya dari atas.
function skillKenzroFrozfall() {
  sfxJurus();
  addFlash("rgba(125, 211, 252, 0.3)", 0.5, 0.32);
  // kumpulkan musuh terdekat SEKARANG; tiap musuh dapat jatuhnya 3 anak panah
  const target = [];
  for (const e of enemies) {
    if (e.hp <= 0) continue;
    const d = Math.hypot(e.x - player.x, e.y - player.y);
    if (d > 620) continue;
    target.push({ e: e, d: d });
  }
  target.sort(function (a, b) { return a.d - b.d; });
  const daftar = target.slice(0, 6).map(function (t) { return t.e; });
  const JUMLAH = 5;
  for (let i = 0; i < JUMLAH; i++) {
    const a = -Math.PI / 2 + (i - (JUMLAH - 1) / 2) * 0.13;
    panahEs.push({
      x: player.x + Math.cos(a) * 24,
      y: player.y + Math.sin(a) * 24,
      vx: Math.cos(a) * 1080,
      vy: Math.sin(a) * 1080,
      t: 0,
      life: 3.2,
      fase: "naik",
      kids: 0,
      no: i,
      total: JUMLAH,
      daftar: daftar
    });
  }
  shake = 0.3;
  spawnParticles(player.x, player.y - 12, "#7dd3fc", 18);
}

for (let i = 0; i < KARAKTER.length; i++) {
  const kar = KARAKTER[i];
  daftarkanSkill(kar.kunci, 2, jurusBawaan);
  // Slot 3: Skill khusus per karakter
  if (kar.kunci === "rin") {
    daftarkanSkill(kar.kunci, 3, skillVenderInferno);
  } else if (kar.kunci === "kenzro") {
    daftarkanSkill(kar.kunci, 3, skillKenzroFrozfall);
  } else {
    daftarkanSkill(kar.kunci, 3, skillUji3);
  }
  daftarkanSkill(kar.kunci, 4, skillUji4);
  daftarkanSkill(kar.kunci, 5, skillUji5);
}
