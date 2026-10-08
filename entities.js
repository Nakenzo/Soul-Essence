function attack() {
  if (karakter && karakter.kunci === "voiz") {
    tembakBoltNihil();
    return;
  }
  if (karakter.tipe === "dekat") {
    slashSwing();
    return;
  }

  if ((player.ultArrows || 0) > 0) {
    if (player.ultCd <= 0) {
      tembakPanahRaksasa(Math.atan2(mouse.y - player.y, mouse.x - player.x));
      player.ultCd = ULT_CHARGE;
    }
    return;
  }
  shoot();

  player.attackAnimT = 0.25;
}

function dashLari() {
  if (statusGame !== "main" || !karakter || animMati) return;
  if (nullLasers.length > 0) return; // tidak bisa dash saat menyalurkan laser
  if (player.dashStacks <= 0) return;
  player.dashStacks--;
  sfxDash();

  player.dashTimers.push(DASH_CD);
  player.dashT = DASH_WAKTU;
  player.invuln = DASH_INVULN;
  const dashWarna = karakter && karakter.tipe === "dekat" ? "#ff8c3f" : "#bfe9ff";

  const dx = gerakDx();
  const dy = gerakDy();
  player.dashAngle = (dx !== 0 || dy !== 0)
    ? Math.atan2(dy, dx)
    : Math.atan2(mouse.y - player.y, mouse.x - player.x);
  spawnParticles(player.x, player.y, dashWarna, 10);
  rings.push({ x: player.x, y: player.y, r: 28, maxR: 120, life: 0.25, t: 0 });
}

function tembakPanahRaksasa(ang) {
  const speed = 2500;
  sfxPanahRaksasa();

  const nx = Math.cos(ang);
  const ny = Math.sin(ang);
  const px = -ny;
  const py = nx;
  let tExit = 1e9;
  if (nx > 0) tExit = Math.min(tExit, (WORLD_W + 10 - player.x) / nx);
  if (nx < 0) tExit = Math.min(tExit, (-10 - player.x) / nx);
  if (ny > 0) tExit = Math.min(tExit, (WORLD_H + 10 - player.y) / ny);
  if (ny < 0) tExit = Math.min(tExit, (-10 - player.y) / ny);
  const koridor = {
    x0: player.x,
    y0: player.y,
    nx: nx,
    ny: ny,
    px: px,
    py: py,
    half: 60,
    length: tExit + 60,
    reveal: 80,
    t: 0,
    life: BEKU_ZONE_LIFE,
    seed: Math.random() * 1000
  };
  freezes.push(koridor);
  bullets.push({
    x: player.x,
    y: player.y,
    vx: Math.cos(ang) * speed,
    vy: Math.sin(ang) * speed,
    life: 3.0,
    beku: false,
    raksasa: true,
    fz: koridor
  });
  player.ultArrows = Math.max(0, player.ultArrows - 1);
  if (player.ultArrows <= 0) player.ultBuff = false;
  shake = 0.35;
  spawnParticles(player.x, player.y, "#7dd3fc", 22);
}

function shoot() {
  if (player.attackCd > 0) return;
  player.attackCd = player.attackRate;
  sfxTembak();
  const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  const speed = player.bulletSpeed || 840;
  bullets.push({
    x: player.x,
    y: player.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 2.0,

    beku: player.specialBuff > 0
  });
  spawnParticles(player.x, player.y, "#ffd23f", 4);
}

// Nyx: bolt nihil melengkung, auto-aim ke musuh terdekat dengan pointer
// (fallback: musuh terdekat dari karakter), meninggalkan jejak partikel ungu.
function tembakBoltNihil() {
  if (player.attackCd > 0) return;
  player.attackCd = player.attackRate;
  player.attackAnimT = 0.25;
  sfxTembak();

  let tgt = null;
  let bd = 480 * 480;
  for (const en of enemies) {
    if (en.hp <= 0) continue;
    const dd = (en.x - mouse.x) * (en.x - mouse.x) + (en.y - mouse.y) * (en.y - mouse.y);
    if (dd < bd) { bd = dd; tgt = en; }
  }
  if (!tgt) {
    let bd2 = Infinity;
    for (const en of enemies) {
      if (en.hp <= 0) continue;
      const dd = (en.x - player.x) * (en.x - player.x) + (en.y - player.y) * (en.y - player.y);
      if (dd < bd2) { bd2 = dd; tgt = en; }
    }
  }
  // arah awal = arah mouse; auto-aim hanya MEMBELOKKAN pelurunya ke sasaran
  const ang0 = Math.atan2(mouse.y - player.y, mouse.x - player.x);

  boltNihil.push({
    x: player.x,
    y: player.y,
    px: player.x,
    py: player.y,
    aim: tgt,
    dx: Math.cos(ang0),
    dy: Math.sin(ang0),
    laju: 640,
    wob: Math.random() * Math.PI * 2,
    t: 0,
    life: 2.2
  });
  spawnParticles(player.x, player.y, "#c084fc", 5);
}

function slashSwing() {
  if (player.attackCd > 0) return;
  player.attackCd = player.attackRate;

  player.attackAnimT = 0.25;
  sfxSabet();
  const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  player.swing = player.swingDuration || karakter.swingDuration || 0.2;

  const ox = player.x + Math.cos(angle) * 70;
  const oy = player.y + Math.sin(angle) * 70;
  slashes.push({
    x: ox,
    y: oy,

    angle: angle,
    reach: player.reach || karakter.reach,
    halfArc: player.halfArc || karakter.halfArc,
    t: 0,
    life: player.swingDuration || 0.2,
    hit: new Set()
  });
  spawnParticles(ox, oy, "#ffffff", 6);
}

function titikSpawnAman(r) {
  const kiri = BARRIER_KIRI + 60;
  const kanan = WORLD_W - BARRIER_KANAN - 60;
  const atas = BARRIER_ATAS + 60;
  const bawah = WORLD_H - BARRIER_BAWAH - 60;
  const minJarak = 320;
  const boleh = (x, y) => {
    if (dist(x, y, player.x, player.y) < minJarak) return false;
    if (tesLingkaran(x, y, r + 2)) return false;
    for (const mm of enemies) {
      const a2 = x - mm.x, b2 = y - mm.y;
      const rr2 = r + mm.r + 6;
      if (a2 * a2 + b2 * b2 < rr2 * rr2) return false;
    }
    return true;
  };
  for (let upaya = 0; upaya < 80; upaya++) {
    const sisi = Math.floor(Math.random() * 4);
    let x, y;
    if (sisi === 0) { x = kiri; y = atas + Math.random() * (bawah - atas); }
    else if (sisi === 1) { x = kanan; y = atas + Math.random() * (bawah - atas); }
    else if (sisi === 2) { x = kiri + Math.random() * (kanan - kiri); y = atas; }
    else { x = kiri + Math.random() * (kanan - kiri); y = bawah; }
    if (boleh(x, y)) return { x, y };
  }
  for (let upaya = 0; upaya < 50; upaya++) {
    const ang = Math.random() * Math.PI * 2;
    const d = minJarak + 80 + Math.random() * 200;
    const x = Math.max(46, Math.min(WORLD_W - 46, player.x + Math.cos(ang) * d));
    const y = Math.max(46, Math.min(WORLD_H - 46, player.y + Math.sin(ang) * d));
    if (boleh(x, y)) return { x, y };
  }
  return null;
}

function spawnEnemy() {
  const def = LEVELS[level];
  let serigalaHidup = 0;
  for (const mm of enemies) if (mm.tipe === "serigala") serigalaHidup += 1;
  const tipe = serigalaHidup >= MAX_SERIGALA
    ? pilihTipeTanpaSerigala(def.campur)
    : pilihTipeMusuh(def.campur);
  const t = TIPE_MUSUH[tipe];
  const hp = Math.max(8, Math.round(def.hp * t.hpKali));

  let p = titikSpawnAman(t.r);
  if (!p) {
    const ang = Math.random() * Math.PI * 2;
    const d = 300 + Math.random() * 80;
    p = {
      x: Math.max(46, Math.min(WORLD_W - 46, player.x + Math.cos(ang) * d)),
      y: Math.max(46, Math.min(WORLD_H - 46, player.y + Math.sin(ang) * d))
    };
  }
  let x = p.x, y = p.y;

  const kecepatanMin = def.kecepatan[0];
  const kecepatanMax = def.kecepatan[1];
  enemies.push({
    x: x,
    y: y,
    tipe: tipe,
    kunci: t.kunci,
    hp: hp,
    maxHp: hp,
    speed: (kecepatanMin + Math.random() * (kecepatanMax - kecepatanMin)) * t.kecepatanKali,
    r: t.r,
    skala: t.skala,
    warna: t.warna,
    hitFlash: 0,
    freeze: 0,

    cd: 1.5 + Math.random() * 1.5,
    lahirT: tipe === "serigala" ? 1.4 : 0,
    lungeBersiap: 0,
    lungeT: 0,
    lungeCd: 1.0 + Math.random() * 1.6,
    mundurT: 0
  });
}

function parrySerigala(e) {
  if (e.bos) {
    // Parry bos hanya saat recovery — bukan saat telegraph/attack.
    if (!e.bosParah || e.bosKematian) return;
    e.bosParah = false;
    e.state = "stagger";
    e.stateT = 0;
    e.aksi = null;
    e.bomJalan = null;
    e.tarikT = 0;
    spawnDamage(e.x, e.y - e.r - 56, "PARRY", "#fbbf24");
    spawnParticles(e.x, e.y, "#fbbf24", 14);
    rings.push({ x: e.x, y: e.y, r: 12, maxR: e.r * 1.6, life: 0.35, t: 0 });
    if (typeof sfxBeku === "function") sfxBeku();
    return;
  }
  if (e.tipe !== "serigala") return;
  if (e.lungeT > 0 || e.lungeBersiap > 0) {
    e.lungeT = 0;
    e.lungeBersiap = 0;
    e.lungeCd = 1.2 + Math.random() * 0.6;
    e.mundurT = 0.3;
    spawnDamage(e.x, e.y - e.r - 56, "PARRY", "#fbbf24");
    spawnParticles(e.x, e.y, "#fbbf24", 8);
  }
}

let bossIntro = null;

