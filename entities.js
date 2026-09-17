// ============================================================
// ENTITIES - aksi pemain, musuh, dan update logika game.
// ============================================================

// ---------- Aksi pemain ----------
function attack() {
  if (karakter.tipe === "dekat") {
    slashSwing();
    return;
  }
  // Mode ultimate Kenzro: panah raksasa langsung meluncur, jeda charge
  // berjalan SETELAH diluncurkan (seperti cooldown).
  if ((player.ultArrows || 0) > 0) {
    if (player.ultCd <= 0) {
      tembakPanahRaksasa(Math.atan2(mouse.y - player.y, mouse.x - player.x));
      player.ultCd = ULT_CHARGE;
    }
    return;
  }
  shoot();
}

// Dash/menghindar: klik kanan, lari cepat + kebal sejenak.
// Warna efek mengikuti karakter (Vender merah api, Kenzro biru es).
function dashLari() {
  if (statusGame !== "main" || !karakter) return;
  if (player.dashStacks <= 0) return;
  player.dashStacks--;
  sfxDash();
  // Setiap penggunaan dash membuat cooldown MANDIRI 2 dtk (tumpuk tetap).
  player.dashTimers.push(DASH_CD);
  player.dashT = DASH_WAKTU;
  player.invuln = DASH_INVULN;
  const dashWarna = karakter && karakter.tipe === "dekat" ? "#ff8c3f" : "#bfe9ff";
  // Arah dash = arah gerak tombol (WASD). Kalau diam, ke arah pointer.
  let dx = 0, dy = 0;
  if (keys["w"] || keys["arrowup"]) dy -= 1;
  if (keys["s"] || keys["arrowdown"]) dy += 1;
  if (keys["a"] || keys["arrowleft"]) dx -= 1;
  if (keys["d"] || keys["arrowright"]) dx += 1;
  player.dashAngle = (dx !== 0 || dy !== 0)
    ? Math.atan2(dy, dx)
    : Math.atan2(mouse.y - player.y, mouse.x - player.x);
  spawnParticles(player.x, player.y, dashWarna, 10);
  rings.push({ x: player.x, y: player.y, r: 28, maxR: 120, life: 0.25, t: 0 });
}

// Lepas satu panah raksasa (langsung, tanpa menunggu charge).
function tembakPanahRaksasa(ang) {
  const speed = 2500;
  sfxPanahRaksasa();
  // Koridor beku pasif: es muncul PERLAHAN mengikuti posisi anak panah —
  // area ter-render seiring panah melintas, lalu menetap selama beberapa detik.
  const nx = Math.cos(ang);
  const ny = Math.sin(ang);
  const px = -ny;
  const py = nx;
  let tExit = 1e9;
  if (nx > 0) tExit = Math.min(tExit, (W + 10 - player.x) / nx);
  if (nx < 0) tExit = Math.min(tExit, (-10 - player.x) / nx);
  if (ny > 0) tExit = Math.min(tExit, (H + 10 - player.y) / ny);
  if (ny < 0) tExit = Math.min(tExit, (-10 - player.y) / ny);
  const koridor = {
    x0: player.x,
    y0: player.y,
    nx: nx,
    ny: ny,
    px: px,
    py: py,
    half: 60, // selebar lintasan hit panah (segDist + jangkauan di update).
    length: tExit + 60,
    reveal: 80, // panjang koridor yang sudah tampak (ikut maju dengan panah)
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
  player.attackCd = karakter.attackRate;
  sfxTembak();
  const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  const speed = 840;
  bullets.push({
    x: player.x,
    y: player.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 2.0,
    // Panah yang ditembakkan saat buff aktif akan membekukan musuh.
    beku: player.specialBuff > 0
  });
  spawnParticles(player.x, player.y, "#ffd23f", 4);
}

function slashSwing() {
  if (player.attackCd > 0) return;
  player.attackCd = karakter.attackRate;
  sfxSabet();
  const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  player.swing = karakter.swingDuration || 0.2;
  // Efek tebasan muncul dari lokasi bilah sabit (titik orbit senjata),
  // bukan dari pusat karakter.
  const ox = player.x + Math.cos(angle) * 70;
  const oy = player.y + Math.sin(angle) * 70;
  slashes.push({
    x: ox,
    y: oy,
    // Terpusat ke arah pointer (bukan frame rotasi sabit).
    angle: angle,
    reach: karakter.reach,
    halfArc: karakter.halfArc,
    t: 0,
    life: karakter.swingDuration || 0.2,
    hit: new Set()
  });
  spawnParticles(ox, oy, "#ffffff", 6);
}

// ---------- Musuh ----------
function spawnEnemy() {
  const def = LEVELS[level];
  const tipe = pilihTipeMusuh(def.campur);
  const t = TIPE_MUSUH[tipe];
  const hp = Math.max(8, Math.round(def.hp * t.hpKali));

  let x, y;
  const edge = Math.floor(Math.random() * 4);
  if (edge === 0) { x = -40; y = Math.random() * H; }
  else if (edge === 1) { x = W + 40; y = Math.random() * H; }
  else if (edge === 2) { x = Math.random() * W; y = -40; }
  else { x = Math.random() * W; y = H + 40; }

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
    freeze: 0
  });
}

