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
const FUNGSI_CD = {};

function daftarkanSkill(kunci, slot, fn, cd) {
  FUNGSI_SKILL[kunci + "_" + slot] = fn;
  if (typeof cd === "number" && cd > 0) FUNGSI_CD[kunci + "_" + slot] = cd;
}

function cdSkill(kunci, slot) {
  const c = FUNGSI_CD[kunci + "_" + slot];
  return typeof c === "number" && c > 0 ? c : (player && player.specialMax ? player.specialMax : 9);
}

// ===== MODE 3 SKILL IN-GAME (keybind 1/2/3) =====
// Skill nomor 1 = skill BAWAAN karakter (slot 2: FROSTBITE/HEATWAVE/UMBRA),
// lalu 2 dan 3 = skill berikutnya sesuai urutan slot (slot 3 dan slot 4).
// Semua skill tiap karakter punya CD sendiri-sendiri; begitu satu skill
// dikeluarkan, SEMUA skill ikut CD sebesar CD skill yang dipakai (model
// Mobile Legends). Berlaku untuk SEMUA karakter.
const MODE_3SKILL = true;

function pakaiModeTigaSkill() {
  if (karakter === null) return false;
  if (MODE_3SKILL === true) return true;
  return !!MODE_3SKILL[karakter.kunci];
}

function slotDariTombol(tombol) {
  if (tombol === "1") return 2; // skill bawaan
  if (tombol === "2") return 3;
  if (tombol === "3") return 4;
  return 0;
}

// ===== AUTO-BIDIK HP =====
// Di versi HP tidak ada mouse: setiap skill / ultimate yang diarahkan
// otomatis membidik musuh HIDUP terdekat dari pemain sebelum dilepaskan.
function bidikMusuhTerdekatHp() {
  if (deviceTerpilih !== "mobile" || !player) return;
  let tgt = null, bd = Infinity;
  for (const e of enemies) {
    if (e.hp <= 0) continue;
    const d = (e.x - player.x) * (e.x - player.x) + (e.y - player.y) * (e.y - player.y);
    if (d < bd) { bd = d; tgt = e; }
  }
  if (!tgt) return;
  mouse.x = tgt.x;
  mouse.y = tgt.y;
  mouse.sx = tgt.x - kam.x;
  mouse.sy = tgt.y - kam.y;
}

function castSkillSlot(slot) {
  if (gameOver || animMati || karakter === null || statusGame !== "main" || player.specialCd > 0) return;
  const kunci = karakter.kunci;
  const daftar = daftarSkill(kunci);
  const def = daftar.filter(function (s) { return s.slot === slot; })[0];
  if (!def || !def.bisaPakai) return;
  if (levelKarakter(kunci) < def.level) return;
  const fn = FUNGSI_SKILL[kunci + "_" + slot];
  if (typeof fn !== "function") return;
  player.specialCd = cdSkill(kunci, slot);
  bidikMusuhTerdekatHp();
  fn();
}

function castSpecial() {
  if (gameOver || animMati || karakter === null || statusGame !== "main" || player.specialCd > 0) return;
  player.specialCd = player.specialMax;
  const slot = skillPakai(karakter.kunci);
  const fn = FUNGSI_SKILL[karakter.kunci + "_" + slot];
  bidikMusuhTerdekatHp();
  if (typeof fn === "function") fn();
  else jurusBawaan();
}

function jurusBawaan() {
  if (karakter && karakter.kunci === "voiz") skillVoizNullLaser();
  else if (karakter.tipe === "dekat") jurusVender();
  else jurusKenzro();
}

function rilisUltimate() {
  if (animMati || gameOver) return;
  if (soul < SOUL_MAX) return;
  soul = 0;
  bidikMusuhTerdekatHp();
  lancarkanUltimate();
}