function titikBossAman(r) {
  for (let u = 0; u < 40; u++) {
    const ang = Math.random() * Math.PI * 2;
    const d = 400 + Math.random() * 70;
    const x = player.x + Math.cos(ang) * d;
    const y = player.y + Math.sin(ang) * d;
    if (x < BARRIER_KIRI + r || x > WORLD_W - BARRIER_KANAN - r) continue;
    if (y < BARRIER_ATAS + r || y > WORLD_H - BARRIER_BAWAH - r) continue;
    if (tesLingkaran(x, y, r + 8)) continue;
    let tabrak = false;
    for (const mm of enemies) {
      if (mm.bosKematian) continue;
      const a2 = x - mm.x, b2 = y - mm.y, rr2 = r + mm.r + 6;
      if (a2 * a2 + b2 * b2 < rr2 * rr2) { tabrak = true; break; }
    }
    if (!tabrak) return { x, y };
  }
  return { x: WORLD_W / 2, y: WORLD_H / 2 };
}

function defBosLevel() {
  const w = LEVELS[level] || {};
  return definisiBos(w.bos) || BOSS_DEF["raja-slime"];
}

function mulaiIntroBoss() {
  const def = defBosLevel();
  const p = titikBossAman(def.r);
  bossIntro = { x: p.x, y: p.y, t: 0, durasi: 1.5, def: def };
  spawnTimer = 999;
  if (typeof sfxBoss === "function") sfxBoss();
  spawnParticles(p.x, p.y, def.warna, 46);
  addFlash("rgba(20, 83, 45, 0.35)", 0.8, 0.5);
  shake = 0.6;
}

function spawnBoss(x, y, def) {
  def = def || defBosLevel();
  const hp = hpBos(def);
  enemies.push({
    x: x,
    y: y,
    tipe: "bos",
    kunci: def.renderer || "slime",
    bos: true,
    bosDef: def,
    namaBos: def.nama,
    hp: hp,
    maxHp: hp,
    speed: def.kecepatan,
    r: def.r,
    skala: def.skala,
    warna: def.warna,
    hitFlash: 0,
    freeze: 0,
    contactCd: 0,
    sangkutT: 0,

    fase: 0,
    state: "idle",
    stateT: 0,
    aksi: null,
    angSerang: 0,
    telegrafDur: 0,
    comboSisa: 0,
    serangCd: def.jedaSerang,
    vulnKali: 1,
    bosParah: false,
    minionDipanggil: 0,
    barrageTahap: 0,
    barrageT: 0,
    tarikT: 0,
    bomJalan: null,
    bosKematian: false
  });
  levelSpawn = Math.max(levelSpawn, LEVELS[level].jumlah);
  spawnTimer = LEVELS[level].jedaSpawn;
  shake = 0.7;
  addFlash("rgba(74, 222, 128, 0.4)", 1, 0.5);
  rings.push({ x: x, y: y, r: 20, maxR: 200, life: 0.5, t: 0 });
  spawnParticles(x, y, def.warna, 50);
  spawnParticles(x, y, "#4ade80", 26);
}

function bossSlam(e, fase) {
  const radius = e.r * fase.radiusSlam;
  shake = 0.9;
  addFlash(warnaRGBA(fase.warnaBar, 0.28), 1, 0.35);
  rings.push({ x: e.x, y: e.y, r: 24, maxR: radius, life: 0.45, t: 0 });
  rings.push({ x: e.x, y: e.y, r: 12, maxR: radius * 0.65, life: 0.3, t: 0 });
  spawnParticles(e.x, e.y, "#365314", 40);
  spawnParticles(e.x, e.y, fase.warnaBar, 18);
  if (typeof sfxUltimate === "function") sfxUltimate();
  if (player.invuln <= 0 && dist(e.x, e.y, player.x, player.y) < radius) {
    const dmg = Math.round(fase.dmgSlam * (1 - (player.armor || 0)));
    player.hp -= dmg;
    player.hitFlash = 0.2;
    spawnDamage(player.x, player.y - 52, dmg, fase.warnaBar);
    sfxPemainKena();
    hurtVig = 1;
    spawnParticles(player.x, player.y, fase.warnaBar, 12);
    if (player.hp <= 0) prosesKematianPemain();
  }
}

// Damage masuk ke musuh; bos dapat pengali vulnKali (transisi fase & stagger parry).
function applyDamageMusuh(e, dmg) {
  const total = e.bos ? dmg * (e.vulnKali || 1) : dmg;
  e.hp -= total;
  return total;
}

// --- Fase -------------------------------------------------------------------
// Minion: total dibatasi minionTotal per fight, tiap fase masuk summon 1.
function summonMinionBos(e, fase) {
  if (!fase.spawn) return;
  if (e.minionDipanggil >= (e.bosDef.minionTotal || 0)) return;
  const t = TIPE_MUSUH[fase.spawn];
  if (!t) return;
  e.minionDipanggil++;

  const hp = Math.max(8, Math.round(90 * t.hpKali));
  const ang = Math.random() * Math.PI * 2;
  let x = e.x + Math.cos(ang) * (e.r + 70);
  let y = e.y + Math.sin(ang) * (e.r + 70);
  if (x < BARRIER_KIRI + 40) x = e.x - Math.cos(ang) * (e.r + 70);
  if (x > WORLD_W - BARRIER_KANAN - 40) x = e.x - Math.cos(ang) * (e.r + 70);
  if (y < BARRIER_ATAS + 40) y = e.y - Math.sin(ang) * (e.r + 70);
  if (y > WORLD_H - BARRIER_BAWAH - 40) y = e.y - Math.sin(ang) * (e.r + 70);
  if (tesLingkaran(x, y, t.r)) { x = e.x; y = e.y + e.r + 40; }

  enemies.push({
    x: x, y: y,
    tipe: fase.spawn,
    kunci: t.kunci,
    hp: hp, maxHp: hp,
    speed: 95 * t.kecepatanKali,
    r: t.r, skala: t.skala, warna: t.warna,
    hitFlash: 0, freeze: 0,
    cd: 1.4,
    lahirT: 0.8,
    lungeBersiap: 0, lungeT: 0, lungeCd: 2.0 + Math.random(), mundurT: 0,
    punyaBos: true,
    koinNol: true
  });
  rings.push({ x: x, y: y, r: 8, maxR: 90, life: 0.45, t: 0 });
  spawnParticles(x, y, fase.warnaBar, 22);
  spawnDamage(x, y - t.r - 50, "PANGGILAN", fase.warnaBar);
}

function masukFaseBos(e, nf) {
  const def = e.bosDef;
  const fase = def.fase[nf];
  e.fase = nf;
  e.state = "transisi";
  e.stateT = 0;
  e.aksi = null;
  e.bosParah = false;
  e.bomJalan = null;
  e.tarikT = 0;
  e.vulnKali = def.transisi.damageKali;
  e.comboSisa = 0;

  shake = 1;
  addFlash(warnaRGBA(fase.warnaBar, 0.42), 1, 0.5);
  rings.push({ x: e.x, y: e.y, r: 20, maxR: e.r * 3, life: 0.6, t: 0 });
  rings.push({ x: e.x, y: e.y, r: 10, maxR: e.r * 1.8, life: 0.4, t: 0 });
  spawnParticles(e.x, e.y, fase.warnaBar, 40);
  spawnDamage(e.x, e.y - e.r - 60, "FASE " + (nf + 1), fase.warnaBar);
  if (typeof sfxBoss === "function") sfxBoss();
  summonMinionBos(e, fase);
}

// --- Serangan ---------------------------------------------------------------
function bosSpora(e, fase) {
  const jumlah = fase.sporaJumlah;
  const speed = fase.sporaSpeed;
  const off = Math.random() * Math.PI * 2;
  for (let i = 0; i < jumlah; i++) {
    const a = off + (i / jumlah) * Math.PI * 2;
    enemyShots.push({
      x: e.x + Math.cos(a) * e.r,
      y: e.y + Math.sin(a) * e.r,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      life: 3.4, r: 11, dmg: fase.sporaDmg,
      warna: fase.warnaBar
    });
  }
  rings.push({ x: e.x, y: e.y, r: 12, maxR: e.r * 1.3, life: 0.35, t: 0 });
  spawnParticles(e.x, e.y, fase.warnaBar, 18);
}

// Tarik pemain ke arah bos. `gaya` = px/s^2, jadi langkah per frame = gaya * dt.
function bosTarik(e, fase, dt) {
  const gaya = fase.tarikGaya;
  if (!gaya) return;
  const a = Math.atan2(e.y - player.y, e.x - player.x);
  const dorong = gaya * dtJarak(e) * dt;
  const nx = player.x + Math.cos(a) * dorong;
  const ny = player.y + Math.sin(a) * dorong;
  if (!tesLingkaran(nx, player.y, P_RADIUS)) player.x = nx;
  if (!tesLingkaran(player.x, ny, P_RADIUS)) player.y = ny;
  // Jangan sampai pemain tertarik menembus badan bos.
  const minJarak = e.r + P_RADIUS + 6;
  const d2 = dist(e.x, e.y, player.x, player.y);
  if (d2 < minJarak && d2 > 0.001) {
    const k = minJarak / d2;
    player.x = e.x + (player.x - e.x) * k;
    player.y = e.y + (player.y - e.y) * k;
  }
  rings.push({ x: e.x, y: e.y, r: e.r * 0.9, maxR: e.r * 1.5, life: 0.25, t: 0 });
}

// Jarak tempuh tarik: dunkel dari jarak, jadi tidak deadly saat boss di sisi lain.
function dtJarak(e) {
  return Math.max(0, Math.min(1, (dist(e.x, e.y, player.x, player.y) - e.r - 30) / 220));
}

function bosCharge(e, fase, dt) {
  const S = e.bosDef.serangan.charge;
  const speed = e.bosDef.kecepatan * S.speedKali;
  if (!e.bomJalan) e.bomJalan = { t: 0, jejak: 0 };
  e.bomJalan.t += dt;
  e.bomJalan.jejak += dt;

  if (e.bomJalan.jejak >= 0.16) {
    e.bomJalan.jejak = 0;
    hazards.push({
      x: e.x, y: e.y, r: e.r * 0.85, life: 2.6, t: 0,
      dmg: Math.round(fase.dmgSlam * 0.5 * (1 - (player.armor || 0))),
      warna: fase.warnaBar,
      dariBos: true
    });
  }
  spawnParticles(e.x, e.y, fase.warnaBar, 3);
  return { spd: speed, ang: e.angSerang };
}

