function attack() {
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

function titikBossAman() {
  const r = TIPE_MUSUH.bos.r;
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
      const a2 = x - mm.x, b2 = y - mm.y, rr2 = r + mm.r + 6;
      if (a2 * a2 + b2 * b2 < rr2 * rr2) { tabrak = true; break; }
    }
    if (!tabrak) return { x, y };
  }
  return { x: WORLD_W / 2, y: WORLD_H / 2 };
}

function mulaiIntroBoss() {
  const p = titikBossAman();
  bossIntro = { x: p.x, y: p.y, t: 0, durasi: 1.5 };
  spawnTimer = 999;
  if (typeof sfxBoss === "function") sfxBoss();
  spawnParticles(p.x, p.y, "#14532d", 46);
  addFlash("rgba(20, 83, 45, 0.35)", 0.8, 0.5);
  shake = 0.6;
}

function spawnBoss(x, y) {
  const t = TIPE_MUSUH.bos;
  const hp = Math.max(8, Math.round(LEVELS[level].hp * t.hpKali));
  enemies.push({
    x: x,
    y: y,
    tipe: "bos",
    kunci: t.kunci,
    bos: true,
    hp: hp,
    maxHp: hp,
    speed: 150 * t.kecepatanKali,
    r: t.r,
    skala: t.skala,
    warna: t.warna,
    hitFlash: 0,
    freeze: 0,
    contactCd: 0,

    lungeBersiap: 0,
    lungeT: 0,
    lungeCd: 1.2 + Math.random() * 0.8
  });
  levelSpawn = Math.max(levelSpawn, LEVELS[level].jumlah);
  spawnTimer = LEVELS[level].jedaSpawn;
  shake = 0.7;
  addFlash("rgba(74, 222, 128, 0.4)", 1, 0.5);
  rings.push({ x: x, y: y, r: 20, maxR: 200, life: 0.5, t: 0 });
  spawnParticles(x, y, "#14532d", 50);
  spawnParticles(x, y, "#4ade80", 26);
}

function bossSlam(e) {
  shake = 0.9;
  addFlash("rgba(20, 83, 45, 0.28)", 1, 0.35);
  rings.push({ x: e.x, y: e.y, r: 24, maxR: e.r * 2.4, life: 0.45, t: 0 });
  rings.push({ x: e.x, y: e.y, r: 12, maxR: e.r * 1.5, life: 0.3, t: 0 });
  spawnParticles(e.x, e.y, "#365314", 40);
  spawnParticles(e.x, e.y, "#4ade80", 18);
  if (typeof sfxUltimate === "function") sfxUltimate();
  if (player.invuln <= 0 && dist(e.x, e.y, player.x, player.y) < e.r * 2.3) {
    const dmg = Math.round(40 * (1 - (player.armor || 0)));
    player.hp -= dmg;
    player.hitFlash = 0.2;
    spawnDamage(player.x, player.y - 52, dmg, "#4ade80");
    sfxPemainKena();
    hurtVig = 1;
    spawnParticles(player.x, player.y, "#4ade80", 12);
    if (player.hp <= 0) prosesKematianPemain();
  }
}

