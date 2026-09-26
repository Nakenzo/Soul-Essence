function jurusKenzro() {
  player.specialBuff = player.buffDurasi || karakter.buffDurasi;
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

function castSpecial() {
  if (gameOver || animMati || karakter === null || statusGame !== "main" || player.specialCd > 0) return;
  player.specialCd = player.specialMax;
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