function bosBarrage(e, fase, dt) {
  const S = e.bosDef.serangan.barrage;
  e.barrageT -= dt;
  if (e.barrageT <= 0) {
    e.barrageT += S.jedaTahap;
    e.barrageTahap++;
    const n = fase.sporaJumlah;
    const off = Math.random() * Math.PI * 2;
    for (let i = 0; i < n; i++) {
      const a = off + (i / n) * Math.PI * 2;
      enemyShots.push({
        x: e.x + Math.cos(a) * e.r,
        y: e.y + Math.sin(a) * e.r,
        vx: Math.cos(a) * fase.sporaSpeed * 1.1,
        vy: Math.sin(a) * fase.sporaSpeed * 1.1,
        life: 3.4, r: 12, dmg: fase.sporaDmg,
        warna: "#ef4444"
      });
    }
    rings.push({ x: e.x, y: e.y, r: 14, maxR: e.r * 1.4, life: 0.3, t: 0 });
    shake = Math.max(shake, 0.35);
  }
  return { spd: 0, ang: null };
}

// --- State machine ----------------------------------------------------------
// Telegraph >= 0.5s dan selalu ada jeda "recover" supaya bisa di-dash / di-parry.
function updateBos(e, dt) {
  const def = e.bosDef;

  // Cek ambang fase tiap frame (kecuali sedang transisi / sedang dipatah).
  if (e.state !== "transisi" && e.state !== "stagger" && e.state !== "mati") {
    const nf = cariFaseBos(def, Math.max(0, e.hp / e.maxHp));
    while (nf > e.fase) { masukFaseBos(e, e.fase + 1); }
  }

  const fase = def.fase[e.fase];
  const S = def.serangan;

  if (e.state === "transisi") {
    e.stateT += dt;
    if (e.stateT >= def.transisi.durasi) {
      e.stateT = 0;
      e.state = "idle";
      e.vulnKali = 1;
      e.serangCd = 0.5;
    }
    return { spd: 0, ang: null };
  }

  if (e.state === "stagger") {
    e.stateT += dt;
    e.vulnKali = 1.35;
    if (e.stateT >= 1.0) {
      e.stateT = 0;
      e.vulnKali = 1;
      e.state = "recover";
      e.stateT = 0;
    }
    return { spd: 0, ang: null };
  }

  if (e.state === "recover") {
    e.stateT += dt;
    e.bosParah = true;
    if (Math.random() < 0.25) {
      spawnParticles(e.x + (Math.random() - 0.5) * e.r * 2, e.y - e.r * 0.4, fase.warnaBar, 1);
    }
    if (e.stateT >= 0.5) {
      e.stateT = 0;
      e.state = "idle";
      e.bosParah = false;
      e.serangCd = fase.jedaSerangan;
    }
    return { spd: 0, ang: null };
  }

  if (e.state === "tele") {
    e.stateT += dt;
    if (e.stateT >= e.telegrafDur) {
      e.stateT = 0;
      e.state = "serang";
      mulaiSeranganBos(e, fase);
    }
    return { spd: e.speed * 0.1, ang: e.state === "tele" ? e.angSerang : null };
  }

  if (e.state === "serang") {
    e.stateT += dt;
    let g = { spd: 0, ang: null };

    if (e.aksi === "slam") {
      g = { spd: e.speed * 0.1, ang: null };
    } else if (e.aksi === "spora") {
      g = { spd: e.speed * 0.1, ang: null };
    } else if (e.aksi === "tarik") {
      bosTarik(e, fase, dt);
      e.tarikT -= dt;
      g = { spd: 0, ang: null };
      if (e.tarikT <= 0) selesaiSeranganBos(e, fase);
    } else if (e.aksi === "charge") {
      g = bosCharge(e, fase, dt);
      if (e.stateT >= S.charge.durasi) {
        e.bomJalan = null;
        e.state = "recover";
        e.stateT = -S.charge.repuh;
      }
    } else if (e.aksi === "barrage") {
      g = bosBarrage(e, fase, dt);
      if (e.barrageTahap >= 4) selesaiSeranganBos(e, fase);
    }

    if (e.state === "serang" && e.aksi !== "charge" && e.aksi !== "tarik" && e.aksi !== "barrage") {
      if (e.stateT >= 0.28) selesaiSeranganBos(e, fase);
    }
    return g;
  }

  // idle
  e.stateT += dt;
  e.serangCd -= dt;
  const jd = dist(e.x, e.y, player.x, player.y);
  if (e.serangCd <= 0 && jd < 900) {
    const daftar = fase.serang;
    e.aksi = daftar[Math.floor(Math.random() * daftar.length)];
    e.state = "tele";
    e.stateT = 0;
    e.telegrafDur = Math.max(0.5, S[e.aksi].telegraf);
    e.angSerang = Math.atan2(player.y - e.y, player.x - e.x);
    e.barrageTahap = 0;
    e.barrageT = 0;
  }
  return { spd: e.speed * fase.gerak * 0.5, ang: null };
}

function mulaiSeranganBos(e, fase) {
  const S = e.bosDef.serangan;
  const konf = S[e.aksi] || {};
  e.bomJalan = null;
  e.tarikT = konf.durasi || 0;
  e.barrageTahap = 0;
  e.barrageT = 0;
  e.comboSisa = konf.combo || 1;

  if (e.aksi === "slam") bossSlam(e, fase);
  else if (e.aksi === "spora") bosSpora(e, fase);
  else if (e.aksi === "charge") shake = 0.5;
}

function selesaiSeranganBos(e, fase) {
  const S = e.bosDef.serangan;
  const konf = S[e.aksi] || {};
  e.comboSisa--;
  if (e.comboSisa > 0) {
    // Combo: telegraph ulang dengan jeda pendek.
    e.state = "tele";
    e.stateT = -((konf.jedaCombo || 0.4) - 0.4);
    e.telegrafDur = Math.max(0.5, konf.telegraf);
    e.angSerang = Math.atan2(player.y - e.y, player.x - e.x);
    return;
  }
  e.state = "recover";
  e.stateT = 0;
  e.aksi = null;
}


// --- Kematian bos: 4 beat, total 3.2 detik, baru bayar koin ---------------
let bosKematian = null;
const BOS_MATI_BEAT = { guncang: 0.7, ledakan: 0.9, tenang: 0.8, koin: 0.8 };
const BOS_MATI_TOTAL = 3.2;

function mulaiKematianBos(e) {
  // Burn / damage lanjutan bisa memanggil killEnemy lagi — jangan restart sinematik.
  if (e.bosKematian) return;
  e.hp = 0;
  e.bosKematian = true;
  e.state = "mati";
  e.stateT = 0;
  e.vulnKali = 0;
  e.bosParah = false;
  e.bomJalan = null;
  e.tarikT = 0;
  e.burn = null;
  bossIntro = null;
  bosKematian = { e: e, t: 0, sudahBayar: false };
  spawnTimer = 999;
  if (typeof catatBosKalah === "function" && e.bos && e.bosDef && e.bosDef.kunci) {
    catatBosKalah(e.bosDef.kunci);
  }
  if (typeof sfxBoss === "function") sfxBoss();
}

// Sinematik masih berjalan? Bosnya dicek masih di arena, else global sisa
// bikin levelSelesai() macet selamanya.
function bosKematianAktif() {
  if (!bosKematian) return false;
  if (enemies.indexOf(bosKematian.e) === -1) {
    bosKematian = null;
    return false;
  }
  return true;
}

function bunuhMinionBos(e) {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const mm = enemies[i];
    if (mm === e || !mm.punyaBos) continue;
    spawnParticles(mm.x, mm.y, mm.warna, 12);
    rings.push({ x: mm.x, y: mm.y, r: 6, maxR: 60, life: 0.3, t: 0 });
    enemies.splice(i, 1);
  }
}

function updateBosKematian(e, dt) {
  const K = bosKematian;
  if (!K) { bersihkanBosMati(e); return; }

  const sebelum = K.t;
  K.t += dt;
  K.e.stateT = K.t;

  // Beat 1: guncang — bos goyah, darah mengucur, belum meledak.
  if (sebelum < BOS_MATI_BEAT.guncang) {
    shake = Math.max(shake, 0.35);
    if (Math.random() < 0.6) {
      spawnParticles(
        e.x + (Math.random() - 0.5) * e.r * 2.2,
        e.y + (Math.random() - 0.5) * e.r * 1.4,
        Math.random() < 0.5 ? "#14532d" : "#4ade80", 2
      );
    }
  }

  // Beat 2: ledakan. Pakai flag satu-csekali, bukan perbandingan waktu, supaya
  // aman dari frame hitch dan tidak menumpuk flash jadi layar putih.
  const tLedak = BOS_MATI_BEAT.guncang;
  if (!K.ledakanSelesai && K.t >= tLedak) {
    K.ledakanSelesai = true;
    shake = 1.4;
    addFlash("rgba(200, 255, 210, 0.30)", 0.30, 0.28);
    rings.push({ x: e.x, y: e.y, r: 20, maxR: 420, life: 0.8, t: 0 });
    rings.push({ x: e.x, y: e.y, r: 10, maxR: 260, life: 0.55, t: 0 });
    spawnParticles(e.x, e.y, "#dcfce7", 14);
    spawnParticles(e.x, e.y, "#4ade80", 26);
    spawnParticles(e.x, e.y, "#14532d", 22);
    if (typeof sfxUltimate === "function") sfxUltimate();
    bunuhMinionBos(e);
  }

  // Beat 3: tenang — bos menyusut, soul keluar.
  const tTenang = tLedak + BOS_MATI_BEAT.ledakan;
  if (K.t >= tTenang) {
    const u = Math.min(1, (K.t - tTenang) / BOS_MATI_BEAT.tenang);
    // Bersih-bersihnapas, bukan percikan tiap frame.
    K.embedu = (K.embedu || 0) + dt;
    if (K.embedu > 0.05) {
      K.embedu = 0;
      spawnParticles(e.x + (Math.random() - 0.5) * e.r, e.y, "#bbf7d0", 1);
    }
    if (!K.soulDilepas && u > 0.35) {
      K.soulDilepas = true;
      for (let k = 0; k < 8; k++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = 90 + Math.random() * 200;
        souls.push({ x: e.x, y: e.y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, t: 0, life: 9 });
      }
    }
  }

  // Beat 4: coin burst — koin masuk dulu, baru level selesai.
  if (!K.sudahBayar && K.t >= BOS_MATI_TOTAL - BOS_MATI_BEAT.koin) {
    K.sudahBayar = true;
    const dapat = Math.round(KOIN_BOS * (player.mult && player.mult.koin || 1));
    koin += dapat;
    spawnDamage(e.x, e.y - e.r - 40, "+" + dapat + " KOIN", "#ffd23f");
    for (let k = 0; k < 60; k++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 140 + Math.random() * 320;
      particles.push({
        x: e.x, y: e.y,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 120,
        life: 0.8 + Math.random() * 0.6, t: 0,
        size: 5 + Math.random() * 7,
        color: Math.random() < 0.6 ? "#ffd23f" : "#fff3b0"
      });
    }
    rings.push({ x: e.x, y: e.y, r: 10, maxR: 300, life: 0.6, t: 0 });
  }

  if (K.t >= BOS_MATI_TOTAL) bersihkanBosMati(e);
}