function killEnemy(e) {
  const i = enemies.indexOf(e);
  if (i === -1) return;

  if (e.bos) {
    shake = 1.2;
    addFlash("rgba(74, 222, 128, 0.5)", 1, 0.6);
    rings.push({ x: e.x, y: e.y, r: 20, maxR: 280, life: 0.7, t: 0 });
    spawnParticles(e.x, e.y, "#4ade80", 55);
    spawnParticles(e.x, e.y, "#14532d", 35);
    if (typeof sfxBoss === "function") sfxBoss();
  }
  koin += Math.round(10 * (player.mult && player.mult.koin || 1));
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
  if (!punyaNyawa && typeof sfxGameOver === "function") sfxGameOver();
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
      spawnBoss(bi.x, bi.y);
    }
  }

  let dx = 0, dy = 0;
  let mvx = 0, mvy = 0;
  if (player.dashT > 0) {

    player.dashT -= dt;
    mvx = Math.cos(player.dashAngle) * DASH_SPEED * dt;
    mvy = Math.sin(player.dashAngle) * DASH_SPEED * dt;
    const dashWarna = karakter && karakter.tipe === "dekat" ? "#ff8c3f" : "#bfe9ff";
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
  } else {
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
      const hit = b.raksasa
        ? segDist(b.px, b.py, b.x, b.y, e.x, e.y) < hitR
        : dist(b.x, b.y, e.x, e.y) < hitR;
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
            e2.hp -= dmg;
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
        e.hp -= dmg;
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

  for (let s = slashes.length - 1; s >= 0; s--) {
    const sl = slashes[s];
    sl.t += dt;

    if (sl.skill) {
      const fullA = sl.halfArc * 2;
      const halfA = sl.life / 2;
      const u1 = sl.t < halfA
        ? sl.angle - sl.halfArc
        : sl.angle - sl.halfArc + fullA * ((sl.t - halfA) / halfA);
      const u2 = sl.t < halfA
        ? sl.angle - sl.halfArc + fullA * (sl.t / halfA)
        : sl.angle + sl.halfArc;
      for (const [fracA, cnt] of [[0, 8], [0.35, 5], [0.5, 10], [0.65, 5], [1, 8]]) {
        const a = u1 + (u2 - u1) * fracA;
        const fx = sl.x + Math.cos(a) * sl.reach;
        const fy = sl.y + Math.sin(a) * sl.reach;
        for (let k = 0; k < cnt; k++) {
          const ang = Math.random() * Math.PI * 2;
          const sp = 90 + Math.random() * 260;
          particles.push({
            x: fx,
            y: fy,
            vx: Math.cos(ang) * sp,
            vy: Math.sin(ang) * sp - 70,
            life: 0.32 + Math.random() * 0.3,
            t: 0,
            size: 7 + Math.random() * 9,
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
        if (!sl.dmg && Math.random() < (player.crit || 0)) {
          dmg *= 2;
          spawnDamage(e.x, e.y - e.r - 40, "KRITIS", "#fbbf24");
        }
        e.hp -= dmg;
        e.hitFlash = 0.1;
        spawnDamage(e.x, e.y - e.r - 8, dmg, "#ffd23f");
        serapanDarah(dmg);
        parrySerigala(e);

        if (sl.skill && e.hp > 0) {
          e.burn = { durasi: player.burnDurasi || 3, tick: 0.25, timer: 0, dmg: sl.burst ? 2 : 1 };
          spawnDamage(e.x, e.y - e.r - 56, "TERBAKAR", "#ff8c3f");
        }
        e.x += Math.cos(sl.angle) * 60;
        e.y += Math.sin(sl.angle) * 60;
        spawnParticles(e.x, e.y, "#ff8c3f", 8);
        if (e.hp <= 0) killEnemy(e);
      }
    }
    if (sl.t >= sl.life) slashes.splice(s, 1);
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
    e.contactCd = Math.max(0, (e.contactCd || 0) - dt);

    if (e.burn) {
      e.burn.timer += dt;
      while (e.burn.timer >= e.burn.tick) {
        e.burn.timer -= e.burn.tick;
        e.hp -= e.burn.dmg;
        e.hitFlash = 0.1;
        spawnDamage(e.x, e.y - e.r - 16, e.burn.dmg, "#ff8c3f");
        parrySerigala(e);
      }
      e.burn.durasi -= dt;
      if (e.burn.durasi <= 0) e.burn = null;
      if (e.hp <= 0) {
        killEnemy(e);
        continue;
      }
    }

    if (e.freeze <= 0) {
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
        const loncatHabis = e.lungeT > 0 && e.lungeT - dt <= 0;
        if (e.lungeBersiap > 0) {
          e.lungeBersiap -= dt;
          spd *= 0.08;
        } else if (e.lungeT > 0) {
          e.lungeT -= dt;
          spd *= 6.2;
        } else {
          e.lungeCd -= dt;
          if (e.lungeCd <= 0) {
            const jd = dist(e.x, e.y, player.x, player.y);
            if (jd < 680) {
              e.lungeBersiap = 0.7;
              e.lungeT = 0.55;
              e.lungeCd = 3.4 + Math.random() * 1.3;

              spawnParticles(player.x, player.y, "#4ade80", 10);
              rings.push({ x: player.x, y: player.y, r: 10, maxR: 46, life: 0.7, t: 0 });
            } else {
              e.lungeCd = 0.45;
            }
          }
        }

        if (loncatHabis) bossSlam(e);
      }
      const mvx = Math.cos(angle) * spd * dt;
      const mvy = Math.sin(angle) * spd * dt;

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
      const dmgMasuk = e.bos
        ? Math.round(45 * (1 - (player.armor || 0)))
        : Math.round(20 * (1 - (player.armor || 0)));
      player.hp -= dmgMasuk;
      player.hitFlash = 0.15;
      spawnDamage(player.x, player.y - 52, dmgMasuk, e.bos ? "#4ade80" : "#ff4d4d");
      sfxPemainKena();
      hurtVig = 0.9;
      shake = e.bos ? 0.6 : 0.3;
      if (e.bos) e.contactCd = 0.6;

      if (player.kartu && player.kartu.duriBalik) {
        const reflek = Math.round(dmgMasuk * 0.15);
        e.hp -= reflek;
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
      player.hp -= dmgMasuk;
      player.hitFlash = 0.15;
      spawnDamage(player.x, player.y - 52, dmgMasuk, "#a3e635");
      sfxPemainKena();
      hurtVig = 0.7;
      enemyShots.splice(i, 1);
      spawnParticles(player.x, player.y, "#a3e635", 10);
      if (player.hp <= 0) prosesKematianPemain();
    }
  }

  let berdiriDuri = false;
  for (let i = hazards.length - 1; i >= 0; i--) {
    const hz = hazards[i];
    hz.t += dt;
    if (hz.t >= hz.life) {
      hazards.splice(i, 1);
      continue;
    }
    for (const e of enemies) if (e.tipe === "semak" && Math.random() < 0.15) {
      spawnParticles(hz.x + (Math.random() - 0.5) * hz.r * 1.6, hz.y + (Math.random() - 0.5) * hz.r * 1.6, "#4ade80", 1);
    }
    if (hz.t < hz.life && !player.invuln && dist(hz.x, hz.y, player.x, player.y) < hz.r + player.r) {
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
