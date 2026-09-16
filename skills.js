// ============================================================
// SKILLS - jurus unik per karakter.
// Dispatcher castSpecial memilih jurus sesuai karakter terpilih.
// Kenzro (jarak) : buff anak panah pembeku selama buffDurasi detik.
// Vender (dekat) : ledakan lingkaran di sekitar karakter.
// ============================================================

// Kenzro: panah yang ditembakkan selama buff akan membekukan musuh.
function jurusKenzro() {
  player.specialBuff = karakter.buffDurasi;
  spawnParticles(player.x, player.y, "#7dd3fc", 18);
  rings.push({ x: player.x, y: player.y, r: 10, maxR: 90, life: 0.4, t: 0 });
}

// Vender: tebasan besar sekali — 75 damage, musuh yang bertahan ikut terbakar.
function jurusVender() {
  const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  const ox = player.x + Math.cos(angle) * 35;
  const oy = player.y + Math.sin(angle) * 35;
  slashes.push({
    x: ox,
    y: oy,
    angle: angle,
    reach: 220,
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

// Dispatcher jurus: hanya bisa saat bermain & cooldown habis.
function castSpecial() {
  if (gameOver || karakter === null || statusGame !== "main" || player.specialCd > 0) return;
  player.specialCd = player.specialMax;
  if (karakter.tipe === "dekat") jurusVender();
  else jurusKenzro();
}

// ============== ULTIMATE ==============
// Penebusan ultimate lewat tombol R (bar jiwa harus penuh). Langsung diluncurkan.
function rilisUltimate() {
  if (soul < SOUL_MAX) return;
  soul = 0;
  lancarkanUltimate();
}

// Dispatcher peluncuran ultimate sesuai karakter.
function lancarkanUltimate() {
  if (karakter.tipe === "dekat") jurusUltimateVender();
  else jurusUltimateKenzro();
}

// Kenzro: aura dingin menyala — 3 tembakan berikutnya jadi panah RAKSASA
// (charge dulu, baru ditembakkan) yang membekukan musuh lama.
function jurusUltimateKenzro() {
  player.ultBuff = true;
  player.ultArrows = 3;
  player.ultCd = 0;
  rings.push({ x: player.x, y: player.y, r: 10, maxR: 130, life: 0.45, t: 0 });
  spawnParticles(player.x, player.y, "#7dd3fc", 26);
  shake = 0.4;
}

// Vender: sabit raksasa menebas SELURUH arena dalam satu putaran 360°.
function jurusUltimateVender() {
  const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  slashes.push({
    x: player.x,
    y: player.y,
    angle: angle,
    reach: 400,
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
}