function bersihkanBosMati(e) {
  const i = enemies.indexOf(e);
  if (i !== -1) enemies.splice(i, 1);
  bossIntro = null;
  bosKematian = null;

  if (typeof dropArtefak === "function") {
    const drop = dropArtefak();
    if (drop) {
      artefakBaruTerakhir = drop;
      const cari = artefakCari(drop.id);
      const warna = cari ? cari.set.warna : "#ffd23f";
      rings.push({ x: e.x, y: e.y, r: 10, maxR: 130, life: 0.6, t: 0 });
      spawnParticles(e.x, e.y, warna, 24);
    }
  }
}

function killEnemy(e) {
  const i = enemies.indexOf(e);
  if (i === -1) return;

  if (e.bos) {
    mulaiKematianBos(e);
    return;
  }

  // Minion bos tidak menjatuhkan koin (soul tetap normal).
  if (!e.koinNol) koin += Math.round(10 * (player.mult && player.mult.koin || 1));
  sfxMatMusuh();

  const imgMusuh = tekstur[e.kunci + "-idle-0"] || tekstur[e.kunci];
  buatDeathPixels(e.x, e.y, imgMusuh, e.skala || 1);

  const n = DROP_SOUL[e.tipe] || 3;
  for (let k = 0; k < n; k++) {
    const ang = Math.random() * Math.PI * 2;
    const sp = 80 + Math.random() * 180;
    souls.push({
      x: e.x,
      y: e.y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp,
      t: 0,
      life: 8
    });
  }
  spawnParticles(e.x, e.y, "#ff4d4d", 14);
  spawnParticles(e.x, e.y, "#ffd23f", 6);
  enemies.splice(i, 1);
}

function serapanDarah(dmg) {
  if (!player.kartu || !player.kartu.pencuriDarah || player.hp >= player.maxHp) return;
  const heal = Math.max(1, Math.round(dmg * 0.08));
  player.hp = Math.min(player.maxHp, player.hp + heal);
}

function prosesKematianPemain() {
  if (animMati || gameOver) return;
  player.hp = 0;
  const punyaNyawa = !!(player.kartu && player.kartu.nyawaKedua);
  if (typeof setSfxTerjeda === "function") setSfxTerjeda(true);
  animMati = {
    t: 0,
    durasi: punyaNyawa ? 1.35 : 1.7,
    nyawa: punyaNyawa,
    revived: false,
    kartuT: 0,
    fasePulih: 0
  };
  player.invuln = 999;
  spawnParticles(player.x, player.y, "#3aa0ff", 30);
  shake = 0.6;
}

function reviveNyawaKedua() {
  if (!player.kartu || !player.kartu.nyawaKedua) {

    animMati.nyawa = false;
    animMati.t = 0;
    animMati.durasi = 1.7;
    return;
  }
  delete player.kartu.nyawaKedua;
  if (typeof perbaruiNotaKartu === "function") perbaruiNotaKartu();
  if (typeof setSfxTerjeda === "function") setSfxTerjeda(false);
  player.hp = Math.max(1, Math.round(player.maxHp * 0.3));
  player.invuln = 2;
  player.hitFlash = 0.3;
  spawnParticles(player.x, player.y, "#fde047", 30);
  rings.push({ x: player.x, y: player.y, r: 28, maxR: 160, life: 0.5, t: 0 });
  spawnDamage(player.x, player.y - 72, "NYAWA KEDUA", "#fde047");
  if (typeof sfxLevel === "function") sfxLevel();
  animMati.revived = true;
  animMati.fasePulih = 0;
}

function easeOutCubic(x) { return 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3); }

function updateAnimMati(dt) {
  animMati.t += dt;
  const t = animMati.t;

  const zoomMax = animMati.nyawa && !animMati.revived ? 1.55 : 2.0;
  const pZoom = easeOutCubic(t / 0.6);
  if (!animMati.revived) {
    zoomKamera = 1 + (zoomMax - 1) * pZoom;
  }

  if (!animMati.revived) {
    const pFilt = Math.max(0, Math.min(1, (t - 0.35) / 0.65));
    aturFilterMati(animMati.nyawa ? pFilt * 0.55 : pFilt);
  }

  if (animMati.nyawa && !animMati.revived) {
    animMati.kartuT = Math.max(0, Math.min(1, (t - 0.2) / 0.75));
    if (animMati.kartuT >= 1) reviveNyawaKedua();
  }

  if (animMati.revived) {
    animMati.fasePulih += dt;
    const p = easeOutCubic(animMati.fasePulih / 0.5);
    zoomKamera = zoomMax - (zoomMax - 1) * p;
    aturFilterMati((animMati.nyawa ? 0.55 : 1) * (1 - p));
    if (animMati.fasePulih >= 0.5) {
      animMati = null;
      zoomKamera = 1;
      aturFilterMati(0);
    }
    return;
  }

  if (!animMati.nyawa && t >= animMati.durasi) {
    animMati = null;
    gameOver = true;
    spawnParticles(player.x, player.y, "#3aa0ff", 10);
    addFlash("rgba(160, 0, 40, 0.5)", 1, 0.6);
    tampilkanGameOver();
  }

  if (animMati && animMati.nyawa && !animMati.revived && t >= animMati.durasi) {
    animMati.nyawa = false;
    animMati.t = 0;
    animMati.durasi = 1.7;
  }
}

function updateEfekMati(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.t >= p.life) particles.splice(i, 1);
  }
  for (let i = deathPixels.length - 1; i >= 0; i--) {
    const dp = deathPixels[i];
    dp.t += dt;
    dp.x += dp.vx * dt;
    dp.y += dp.vy * dt;
    dp.vy += dp.grav * dt;
    dp.vx *= 0.98;
    if (dp.t >= dp.life) deathPixels.splice(i, 1);
  }
  if (player) player.hitFlash = Math.max(0, (player.hitFlash || 0) - dt);
  for (let i = flashes.length - 1; i >= 0; i--) {
    flashes[i].t += dt;
    if (flashes[i].t >= flashes[i].life) flashes.splice(i, 1);
  }
  hurtVig = Math.max(0, hurtVig - dt * 1.4);
  for (let i = damages.length - 1; i >= 0; i--) {
    const dm = damages[i];
    dm.t += dt;
    dm.y -= 60 * dt;
    if (dm.t >= dm.life) damages.splice(i, 1);
  }
  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i];
    r.t += dt;
    r.r = 20 + (r.maxR - 20) * (r.t / r.life);
    if (r.t >= r.life) rings.splice(i, 1);
  }
}

