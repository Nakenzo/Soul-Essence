// ============================================================
// ENTITIES - aksi pemain, musuh, dan update logika game.
// ============================================================

// ---------- Aksi pemain ----------
function attack() {
  if (karakter.tipe === "dekat") {
    slashSwing();
  } else {
    shoot();
  }
}

function shoot() {
  if (player.attackCd > 0) return;
  player.attackCd = karakter.attackRate;
  const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  const speed = 420;
  bullets.push({
    x: player.x,
    y: player.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 2.0
  });
  spawnParticles(player.x, player.y, "#ffd23f", 4);
}

function slashSwing() {
  if (player.attackCd > 0) return;
  player.attackCd = karakter.attackRate;
  const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  player.swing = karakter.swingDuration || 0.2;
  // Efek tebasan muncul dari lokasi bilah sabit (titik orbit senjata),
  // bukan dari pusat karakter.
  const ox = player.x + Math.cos(angle) * 35;
  const oy = player.y + Math.sin(angle) * 35;
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

function castSpecial() {
  if (gameOver || karakter === null || statusGame !== "main" || player.specialCd > 0) return;
  player.specialCd = player.specialMax;
  rings.push({ x: player.x, y: player.y, r: 10, maxR: karakter.specialRadius, life: 0.4, t: 0 });

  for (const e of enemies) {
    if (dist(player.x, player.y, e.x, e.y) < karakter.specialRadius) {
      e.hp -= karakter.specialDmg;
      const angle = Math.atan2(e.y - player.y, e.x - player.x);
      e.x += Math.cos(angle) * 40;
      e.y += Math.sin(angle) * 40;
      spawnParticles(e.x, e.y, "#ff4d4d", 8);
      if (e.hp <= 0) {
        killEnemy(e);
      }
    }
  }
}

// ---------- Musuh ----------
function spawnEnemy() {
  const def = LEVELS[level];
  const tipe = pilihTipeMusuh(def.campur);
  const t = TIPE_MUSUH[tipe];
  const hp = Math.max(8, Math.round(def.hp * t.hpKali));

  let x, y;
  const edge = Math.floor(Math.random() * 4);
  if (edge === 0) { x = -20; y = Math.random() * H; }
  else if (edge === 1) { x = W + 20; y = Math.random() * H; }
  else if (edge === 2) { x = Math.random() * W; y = -20; }
  else { x = Math.random() * W; y = H + 20; }

  const kecepatanMin = def.kecepatan[0];
  const kecepatanMax = def.kecepatan[1];
  enemies.push({
    x: x,
    y: y,
    tipe: tipe,
    hp: hp,
    maxHp: hp,
    speed: (kecepatanMin + Math.random() * (kecepatanMax - kecepatanMin)) * t.kecepatanKali,
    r: t.r,
    skala: t.skala,
    warna: t.warna,
    hitFlash: 0
  });
}

function killEnemy(e) {
  const i = enemies.indexOf(e);
  if (i === -1) return;
  score += 10;
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

  player.x = Math.max(20, Math.min(W - 20, player.x));
  player.y = Math.max(20, Math.min(H - 20, player.y));

  player.attackCd -= dt;
  player.specialCd = Math.max(0, player.specialCd - dt);
  player.swing = Math.max(0, (player.swing || 0) - dt);

  if (mouse.down) {
    attack();
  }

  // Peluru
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.life <= 0 || b.x < -10 || b.x > W + 10 || b.y < -10 || b.y > H + 10) {
      bullets.splice(i, 1);
      continue;
    }
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (dist(b.x, b.y, e.x, e.y) < e.r + 4) {
        e.hp -= karakter.damage;
        e.hitFlash = 0.1;
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
    for (const e of enemies) {
      if (sl.hit.has(e)) continue;
      const d = dist(sl.x, sl.y, e.x, e.y);
      const angleToEnemy = Math.atan2(e.y - sl.y, e.x - sl.x);
      let diff = sl.angle - angleToEnemy;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (d < sl.reach + e.r && Math.abs(diff) < sl.halfArc + 0.2) {
        sl.hit.add(e);
        e.hp -= karakter.damage;
        e.hitFlash = 0.1;
        e.x += Math.cos(sl.angle) * 30;
        e.y += Math.sin(sl.angle) * 30;
        spawnParticles(e.x, e.y, "#ffffff", 6);
        if (e.hp <= 0) killEnemy(e);
      }
    }
    if (sl.t >= sl.life) slashes.splice(s, 1);
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
    const angle = Math.atan2(player.y - e.y, player.x - e.x);
    e.x += Math.cos(angle) * e.speed * dt;
    e.y += Math.sin(angle) * e.speed * dt;

    if (dist(e.x, e.y, player.x, player.y) < e.r + 16) {
      player.hp -= 20;
      shake = 0.3;
      enemies.splice(i, 1);
      spawnParticles(player.x, player.y, "#3aa0ff", 10);
      if (player.hp <= 0) {
        player.hp = 0;
        gameOver = true;
        spawnParticles(player.x, player.y, "#3aa0ff", 30);
        shake = 0.6;
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

  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i];
    r.t += dt;
    r.r = 10 + (r.maxR - 10) * (r.t / r.life);
    if (r.t >= r.life) rings.splice(i, 1);
  }
}