function lancarkanUltimate() {
  if (karakter && karakter.kunci === "voiz") { jurusUltimateVoiz(); return; }
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

// ========== SKILL VOIZ SLOT 2: UMBRA ==========
// Saat dilancarkan: karakter terkunci dan laser keluar dari UJUNG TONGKAT,
// membeku di arah kast selama 2 detik (alur: buang arah lewat mouse).
function skillVoizNullLaser() {
  const a = arahMaus();
  const tip = Math.round(48 + (player.r || 19) * 3); // tengah senjata + setengah tongkat
  nullLasers.push({
    x: player.x + Math.cos(a) * tip,
    y: player.y + Math.sin(a) * tip,
    a: a,
    tip: tip,
    t: 0,
    life: 2
  });
  sfxLaserVoiz();
  addFlash("rgba(109, 40, 217, 0.55)", 0.8, 0.35);
  shake = 0.4;
  spawnParticles(player.x + Math.cos(a) * tip, player.y + Math.sin(a) * tip, "#7c3aed", 14);
}

// ========== SKILL VOIZ SLOT 3: PRISM ==========
// Sihir memantul: dari pemain, cahaya ungu melompat ke musuh TERDEKAT, lalu
// ke musuh terdekat berikutnya (maks 5 lompatan, tiap target sekali kena).
// Bukan petir — wujudnya butiran sihir + cincin cahaya di titik sambaran,
// tanpa garis zigzag menyambar.
function skillVoizPrism() {
  const MAKS = 5;
  const JANGKAUAN = 560;
  const kena = new Set();
  const urut = [];
  let asalX = player.x;
  let asalY = player.y;
  for (let hop = 0; hop < MAKS; hop++) {
    let terdekat = null;
    let td = JANGKAUAN;
    for (const e of enemies) {
      if (e.hp <= 0 || kena.has(e)) continue;
      const d = Math.hypot(e.x - asalX, e.y - asalY);
      if (d < td) { td = d; terdekat = e; }
    }
    if (!terdekat) break;
    kena.add(terdekat);
    urut.push({ e: terdekat, x: terdekat.x, y: terdekat.y });
    asalX = terdekat.x;
    asalY = terdekat.y;
  }
  if (!urut.length) return;

  // Suara PRISM: kast cepat; file "jurus-prism" dipakai kalau disediakan,
  // selain itu pakai kast prosedural. Per-hop memakai nada naik staccato
  // (sfxPrismHop) — tidak ada tick file, cocok untuk serangan cepat.
  sfxPrismKast();
  addFlash("rgba(168, 85, 247, 0.32)", 0.55, 0.3);
  shake = 0.25;
  spawnParticles(player.x, player.y, "#c084fc", 8);

  let px = player.x;
  let py = player.y;
  for (let i = 0; i < urut.length; i++) {
    const u = urut[i];
    const LEN = Math.hypot(u.x - px, u.y - py) || 1;
    const nButir = Math.max(6, Math.round(LEN / 16));
    for (let k = 0; k < nButir; k++) {
      const tt = (k + Math.random() * 0.7) / nButir;
      particles.push({
        x: px + (u.x - px) * tt,
        y: py + (u.y - py) * tt,
        vx: (Math.random() - 0.5) * 70,
        vy: (Math.random() - 0.5) * 70,
        life: 0.28 + Math.random() * 0.22,
        t: 0,
        size: 2.5 + Math.random() * 4.5,
        color: Math.random() < 0.5 ? "#c084fc" : "#a78bfa"
      });
    }
    prismPulsa.push({ x1: px, y1: py, x2: u.x, y2: u.y, t: 0, life: 0.4, dua: i });

    sfxPrismHop(i);
    const dmg = Math.round(46 * (typeof pengaliElement === "function" ? pengaliElement(karakter.kunci) : 1));
    const dmgPasar = applyDamageMusuh(u.e, dmg);
    u.e.hitFlash = 0.12;
    // PASIF PRISM: musuh yang tersambar lumpuh (diam) sebentar; bos lebih tahan.
    u.e.paralyze = Math.max(u.e.paralyze || 0, u.e.bos ? 0.5 : 1.2);
    parrySerigala(u.e);
    sfxKena();
    rings.push({ x: u.x, y: u.y, r: 5, maxR: 32, life: 0.28, t: 0 });
    spawnParticles(u.x, u.y, "#c084fc", 8);
    spawnDamage(u.x, u.y - (u.e.r || 20) - 16, dmgPasar, "#e9d5ff");
    serapanDarah(dmgPasar);
    if (u.e.hp <= 0) killEnemy(u.e);
    px = u.x;
    py = u.y;
  }
}

// ========== ULTIMATE VOIZ: BLACKHOLE ==========
// Bola kekacauan DILEMPAR dari ujung tongkat menuju pointer; saat mendarat
// di titik tujuan, lubang hitam menyala (membesar 4-5 detik sambil menarik
// musuh & damage berkala, lalu menyusut). Ditemani angin partikel.
function jurusUltimateVoiz() {
  let tx = mouse.x, ty = mouse.y;
  tx = Math.max(BARRIER_KIRI + 60, Math.min(WORLD_W - BARRIER_KANAN - 60, tx));
  ty = Math.max(BARRIER_ATAS + 60, Math.min(WORLD_H - BARRIER_BAWAH - 60, ty));
  const a = arahMaus();
  const tip = Math.round(48 + (player.r || 19) * 3);
  voidOrbs.push({
    x: player.x + Math.cos(a) * tip,
    y: player.y + Math.sin(a) * tip,
    tx: tx,
    ty: ty,
    t: 0,
    laju: 1250
  });
  if (!sfxFile("ultimate-voiz")) sfxUltimate();
  addFlash("rgba(139, 92, 246, 0.5)", 1, 0.6);
  shake = 0.6;
  spawnParticles(player.x + Math.cos(a) * tip, player.y + Math.sin(a) * tip, "#7c3aed", 22);
  rings.push({ x: player.x + Math.cos(a) * tip, y: player.y + Math.sin(a) * tip, r: 14, maxR: 80, life: 0.35, t: 0 });
}

for (let i = 0; i < KARAKTER.length; i++) {
  const kar = KARAKTER[i];
  daftarkanSkill(kar.kunci, 2, jurusBawaan);
  // Slot 3: Skill khusus per karakter
  if (kar.kunci === "rin") {
    daftarkanSkill(kar.kunci, 3, skillVenderInferno);
  } else if (kar.kunci === "kenzro") {
    daftarkanSkill(kar.kunci, 3, skillKenzroFrozfall, 10);
  } else if (kar.kunci === "voiz") {
    daftarkanSkill(kar.kunci, 3, skillVoizPrism, 8);
  } else {
    daftarkanSkill(kar.kunci, 3, skillUji3);
  }
  daftarkanSkill(kar.kunci, 4, skillUji4, kar.kunci === "kenzro" ? 7 : 0);
  daftarkanSkill(kar.kunci, 5, skillUji5, kar.kunci === "kenzro" ? 12 : 0);
}