function update(dt) {

  if (statusGame === "title" || statusGame === "select") {
    updateBgPartikel(dt);
    return;
  }

  if (animMati) {
    updateAnimMati(dt);
    updateEfekMati(dt);
    return;
  }

  if (gameOver || statusGame !== "main") return;

  updateAmbience(dt);

  if (levelBanner) {
    levelBanner.t += dt;
    if (levelBanner.t >= levelBanner.life) levelBanner = null;
  }

  if (bossIntro) {
    bossIntro.t += dt;
    if (Math.random() < 0.75) {
      particles.push({
        x: bossIntro.x + (Math.random() - 0.5) * 150,
        y: bossIntro.y + (Math.random() - 0.5) * 120,
        vx: (Math.random() - 0.5) * 70,
        vy: -50 - Math.random() * 130,
        life: 0.4 + Math.random() * 0.4,
        t: 0,
        size: 5 + Math.random() * 9,
        color: Math.random() < 0.5 ? "#14532d" : "#4ade80"
      });
    }
    if (bossIntro.t >= bossIntro.durasi) {
      const bi = bossIntro;
      bossIntro = null;
      spawnBoss(bi.x, bi.y, bi.def);
    }
  }

  let dx = 0, dy = 0;
  let mvx = 0, mvy = 0;
  const terKunciLaser = nullLasers.length > 0;
  if (!terKunciLaser && player.dashT > 0) {

    player.dashT -= dt;
    mvx = Math.cos(player.dashAngle) * DASH_SPEED * dt;
    mvy = Math.sin(player.dashAngle) * DASH_SPEED * dt;
const dashWarna = (karakter && karakter.warnaDash) || (karakter && karakter.tipe === "dekat" ? "#ff8c3f" : "#bfe9ff");
    if (Math.random() < 0.8) {
      particles.push({
        x: player.x,
        y: player.y,
        vx: (Math.random() - 0.5) * 80,
        vy: (Math.random() - 0.5) * 80,
        life: 0.25,
        t: 0,
        size: 6 + Math.random() * 6,
        color: Math.random() < 0.5 ? dashWarna : (karakter && karakter.tipe === "dekat" ? "#ffd75f" : "#ffffff")
      });
    }
  } else if (!terKunciLaser) {
    dx = gerakDx();
    dy = gerakDy();
    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      mvx = (dx / len) * player.speed * dt;
      mvy = (dy / len) * player.speed * dt;

      if (Math.abs(dy) > Math.abs(dx)) {
        if (dy !== 0) {
          player.dirY = dy < 0 ? -1 : 1;
          player.domVertikal = true;
        }
      } else if (dx !== 0) {
        player.dir = dx < 0 ? -1 : 1;
        player.domVertikal = false;
      }
    }
  }

  const pR = player.r >= 0 ? player.r : P_RADIUS;
  if (!tesLingkaran(player.x + mvx, player.y, pR)) player.x += mvx;
  if (!tesLingkaran(player.x, player.y + mvy, pR)) player.y += mvy;
  player.x = Math.max(10, Math.min(WORLD_W - 10, player.x));
  player.y = Math.max(10, Math.min(WORLD_H - 10, player.y));

  player.gerak = player.dashT > 0 || dx !== 0 || dy !== 0;

  player.attackCd -= dt;
  player.attackAnimT = Math.max(0, (player.attackAnimT || 0) - dt);
  player.specialCd = Math.max(0, player.specialCd - dt);
  player.specialBuff = Math.max(0, (player.specialBuff || 0) - dt);
  player.swing = Math.max(0, (player.swing || 0) - dt);

  player.ultCd = Math.max(0, (player.ultCd || 0) - dt);

  if (player.regen > 0 && player.hp < player.maxHp) {
    player.hp = Math.min(player.maxHp, player.hp + player.regen * dt);
  }

  player.invuln = Math.max(0, (player.invuln || 0) - dt);
  if (player.dashTimers.length) {
    for (let i = player.dashTimers.length - 1; i >= 0; i--) {
      player.dashTimers[i] -= dt;
      if (player.dashTimers[i] <= 0) {
        player.dashTimers.splice(i, 1);
        if (player.dashStacks < player.dashMax) player.dashStacks++;
      }
    }
  }

  player.dashCd = player.dashTimers.reduce((a, b) => a + b, 0);

  if (_serangAktif && (aimDx !== 0 || aimDy !== 0)) {
    const jarakBidik = 400;
    mouse.x = player.x + aimDx * jarakBidik;
    mouse.y = player.y + aimDy * jarakBidik;
    mouse.sx = mouse.x - kam.x;
    mouse.sy = mouse.y - kam.y;
  }

  if (mouse.down && player.kartu && player.kartu["bidik"] > 0) {
    let tgt = null, bd = Infinity;
    for (const en of enemies) {
      if (en.hp <= 0) continue;
      const dd = (en.x - player.x) * (en.x - player.x) + (en.y - player.y) * (en.y - player.y);
      if (dd < bd) { bd = dd; tgt = en; }
    }
    if (tgt) {
      mouse.x = tgt.x;
      mouse.y = tgt.y;
      mouse.sx = tgt.x - kam.x;
      mouse.sy = tgt.y - kam.y;
    }
  }

  if (mouse.down) {
    attack();
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.px = b.x;
    b.py = b.y;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.life <= 0 || b.x < -10 || b.x > WORLD_W + 10 || b.y < -10 || b.y > WORLD_H + 10) {
      bullets.splice(i, 1);
      continue;
    }

    if (b.raksasa && b.fz) {
      const prog = (b.x - b.fz.x0) * b.fz.nx + (b.y - b.fz.y0) * b.fz.ny + 120;
      if (prog > b.fz.reveal) b.fz.reveal = prog;
    }

    if (b.beku && !b.raksasa && Math.random() < 0.6) {
      particles.push({
        x: b.x,
        y: b.y,
        vx: (Math.random() - 0.5) * 120,
        vy: (Math.random() - 0.5) * 120,
        life: 0.15 + Math.random() * 0.15,
        t: 0,
        size: 2 + Math.random() * 4,
        color: "#bfe9ff"
      });
    }

    if (b.raksasa && Math.random() < 0.9) {
      particles.push({
        x: b.x + (Math.random() - 0.5) * 24,
        y: b.y + (Math.random() - 0.5) * 24,
        vx: (Math.random() - 0.5) * 32,
        vy: (Math.random() - 0.5) * 32,
        life: 0.6 + Math.random() * 0.6,
        t: 0,
        size: 3 + Math.random() * 4,
        color: Math.random() < 0.5 ? "#bfe9ff" : "#d7f2ff"
      });
    }
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];

      const hitR = b.raksasa ? e.r + 60 : e.r + 8;
      const hit = segDist(b.px, b.py, b.x, b.y, e.x, e.y) < hitR;
      if (hit) {
        if (b.raksasa) {

          if (!b.hitSet) b.hitSet = new Set();
          const dmg = 100;
          const impuls = [];
          for (let k = enemies.length - 1; k >= 0; k--) {
            const e2 = enemies[k];
            if (!b.hitSet.has(e2) && dist(e.x, e.y, e2.x, e2.y) <= 180) {
              impuls.push(e2);
            }
          }
          for (const e2 of impuls) {
            b.hitSet.add(e2);
            applyDamageMusuh(e2, dmg);
            e2.hitFlash = 0.1;
            e2.freeze = 7;
            parrySerigala(e2);
            sfxBeku();
            spawnParticles(e2.x, e2.y, "#7dd3fc", 10);
            spawnDamage(e2.x, e2.y - e2.r - 56, "BEKU 7D", "#7dd3fc");
            spawnDamage(e2.x, e2.y - e2.r - 16, dmg, "#ffd23f");
            serapanDarah(dmg);
            if (e2.hp <= 0) killEnemy(e2);
          }
          rings.push({ x: e.x, y: e.y, r: 24, maxR: 180, life: 0.3, t: 0 });
          rings.push({ x: e.x, y: e.y, r: 12, maxR: 110, life: 0.25, t: 0 });
          break;
        }
        let dmg = player.damage || karakter.damage;
        if (Math.random() < (player.crit || 0)) {
          dmg *= 2;
          spawnDamage(e.x, e.y - e.r - 40, "KRITIS", "#fbbf24");
        }
        const dmgPasar = applyDamageMusuh(e, dmg);
        e.hitFlash = 0.1;
        parrySerigala(e);
        sfxKena();
        if (b.beku) {
          e.freeze = player.bekuDurasi || karakter.bekuDurasi;
          sfxBeku();
          spawnParticles(e.x, e.y, "#7dd3fc", 8);
          spawnDamage(e.x, e.y - e.r - 56, "BEKU", "#7dd3fc");
        }
        spawnDamage(e.x, e.y - e.r - 16, dmg, "#ffd23f");
        serapanDarah(dmg);
        bullets.splice(i, 1);
        if (e.hp <= 0) killEnemy(e);
        break;
      }
    }
  }

  // ===== NYX: bolt nihil melengkung (homing + goyangan) =====
  for (let i = boltNihil.length - 1; i >= 0; i--) {
    const b = boltNihil[i];
    b.px = b.x;
    b.py = b.y;
    b.t += dt;
    b.life -= dt;
    if (b.life <= 0 || b.x < -10 || b.x > WORLD_W + 10 || b.y < -10 || b.y > WORLD_H + 10) {
      boltNihil.splice(i, 1);
      continue;
    }

    let vx, vy;
    if (b.aim && b.aim.hp > 0) {
      // Homing dengan laju belok terbatas: peluru MELENGKUNG ke sasaran,
      // tidak menyetir instan apalagi ngorbit karena tidak ada goyangan
      // tegak lurus arah terbang.
      const sudutKaki = Math.atan2(b.dy, b.dx);
      const ingin = Math.atan2(b.aim.y - b.y, b.aim.x - b.x);
      let selisih = ingin - sudutKaki;
      while (selisih > Math.PI) selisih -= Math.PI * 2;
      while (selisih < -Math.PI) selisih += Math.PI * 2;
      const TURN = 6.8; // rad/dtk -> busur melengkung yang wajar
      let belok = Math.max(-TURN * dt, Math.min(TURN * dt, selisih));
      // goyangan kecil ROTASIONAL (menggeliat halus di arah terbang,
      // sudutnya tidak menumpuk jadi tidak pernah memutar di sekitar target)
      belok += Math.sin(b.t * 10 + b.wob) * 0.09 * dt * 6;
      const sudutBaru = sudutKaki + belok;
      b.dx = Math.cos(sudutBaru);
      b.dy = Math.sin(sudutBaru);
      vx = b.dx * b.laju;
      vy = b.dy * b.laju;
    } else {
      b.aim = null;
      vx = b.dx * b.laju;
      vy = b.dy * b.laju;
    }
    b.x += vx * dt;
    b.y += vy * dt;

    if (Math.random() < 0.85) {
      particles.push({
        x: b.x,
        y: b.y,
        vx: (Math.random() - 0.5) * 46,
        vy: (Math.random() - 0.5) * 46,
        life: 0.22 + Math.random() * 0.18,
        t: 0,
        size: 3 + Math.random() * 4,
        color: Math.random() < 0.5 ? "#a855f7" : "#c084fc"
      });
    }

    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (e.hp <= 0) continue;
      if (segDist(b.px, b.py, b.x, b.y, e.x, e.y) < e.r + 10) {
        let dmg = player.damage || karakter.damage;
        if (Math.random() < (player.crit || 0)) {
          dmg *= 2;
          spawnDamage(e.x, e.y - e.r - 40, "KRITIS", "#fbbf24");
        }
        const dmgPasar = applyDamageMusuh(e, dmg);
        e.hitFlash = 0.1;
        parrySerigala(e);
        sfxKena();
        spawnParticles(e.x, e.y, "#c084fc", 10);
        spawnDamage(e.x, e.y - e.r - 16, dmgPasar, "#e9d5ff");
        serapanDarah(dmgPasar);
        boltNihil.splice(i, 1);
        if (e.hp <= 0) killEnemy(e);
        break;
      }
    }
  }

  // ===== VOIZ: UMBRA (terkunci 2 detik, bisa KEMUDI dengan pointer, BERAT) =====
  for (let i = nullLasers.length - 1; i >= 0; i--) {
    const L = nullLasers[i];
    L.t += dt;
    L.life -= dt;
    if (L.life <= 0) { nullLasers.splice(i, 1); continue; }

    // asal di UJUNG TONGKAT (mengikuti player saat terkunci, tidak bergerak)
    L.x = player.x + Math.cos(L.a) * (L.tip || 0);
    L.y = player.y + Math.sin(L.a) * (L.tip || 0);

    // KEMUDI pointer dengan kecepatan sudut (berat/ada momentum), bukan snap.
    // Kecepatan sudut dipercepat ke arah target lalu melambat karena gesekan.
    const MAXAV = 1.9;   // rad/dtk, batas belok (lebih berat = lebih lambat)
    const AKSEL = 14;    // rad/dtk^2, inersia diawal gerak (besar -> kaku)
    const GESEK = 1.6;   // redaman momentum (kecil -> meluncur, terasa berat)
    const targetA = arahMaus();
    let da = targetA - L.a;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    if (typeof L.rav !== "number") L.rav = 0;
    if (da > 0.02 && L.rav < MAXAV) L.rav += AKSEL * dt;
    else if (da < -0.02 && L.rav > -MAXAV) L.rav -= AKSEL * dt;
    L.rav = Math.max(-MAXAV, Math.min(MAXAV, L.rav));
    L.rav *= Math.max(0, 1 - GESEK * dt);
    L.a += L.rav * dt;

    L.dx = Math.cos(L.a);
    L.dy = Math.sin(L.a);
    const pjg = 950;
    const ex = L.x + L.dx * pjg;
    const ey = L.y + L.dy * pjg;
    if (!L.jejak) L.jejak = [];
    L.jejak.push({ x: ex, y: ey });
    if (L.jejak.length > 10) L.jejak.shift();

    if (!L.tick) L.tick = {};
    for (const e of enemies) {
      if (e.hp <= 0) continue;
      const d = segDist(L.x, L.y, ex, ey, e.x, e.y);
      if (d < e.r + 40) {
        const tTerakhir = L.tick[e] || -1;
        if (L.t - tTerakhir >= 0.16) {
          L.tick[e] = L.t;
          let dmg = Math.round(34 * (typeof pengaliElement === "function" ? pengaliElement(karakter.kunci) : 1));
          const dmgPasar = applyDamageMusuh(e, dmg);
          e.hitFlash = 0.12;
          parrySerigala(e);
          sfxKena();
          spawnParticles(e.x, e.y, "#c084fc", 6);
          spawnDamage(e.x, e.y - e.r - 16, dmgPasar, "#e9d5ff");
          serapanDarah(dmgPasar);
          if (e.hp <= 0) killEnemy(e);
        }
      }
    }

    if (Math.random() < 0.9) {
      const tt = Math.random();
      particles.push({
        x: L.x + L.dx * pjg * tt,
        y: L.y + L.dy * pjg * tt,
        vx: (Math.random() - 0.5) * 34,
        vy: (Math.random() - 0.5) * 34,
        life: 0.18 + Math.random() * 0.12,
        t: 0,
        size: 3 + Math.random() * 5,
        color: Math.random() < 0.5 ? "#7c3aed" : "#a855f7"
      });
    }
  }

  // ===== VOIZ: PRISM — tautan sihir memudar cepat =====
  for (let i = prismPulsa.length - 1; i >= 0; i--) {
    const p = prismPulsa[i];
    p.t += dt;
    p.life -= dt;
    if (p.life <= 0) prismPulsa.splice(i, 1);
  }

  // ===== VOIZ: bola void DILEMPAR dari ujung tongkat =====
  for (let i = voidOrbs.length - 1; i >= 0; i--) {
    const ob = voidOrbs[i];
    ob.t += dt;
    const dx = ob.tx - ob.x;
    const dy = ob.ty - ob.y;
    const d = Math.hypot(dx, dy) || 1;
    const step = ob.laju * dt;
    if (d <= step) {
      ob.x = ob.tx;
      ob.y = ob.ty;
      blackholes.push({
        x: ob.x,
        y: ob.y,
        t: 0,
        tick: 0,
        TUMBUH: 4.2,
        SUSUT: 0.8,
        life: 5.0,
        R0: 46,
        R1: 340,
        dmgT: 0.25,
        seed: Math.random() * 100
      });
      spawnParticles(ob.x, ob.y, "#7c3aed", 30);
      rings.push({ x: ob.x, y: ob.y, r: 20, maxR: 130, life: 0.45, t: 0 });
      voidOrbs.splice(i, 1);
      continue;
    }
    ob.x += (dx / d) * step;
    ob.y += (dy / d) * step;
    if (Math.random() < 0.75) {
      particles.push({
        x: ob.x + (Math.random() - 0.5) * 14,
        y: ob.y + (Math.random() - 0.5) * 14,
        vx: (Math.random() - 0.5) * 70,
        vy: (Math.random() - 0.5) * 70,
        life: 0.25 + Math.random() * 0.15,
        t: 0,
        size: 2.5 + Math.random() * 3.5,
        color: Math.random() < 0.5 ? "#7c3aed" : "#a855f7"
      });
    }
  }

  // ===== VOIZ: BLACKHOLE ultimate (membesar -> menghisap -> menyusut) =====
  for (let i = blackholes.length - 1; i >= 0; i--) {
    const bh = blackholes[i];
    bh.t += dt;
    bh.tick += dt;
    if (bh.t < bh.TUMBUH) {
      const u = bh.t / bh.TUMBUH;
      // ease-out: membesar cepat di awal supaya radius hisap cepat menjangkau
      bh.R = bh.R0 + (bh.R1 - bh.R0) * (u * (2 - u));
    } else {
      const su = Math.min(1, (bh.t - bh.TUMBUH) / bh.SUSUT);
      bh.R = bh.R1 * (1 - su * su);
      if (bh.t >= bh.life) { blackholes.splice(i, 1); continue; }
    }

    if (bh.R > 4) {
      // radius hisap LEBIH LUAS dari visual lubangnya: musuh tersedot masuk
      const grab = Math.max(230, bh.R * 2.4);
      for (const e of enemies) {
        if (e.hp <= 0 || e.bosKematian) continue;
        const dx = bh.x - e.x;
        const dy = bh.y - e.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < grab) {
          const uu = d / grab;
          const kuat = 1 - uu;
          const mv = (e.bos ? 190 : 900) * kuat * (bh.t < bh.TUMBUH ? 1 : 0.6);
          e.x += (dx / d) * mv * dt;
          e.y += (dy / d) * mv * dt;
          e.x = Math.max(e.r, Math.min(WORLD_W - e.r, e.x));
          e.y = Math.max(e.r, Math.min(WORLD_H - e.r, e.y));
        }
      }

      while (bh.tick >= bh.dmgT) {
        bh.tick -= bh.dmgT;
        for (const e of enemies) {
          if (e.hp <= 0) continue;
          const d = dist(e.x, e.y, bh.x, bh.y);
          if (d < bh.R) {
            let dmg = Math.round((karakter.specialDmg || 55) * (typeof pengaliElement === "function" ? pengaliElement(karakter.kunci) : 1));
            const dmgPasar = applyDamageMusuh(e, dmg);
            e.hitFlash = 0.1;
            parrySerigala(e);
            sfxKena();
            spawnDamage(e.x, e.y - e.r - 16, dmgPasar, "#e9d5ff");
            serapanDarah(dmgPasar);
            particles.push({
              x: e.x + (bh.x - e.x) * Math.random() * 0.4,
              y: e.y + (bh.y - e.y) * Math.random() * 0.4,
              vx: (Math.random() - 0.5) * 40,
              vy: (Math.random() - 0.5) * 40,
              life: 0.3 + Math.random() * 0.2,
              t: 0,
              size: 3 + Math.random() * 4,
              color: Math.random() < 0.5 ? "#7c3aed" : "#c084fc"
            });
            if (e.hp <= 0) killEnemy(e);
          }
        }
      }
    }

    if (Math.random() < 0.8) {
      const a = Math.random() * Math.PI * 2;
      const rr = Math.random() * bh.R;
      particles.push({
        x: bh.x + Math.cos(a) * rr,
        y: bh.y + Math.sin(a) * rr,
        vx: Math.cos(a + Math.PI / 2) * 54 * (rr / (bh.R || 1)),
        vy: Math.sin(a + Math.PI / 2) * 54 * (rr / (bh.R || 1)),
        life: 0.45 + Math.random() * 0.35,
        t: 0,
        size: 3 + Math.random() * 5,
        color: "#a78bfa"
      });
    }
  }

  for (let s = slashes.length - 1; s >= 0; s--) {
    const sl = slashes[s];
    sl.t += dt;

    if (sl.laju) {
      // tebasan melaju: pusat tebasan ikut maju (badan pemain diam)
      const v = (sl.tebal && !sl.hantamBarier) ? sl.laju * Math.max(0, 1 - sl.t / sl.life) : sl.laju;
      sl.x += Math.cos(sl.angle) * v * dt;
      sl.y += Math.sin(sl.angle) * v * dt;
      if (sl.tebal) {
        if (!sl.jejak) sl.jejak = [];
        sl.jejak.push({ x: sl.x + Math.cos(sl.angle) * sl.reach, y: sl.y + Math.sin(sl.angle) * sl.reach });
        if (sl.jejak.length > 16) sl.jejak.shift();
      }
    }

    if (sl.skill) {
      const geserWaktu = sl.gambar || sl.life;
      const uu = Math.max(0, Math.min(1, sl.t / geserWaktu));
      let u1, u2;
      if (sl.tebal) {
        // bilah beku di busur penuh: api menubar di seluruh area busur itu
        u1 = sl.angle - sl.halfArc;
        u2 = sl.angle + sl.halfArc;
      } else if (uu < 0.5) {
        u1 = sl.angle - sl.halfArc;
        u2 = u1 + sl.halfArc * 4 * uu;
      } else {
        u1 = sl.angle - sl.halfArc + sl.halfArc * 4 * (uu - 0.5);
        u2 = sl.angle + sl.halfArc;
      }
      const sp0 = sl.tebal ? 40 : 90;
      const sp1 = sl.tebal ? 150 : 260;
      const titik = sl.tebal ? 7 : 5;
      for (let i = 0; i < titik; i++) {
        const fracA = titik === 1 ? 0 : i / (titik - 1);
        const cnt = sl.tebal ? 4 : (fracA === 0.5 ? 10 : 5 + (i % 2) * 3);
        const a = u1 + (u2 - u1) * fracA;
        // tebal: api tersebar di seluruh lebar bilah -> area yang dilintasi
        const rad = sl.reach + (sl.tebal ? (Math.random() - 0.5) * sl.tebal * 34 : 0);
        const fx = sl.x + Math.cos(a) * rad;
        const fy = sl.y + Math.sin(a) * rad;
        for (let k = 0; k < cnt; k++) {
          const ang = Math.random() * Math.PI * 2;
          const sp = sp0 + Math.random() * sp1;
          particles.push({
            x: fx,
            y: fy,
            vx: Math.cos(ang) * sp,
            vy: Math.sin(ang) * sp - 35,
            life: sl.tebal ? 0.16 + Math.random() * 0.18 : 0.32 + Math.random() * 0.3,
            t: 0,
            size: sl.tebal ? 5 + Math.random() * 8 : 7 + Math.random() * 9,
            color: Math.random() < 0.5 ? "#ff8c3f" : "#ffd23f"
          });
        }
      }
    }

    for (const e of enemies) {
      if (sl.hit.has(e)) continue;
      const d = dist(sl.x, sl.y, e.x, e.y);
      const angleToEnemy = Math.atan2(e.y - sl.y, e.x - sl.x);
      let diff = sl.angle - angleToEnemy;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (d < sl.reach + e.r && Math.abs(diff) < sl.halfArc + 0.2) {
        sl.hit.add(e);
        let dmg = sl.dmg || player.damage || karakter.damage;
        if (sl.skill && typeof pengaliElement === "function") {
          dmg *= pengaliElement(karakter.kunci);
        }
        if (!sl.dmg && Math.random() < (player.crit || 0)) {
          dmg *= 2;
          spawnDamage(e.x, e.y - e.r - 40, "KRITIS", "#fbbf24");
        }
        const dmgSlash = applyDamageMusuh(e, dmg);
        e.hitFlash = 0.1;
        spawnDamage(e.x, e.y - e.r - 8, dmgSlash, "#ffd23f");
        serapanDarah(dmgSlash);
        parrySerigala(e);

        if (sl.skill && e.hp > 0) {
          e.burn = { durasi: player.burnDurasi || 3, tick: 0.25, timer: 0, dmg: sl.apiBesar || sl.burst ? 2 : 1 };
          spawnDamage(e.x, e.y - e.r - 56, "TERBAKAR", "#ff8c3f");
        }
        if (e.bos) {
          // Bos berat: tidak terpental, tapi tetap bisa terbakar / knockback kecil.
          e.x += Math.cos(sl.angle) * 10;
          e.y += Math.sin(sl.angle) * 10;
        } else {
          e.x += Math.cos(sl.angle) * 60;
          e.y += Math.sin(sl.angle) * 60;
        }
        spawnParticles(e.x, e.y, "#ff8c3f", 8);
        if (e.hp <= 0) killEnemy(e);
      }
    }
    if (sl.t >= sl.life) slashes.splice(s, 1);
  }

  // ===== INFERNO: hantam barier -> ledakan api =====
  function ledakanBarier(sl, ex, ey) {
    kipasLedak.push({ x: ex, y: ey, angle: sl.angle, r: 26, maksR: 230, gambar: 0.2, life: 0.52, t: 0 });
    kipasLedak.push({ x: ex, y: ey, angle: sl.angle, r: 14, maksR: 150, gambar: 0.14, life: 0.4, t: 0 });
    spawnParticles(ex, ey, "#ff8c3f", 26);
    spawnParticles(ex, ey, "#ffd23f", 20);
    spawnParticles(ex, ey, "#fff3c4", 12);
    addFlash("rgba(255, 140, 60, 0.4)", 0.5, 0.3);
    shake = Math.max(shake, 0.75);
    sfxApiLapis("jurus-vender-api");
    for (const e of enemies) {
      if (Math.hypot(e.x - ex, e.y - ey) > 130 + e.r) continue;
      const dmg = applyDamageMusuh(e, 60);
      e.hitFlash = 0.1;
      e.burn = { durasi: player.burnDurasi || 3, tick: 0.25, timer: 0, dmg: 2 };
      spawnDamage(e.x, e.y - e.r - 16, dmg, "#ffd23f");
      spawnDamage(e.x, e.y - e.r - 56, "TERBAKAR", "#ff8c3f");
      serapanDarah(dmg);
      parrySerigala(e);
      if (e.hp <= 0) killEnemy(e);
    }
  }

  for (let s = slashes.length - 1; s >= 0; s--) {
    const sl = slashes[s];
    if (!sl.hantamBarier || sl.pecah) continue;
    const tx = sl.x + Math.cos(sl.angle) * sl.reach;
    const ty = sl.y + Math.sin(sl.angle) * sl.reach;
    if (!tesLingkaran(tx, ty, 20) && !tesLingkaran(sl.x, sl.y, 16)) continue;
    sl.pecah = true;
    ledakanBarier(sl, tx, ty);
    slashes.splice(s, 1);
  }

  for (let i = kipasLedak.length - 1; i >= 0; i--) {
    const k = kipasLedak[i];
    k.t += dt;
    if (k.t >= k.life) kipasLedak.splice(i, 1);
  }

  // ===== FROZFALL: panah beku naik -> pecah -> hujani musuh terdekat =====
  // tiap musuh di daftar dapat tepat 3 anak panah, dibagi rata antar peluncur
  for (let i = panahEs.length - 1; i >= 0; i--) {
    const p = panahEs[i];
    p.t += dt;
    p.life -= dt;
    if (p.life <= 0) { panahEs.splice(i, 1); continue; }

    if (p.fase === "naik") {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (Math.random() < 0.5) {
        particles.push({
          x: p.x + (Math.random() - 0.5) * 8, y: p.y + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 60, vy: 40 + Math.random() * 70,
          life: 0.18 + Math.random() * 0.14, t: 0, size: 4 + Math.random() * 5,
          color: Math.random() < 0.5 ? "#7dd3fc" : "#e0f2fe"
        });
      }
      // PANAH NAIK cepat: pecah begitu sampai puncak / keluar arena
      if (p.y <= 40 || p.t > 0.55) {
        // hanya musuh yang masih hidup yang jadi sasaran
        const hidup = [];
        for (const e of (p.daftar || [])) if (e && e.hp > 0) hidup.push(e);
        if (hidup.length === 0) { panahEs.splice(i, 1); continue; }
        const len = Math.min(6, hidup.length);
        const totalAnak = len * 3;
        for (let w = 0; w < 3; w++) {
          const slot = p.no + w * p.total;
          if (slot >= totalAnak) break;
          const e = hidup[slot % len];
          panahEs.push({
            x: p.x + (Math.random() - 0.5) * 30,
            y: p.y - 10,
            vx: (Math.random() - 0.5) * 70,
            vy: 70,
            t: 0,
            life: 2.4,
            fase: "turun",
            kids: 1,
            aim: e,
            laju: 260,
            hit: new Set(),
            telat: w * 0.18 + p.no * 0.04
          });
        }
        panahEs.splice(i, 1);
        spawnParticles(p.x, p.y, "#7dd3fc", 12);
        sfxBeku();
      }
      continue;
    }

    // Fase turun: AUTO AIM - arahkan lurus ke sasaran, pasti kena
    if (p.telat > 0) { p.telat -= dt; continue; }
    const lajuMax = 1500;
    if (p.aim && p.aim.hp > 0) {
      p.laju = Math.min(lajuMax, (p.laju || 260) + 2600 * dt);
      const dx = p.aim.x - p.x, dy = p.aim.y - p.y;
      const l = Math.hypot(dx, dy) || 1;
      p.vx = (dx / l) * p.laju;
      p.vy = (dy / l) * p.laju;
    } else {
      // sasaran sudah mati: jatuh bebas
      p.aim = null;
      p.vy = Math.min(lajuMax, p.vy + 2100 * dt);
      p.vx *= 0.99;
    }
    const px = p.x, py = p.y;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // auto aim: hanya sasaran yang bisa terkena, jadi tidak pernah "salah kena"
    const sasaran = p.aim && p.aim.hp > 0 ? p.aim : null;
    if (sasaran) {
      const dx = p.x - px, dy = p.y - py;
      const l2 = dx * dx + dy * dy;
      let t = 0;
      if (l2 > 0) t = Math.max(0, Math.min(1, ((sasaran.x - px) * dx + (sasaran.y - py) * dy) / l2));
      const cx = px + dx * t, cy = py + dy * t;
      if (Math.hypot(sasaran.x - cx, sasaran.y - cy) <= sasaran.r + 14) {
        // damage sama persis dengan panah beku FROSTBITE
        let dmg = player.damage || karakter.damage;
        if (Math.random() < (player.crit || 0)) {
          dmg *= 2;
          spawnDamage(sasaran.x, sasaran.y - sasaran.r - 40, "KRITIS", "#fbbf24");
        }
        const dmgPasar = applyDamageMusuh(sasaran, dmg);
        sasaran.hitFlash = 0.1;
        sasaran.freeze = player.bekuDurasi || karakter.bekuDurasi;
        parrySerigala(sasaran);
        sfxKena();
        sfxBeku();
        spawnParticles(sasaran.x, sasaran.y, "#7dd3fc", 10);
        spawnDamage(sasaran.x, sasaran.y - sasaran.r - 16, dmgPasar, "#ffd23f");
        spawnDamage(sasaran.x, sasaran.y - sasaran.r - 56, "BEKU", "#7dd3fc");
        serapanDarah(dmgPasar);
        if (sasaran.hp <= 0) killEnemy(sasaran);
        panahEs.splice(i, 1);
        shake = Math.max(shake, 0.2);
        continue;
      }
    }
    if (p.y > WORLD_H - 4 || p.x < -20 || p.x > WORLD_W + 20) {
      panahEs.splice(i, 1);
      spawnParticles(Math.max(0, Math.min(WORLD_W, p.x)), Math.min(WORLD_H - 6, p.y), "#7dd3fc", 6);
    }
  }

  for (let i = fires.length - 1; i >= 0; i--) {
    const fl = fires[i];
    fl.t += dt;
    fl.spark -= dt;
    if (fl.spark <= 0) {
      fl.spark = 0.06 + Math.random() * 0.1;
      particles.push({
        x: fl.x + (Math.random() - 0.5) * fl.radius * 1.4,
        y: fl.y + (Math.random() - 0.5) * fl.radius,
        vx: (Math.random() - 0.5) * 60,
        vy: -80 - Math.random() * 120,
        life: 0.35 + Math.random() * 0.3,
        t: 0,
        size: 6 + Math.random() * 8,
        color: Math.random() < 0.5 ? "#ff8c3f" : "#ffd23f"
      });
    }

    for (const e of enemies) {
      if (!e.burn && dist(fl.x, fl.y, e.x, e.y) < fl.radius * 0.8 + e.r) {
        e.burn = { durasi: player.burnDurasi || 3, tick: 0.25, timer: 0, dmg: 1 };
        spawnDamage(e.x, e.y - e.r - 56, "TERBAKAR", "#ff8c3f");
        spawnParticles(e.x, e.y, "#ff8c3f", 6);
      }
    }
    if (fl.t >= fl.life) fires.splice(i, 1);
  }

  for (let i = freezes.length - 1; i >= 0; i--) {
    const fz = freezes[i];
    fz.t += dt;
    const effLen = Math.min(fz.length, fz.reveal);
    for (const e of enemies) {
      const dx = e.x - fz.x0;
      const dy = e.y - fz.y0;
      const seg = dx * fz.nx + dy * fz.ny;
      if (seg > -20 && seg < effLen + 20) {
        const off = dx * fz.px + dy * fz.py;
        if (Math.abs(off) < fz.half + e.r) {
          const sisa = fz.life - fz.t;
          if (sisa > (e.freeze || 0)) {
            e.freeze = sisa;
            spawnDamage(e.x, e.y - e.r - 56, "BEKU", "#7dd3fc");
            spawnParticles(e.x, e.y, "#bfe9ff", 6);
          }
        }
      }
    }
    if (fz.t >= fz.life) freezes.splice(i, 1);
  }

  if (levelSpawn < LEVELS[level].jumlah) {
    spawnTimer -= dt;
    if (bossIntro) {

    } else if (spawnTimer <= 0) {
      if (LEVELS[level].bos) {

        mulaiIntroBoss();
      } else {
        spawnEnemy();
        levelSpawn += 1;
        spawnTimer = LEVELS[level].jedaSpawn;
      }
    }
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.hitFlash = Math.max(0, e.hitFlash - dt);
    e.freeze = Math.max(0, (e.freeze || 0) - dt);
    e.paralyze = Math.max(0, (e.paralyze || 0) - dt);
    e.contactCd = Math.max(0, (e.contactCd || 0) - dt);

    if (e.burn) {
      e.burn.timer += dt;
      while (e.burn.timer >= e.burn.tick) {
        e.burn.timer -= e.burn.tick;
        const dmgBakar = applyDamageMusuh(e, e.burn.dmg);
        e.hitFlash = 0.1;
        spawnDamage(e.x, e.y - e.r - 16, dmgBakar, "#ff8c3f");
        parrySerigala(e);
      }
      e.burn.durasi -= dt;
      if (e.burn.durasi <= 0) e.burn = null;
      if (e.hp <= 0) {
        killEnemy(e);
        continue;
      }
    }

    if (e.bosKematian) {
      updateBosKematian(e, dt);
      continue;
    }

    if (e.freeze <= 0 && (e.paralyze || 0) <= 0) {
      const angle = Math.atan2(player.y - e.y, player.x - e.x);
      let spd = e.speed;

      if (player.kartu && player.kartu.freezeArea
          && dist(e.x, e.y, player.x, player.y) < 120 + (player.kartu.freezeArea - 1) * 20) {
        spd *= Math.max(0.25, Math.pow(0.7, player.kartu.freezeArea));
      }

      if (e.tipe === "serigala") {
        if (e.lahirT > 0) {
          e.lahirT -= dt;
          spd *= 0.55;
        } else if (e.mundurT > 0) {

          e.mundurT -= dt;
          spd *= -1.4;
        } else if (e.lungeBersiap > 0) {

          e.lungeBersiap -= dt;
          spd *= 0.3;
        } else if (e.lungeT > 0) {

          e.lungeT -= dt;
          spd *= 2.4;
        } else {
          e.lungeCd -= dt;
          if (e.lungeCd <= 0) {
            const jd = dist(e.x, e.y, player.x, player.y);
            if (jd < 260) {
              e.lungeBersiap = 0.5;
              e.lungeT = 0.5;
              e.lungeCd = 3.8 + Math.random() * 0.9;
            } else {
              e.lungeCd = 0.4;
            }
          }
        }
      }

      if (e.tipe === "bos") {
        const g = updateBos(e, dt);
        spd = g.spd;
        e.bosAng = g.ang;
      }
      const angGerak = (e.tipe === "bos" && e.bosAng !== null && e.bosAng !== undefined)
        ? e.bosAng : angle;
      const mvx = Math.cos(angGerak) * spd * dt;
      const mvy = Math.sin(angGerak) * spd * dt;

      if (e.tipe === "jamur") {
        const jd = dist(e.x, e.y, player.x, player.y);

        if (jd < 170) {
          e.x -= Math.cos(angle) * e.speed * 0.8 * dt;
          e.y -= Math.sin(angle) * e.speed * 0.8 * dt;
        }
        e.cd -= dt;
        if (e.cd <= 0 && jd < 520) {
          e.cd = 2.4 + Math.random() * 1.2;

          const sp = 150 + Math.random() * 60;
          enemyShots.push({
            x: e.x, y: e.y,
            vx: Math.cos(angle) * sp,
            vy: Math.sin(angle) * sp,
            life: 3, r: 9, dmg: 10
          });
          spawnParticles(e.x, e.y, "#a3e635", 6);
        }
      }

      if (e.tipe === "semak") {
        e.cd -= dt;
        if (e.cd <= 0) {
          e.cd = 6 + Math.random() * 2;
          if (hazards.length < 12) {
            const hsx = player.x + (Math.random() - 0.5) * 200;
            const hsy = player.y + (Math.random() - 0.5) * 200;
            hazards.push({
              x: hsx, y: hsy, r: 64, life: 4.5, t: 0
            });
            spawnParticles(hsx, hsy, "#4ade80", 10);
          }
        }
      }

      const majuX = !tesLingkaran(e.x + mvx, e.y, e.r);
      const majuY = !tesLingkaran(e.x, e.y + mvy, e.r);
      e.sangkutT = (majuX || majuY) ? 0 : (e.sangkutT || 0) + dt;
      if (e.sangkutT >= 0.85) {
        const pos = titikSpawnAman(e.r);
        if (pos) { e.x = pos.x; e.y = pos.y; }
        e.sangkutT = 0;
      } else {
        if (majuX) e.x += mvx;
        if (majuY) e.y += mvy;
      }
    } else {
      e.sangkutT = 0;
    }

    if (dist(e.x, e.y, player.x, player.y) < e.r + 32 && player.invuln <= 0 && (e.bos ? e.contactCd <= 0 : true)) {
      const faseBos = e.bos ? e.bosDef.fase[e.fase] : null;
      const dmgMasuk = e.bos
        ? Math.round(faseBos.dmgKontak * (1 - (player.armor || 0)))
        : Math.round(20 * (1 - (player.armor || 0)));
      player.hp -= dmgMasuk;
      player.hitFlash = 0.15;
      spawnDamage(player.x, player.y - 52, dmgMasuk, e.bos ? faseBos.warnaBar : "#ff4d4d");
      sfxPemainKena();
      hurtVig = 0.9;
      shake = e.bos ? 0.6 : 0.3;
      if (e.bos) e.contactCd = 0.6;

      if (player.kartu && player.kartu.duriBalik) {
        const reflek = Math.round(dmgMasuk * 0.15);
        applyDamageMusuh(e, reflek);
        spawnDamage(e.x, e.y - e.r - 40, reflek, "#fb7185");
        spawnParticles(e.x, e.y, "#fb7185", 8);
        if (e.hp <= 0) killEnemy(e);
        else if (!e.bos) enemies.splice(i, 1);
      } else if (!e.bos) {
        enemies.splice(i, 1);
      }
      spawnParticles(player.x, player.y, "#3aa0ff", 10);
      if (player.hp <= 0) prosesKematianPemain();
    }
  }

  if (levelSpawn >= LEVELS[level].jumlah && enemies.length === 0) {
    levelSelesai();
  }

  for (let i = enemyShots.length - 1; i >= 0; i--) {
    const s = enemyShots[i];
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.life -= dt;
    if (s.life <= 0 || s.x < -20 || s.x > WORLD_W + 20 || s.y < -20 || s.y > WORLD_H + 20) {
      enemyShots.splice(i, 1);
      continue;
    }
    if (!player.invuln && dist(s.x, s.y, player.x, player.y) < s.r + player.r) {
      const dmgMasuk = Math.round(s.dmg * (1 - (player.armor || 0)));
      const wSh = s.warna || "#a3e635";
      player.hp -= dmgMasuk;
      player.hitFlash = 0.15;
      spawnDamage(player.x, player.y - 52, dmgMasuk, wSh);
      sfxPemainKena();
      hurtVig = 0.7;
      enemyShots.splice(i, 1);
      spawnParticles(player.x, player.y, wSh, 10);
      if (player.hp <= 0) prosesKematianPemain();
    }
  }

  let berdiriDuri = false;
  for (let i = hazards.length - 1; i >= 0; i--) {
    const hz = hazards[i];
    hz.t += dt;
    if (hz.dmg) hz.cd = Math.max(0, (hz.cd || 0) - dt);
    if (hz.t >= hz.life) {
      hazards.splice(i, 1);
      continue;
    }
    for (const e of enemies) if (e.tipe === "semak" && Math.random() < 0.15) {
      spawnParticles(hz.x + (Math.random() - 0.5) * hz.r * 1.6, hz.y + (Math.random() - 0.5) * hz.r * 1.6, "#4ade80", 1);
    }
    if (hz.t < hz.life && !player.invuln && hz.dmg && hz.cd <= 0
        && dist(hz.x, hz.y, player.x, player.y) < hz.r + player.r) {
      // Jejak charge bos / hazard yang punya damage sendiri (ada cooldown).
      hz.cd = 0.7;
      player.hp -= hz.dmg;
      player.hitFlash = 0.15;
      spawnDamage(player.x, player.y - 52, hz.dmg, hz.warna || "#ef4444");
      sfxPemainKena();
      hurtVig = 0.8;
      shake = 0.25;
      spawnParticles(player.x, player.y, hz.warna || "#ef4444", 8);
      if (player.hp <= 0) prosesKematianPemain();
    } else if (hz.t < hz.life && !hz.dmg && !player.invuln
               && dist(hz.x, hz.y, player.x, player.y) < hz.r + player.r) {
      berdiriDuri = true;
    }
  }
  if (berdiriDuri) {
    player.racunTick = (player.racunTick || 0) + dt;
    if (player.racunTick >= 0.25) {
      player.racunTick -= 0.25;
      player.hp -= 1;
      player.hitFlash = 0.12;
      spawnDamage(player.x, player.y - 52, 1, "#4ade80");
      sfxPemainKena();
      hurtVig = 0.25;
      if (player.hp <= 0) prosesKematianPemain();
    }
  } else {
    player.racunTick = 0;
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.t >= p.life) particles.splice(i, 1);
  }

  for (let i = deathPixels.length - 1; i >= 0; i--) {
    const dp = deathPixels[i];
    dp.t += dt;
    dp.x += dp.vx * dt;
    dp.y += dp.vy * dt;
    dp.vy += dp.grav * dt;
    dp.vx *= 0.98;
    if (dp.t >= dp.life) deathPixels.splice(i, 1);
  }

  if (player) player.hitFlash = Math.max(0, (player.hitFlash || 0) - dt);

  for (let i = flashes.length - 1; i >= 0; i--) {
    flashes[i].t += dt;
    if (flashes[i].t >= flashes[i].life) flashes.splice(i, 1);
  }
  hurtVig = Math.max(0, hurtVig - dt * 1.4);

  for (let i = damages.length - 1; i >= 0; i--) {
    const dm = damages[i];
    dm.t += dt;
    dm.y -= 60 * dt;
    if (dm.t >= dm.life) damages.splice(i, 1);
  }

  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i];
    r.t += dt;
    r.r = 20 + (r.maxR - 20) * (r.t / r.life);
    if (r.t >= r.life) rings.splice(i, 1);
  }

  for (let i = souls.length - 1; i >= 0; i--) {
    const s = souls[i];
    s.t += dt;
    const d = dist(s.x, s.y, player.x, player.y);
    if (d < 180) {
      const ang = Math.atan2(player.y - s.y, player.x - s.x);
      s.vx += Math.cos(ang) * 600 * dt;
      s.vy += Math.sin(ang) * 600 * dt;
    } else {
      s.vx *= 0.96;
      s.vy *= 0.96;
    }
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    if (d < 26) {
      if (soul < SOUL_MAX) {
        const tambah = player.jiwaKali || 1;
        soul = Math.min(SOUL_MAX, soul + tambah);
        sfxSoul();
        spawnParticles(s.x, s.y, "#7cff5e", 4);
      }
      souls.splice(i, 1);
      continue;
    }
    if (s.t >= s.life) souls.splice(i, 1);
  }
}