function killEnemy(e) {
  const i = enemies.indexOf(e);
  if (i === -1) return;
  score += 10;
  sfxMatMusuh();
  // Jatuhkan jiwa: biasa 3, cepet 2, tank 5.
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

// ---------- Update ----------
function update(dt) {
  // Layar judul / pilih karakter: hanya animasi partikel latar.
  if (statusGame === "title" || statusGame === "select") {
    updateBgPartikel(dt);
    return;
  }

  if (gameOver || statusGame !== "main") return;

  // Banner transisi level (dijeda saat bukan main).
  if (levelBanner) {
    levelBanner.t += dt;
    if (levelBanner.t >= levelBanner.life) levelBanner = null;
  }

  let dx = 0, dy = 0;
  if (player.dashT > 0) {
    // Sedang dash: gerak cepat mengikuti arah, abaikan tombol gerak.
    player.dashT -= dt;
    player.x += Math.cos(player.dashAngle) * DASH_SPEED * dt;
    player.y += Math.sin(player.dashAngle) * DASH_SPEED * dt;
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
    if (keys["w"] || keys["arrowup"]) dy -= 1;
    if (keys["s"] || keys["arrowdown"]) dy += 1;
    if (keys["a"] || keys["arrowleft"]) dx -= 1;
    if (keys["d"] || keys["arrowright"]) dx += 1;
    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      player.x += (dx / len) * player.speed * dt;
      player.y += (dy / len) * player.speed * dt;
      if (dx !== 0) player.dir = dx < 0 ? -1 : 1;
    }
  }

  player.x = Math.max(20, Math.min(W - 20, player.x));
  player.y = Math.max(20, Math.min(H - 20, player.y));

  // Untuk animasi: sedang bergerak (jalan/dash) atau diam (idle).
  player.gerak = player.dashT > 0 || dx !== 0 || dy !== 0;

  player.attackCd -= dt;
  player.specialCd = Math.max(0, player.specialCd - dt);
  player.specialBuff = Math.max(0, (player.specialBuff || 0) - dt);
  player.swing = Math.max(0, (player.swing || 0) - dt);

  // UltCd (Kenzro): jeda/charge SETELAH panah raksasa meluncur.
  player.ultCd = Math.max(0, (player.ultCd || 0) - dt);

  // Dash: tiap charge ber-cooldown MANDIRI. Begitu satu selesai (2 dtk),
  // dash langsung bisa dipakai walau timer lain masih berjalan.
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
  // dashCd = tampilan gabungan sisa waktu semua charge.
  player.dashCd = player.dashTimers.reduce((a, b) => a + b, 0);

  if (mouse.down) {
    attack();
  }

  // Peluru
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.px = b.x;
    b.py = b.y;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.life <= 0 || b.x < -10 || b.x > W + 10 || b.y < -10 || b.y > H + 10) {
      bullets.splice(i, 1);
      continue;
    }
    // Panah raksasa: perluas koridor beku yang ter-render mengikuti jalurnya.
    if (b.raksasa && b.fz) {
      const prog = (b.x - b.fz.x0) * b.fz.nx + (b.y - b.fz.y0) * b.fz.ny + 120;
      if (prog > b.fz.reveal) b.fz.reveal = prog;
    }
    // Panah beku biasa: sisakan pecahan es kecil (jejak singkat).
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
    // Ekor roket panah raksasa: tinggalkan partikel biru muda kecil yang
    // mengambang di area (jalur koridor) yang dilewatinya.
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
      // Hit raksasa: zona besar + cek lintasan (biar tak tembus antar frame).
      const hitR = b.raksasa ? e.r + 60 : e.r + 8;
      const hit = b.raksasa
        ? segDist(b.px, b.py, b.x, b.y, e.x, e.y) < hitR
        : dist(b.x, b.y, e.x, e.y) < hitR;
      if (hit) {
        if (b.raksasa) {
          // Panah raksasa TIDAK hilang: menembus, tiap kena = ledakan es AoE.
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
            sfxBeku();
            spawnParticles(e2.x, e2.y, "#7dd3fc", 10);
            spawnDamage(e2.x, e2.y - e2.r - 56, "BEKU 7D", "#7dd3fc");
            spawnDamage(e2.x, e2.y - e2.r - 16, dmg, "#ffd23f");
            if (e2.hp <= 0) killEnemy(e2);
          }
          rings.push({ x: e.x, y: e.y, r: 24, maxR: 180, life: 0.3, t: 0 });
          rings.push({ x: e.x, y: e.y, r: 12, maxR: 110, life: 0.25, t: 0 });
          break;
        }
        const dmg = karakter.damage;
        e.hp -= dmg;
        e.hitFlash = 0.1;
        sfxKena();
        if (b.beku) {
          e.freeze = karakter.bekuDurasi;
          sfxBeku();
          spawnParticles(e.x, e.y, "#7dd3fc", 8);
          spawnDamage(e.x, e.y - e.r - 56, "BEKU", "#7dd3fc");
        }
        spawnDamage(e.x, e.y - e.r - 16, dmg, "#ffd23f");
        bullets.splice(i, 1);
        if (e.hp <= 0) killEnemy(e);
        break;
      }
    }
  }

  // Ayunan pedang
  for (let s = slashes.length - 1; s >= 0; s--) {
    const sl = slashes[s];
    sl.t += dt;

    // Kobaran api singkat di KEDUA ujung tebasan besar (kosmetik).
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
        const dmg = sl.dmg || karakter.damage;
        e.hp -= dmg;
        e.hitFlash = 0.1;
        spawnDamage(e.x, e.y - e.r - 8, dmg, "#ffd23f");
        // Tebasan besar: musuh yang selamat langsung terbakar 3 dtk.
        if (sl.skill && e.hp > 0) {
          e.burn = { durasi: 3, tick: 0.25, timer: 0, dmg: sl.burst ? 2 : 1 };
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

  // Kobaran api pasif (ultimate Vender): memercik api agar terlihat hidup,
  // membakar musuh yang menyentuhnya, lalu padam setelah 8 dtk.
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
    // Sentuh → terbakar (burn SAMA seperti skill Vender: 3 dtk, tiap 0.25 dtk).
    for (const e of enemies) {
      if (!e.burn && dist(fl.x, fl.y, e.x, e.y) < fl.radius * 0.8 + e.r) {
        e.burn = { durasi: 3, tick: 0.25, timer: 0, dmg: 1 };
        spawnDamage(e.x, e.y - e.r - 56, "TERBAKAR", "#ff8c3f");
        spawnParticles(e.x, e.y, "#ff8c3f", 6);
      }
    }
    if (fl.t >= fl.life) fires.splice(i, 1);
  }

  // Koridor BEKU PASIF (ultimate Kenzro): area yang ter-render perlahan
  // mengikuti anak panah. Musuh yang masuk bagian koridor yang sudah tampak
  // membeku selama koridor masih ada.
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

  // Musuh: spawn mengikuti definisi level sampai kuota terpenuhi.
  if (levelSpawn < LEVELS[level].jumlah) {
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnEnemy();
      levelSpawn += 1;
      spawnTimer = LEVELS[level].jedaSpawn;
    }
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.hitFlash = Math.max(0, e.hitFlash - dt);
    e.freeze = Math.max(0, (e.freeze || 0) - dt);

    // Efek terbakar: -HP tiap 0.5 dtk selama durasi.
    if (e.burn) {
      e.burn.timer += dt;
      while (e.burn.timer >= e.burn.tick) {
        e.burn.timer -= e.burn.tick;
        e.hp -= e.burn.dmg;
        e.hitFlash = 0.1;
        spawnDamage(e.x, e.y - e.r - 16, e.burn.dmg, "#ff8c3f");
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
      e.x += Math.cos(angle) * e.speed * dt;
      e.y += Math.sin(angle) * e.speed * dt;
    }

    if (dist(e.x, e.y, player.x, player.y) < e.r + 32 && player.invuln <= 0) {
      player.hp -= 20;
      spawnDamage(player.x, player.y - 52, 20, "#ff4d4d");
      sfxPemainKena();
      hurtVig = 0.9;
      shake = 0.3;
      enemies.splice(i, 1);
      spawnParticles(player.x, player.y, "#3aa0ff", 10);
      if (player.hp <= 0) {
        player.hp = 0;
        gameOver = true;
        spawnParticles(player.x, player.y, "#3aa0ff", 30);
        shake = 0.6;
        sfxGameOver();
        addFlash("rgba(160, 0, 40, 0.5)", 1, 0.6);
        tampilkanGameOver();
      }
    }
  }

  // Level tuntas: kuota level sudah di-spawn dan tak ada musuh yang hidup.
  if (levelSpawn >= LEVELS[level].jumlah && enemies.length === 0) {
    levelSelesai();
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.t >= p.life) particles.splice(i, 1);
  }

  // Flash layar & vignette luka (memudar bersama waktu).
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

  // Jiwa (soul): melayang, lalu tertarik & diserap pemain.
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
        soul += 1;
        sfxSoul();
        spawnParticles(s.x, s.y, "#7cff5e", 4);
      }
      souls.splice(i, 1);
      continue;
    }
    if (s.t >= s.life) souls.splice(i, 1);
  }
}