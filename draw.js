// ============================================================
// DRAW - semua rendering ke canvas.
// ============================================================

// Senjata mengorbit mengelilingi karakter, selalu di sisi pointer/mouse.
// Ditampilkan apa adanya (tanpa rotasi) agar pixelnya tidak tercampur
// dan warnanya tidak bergeser — terlihat berputar-putar mengelilingi pemain.
function gambarSenjata() {
  const img = tekstur[karakter.senjata];
  if (!img) return;
  const skala = karakter.senjataSkala || karakter.skala;
  const w = img.width * skala;
  const h = img.height * skala;
  const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

  // Jarak orbit dari pusat karakter
  const jarak = 35;

  ctx.save();
  ctx.translate(
    Math.round(player.x + Math.cos(angle) * jarak),
    Math.round(player.y + Math.sin(angle) * jarak)
  );
  ctx.imageSmoothingEnabled = false;
  let rotTotal = angle + (karakter.rot || 0);
  // Saat menyerang, sabit ikut menyapu dari ujung start ke ujung end.
  if ((player.swing || 0) > 0 && karakter.halfArc > 0) {
    const dur = karakter.swingDuration || 0.2;
    const p = 1 - Math.min(1, player.swing / dur);
    const k = 1 - (1 - p) * (1 - p);
    rotTotal += -karakter.halfArc + karakter.halfArc * 2 * k;
  }
  ctx.rotate(rotTotal);
  ctx.drawImage(img, -Math.round(w / 2), -Math.round(h / 2), Math.round(w), Math.round(h));
  ctx.restore();
}

function gambarLatar() {
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(-20, -20, W + 40, H + 40);
  ctx.fillStyle = "#182538";
  for (let gx = 0; gx < W; gx += 32) {
    for (let gy = 0; gy < H; gy += 32) {
      if ((gx / 32 + gy / 32) % 2 === 0) {
        ctx.fillRect(gx, gy, 32, 32);
      }
    }
  }
}

function draw() {
  ctx.save();

  if (shake > 0) {
    shake -= 1 / 60;
    ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
  }

  gambarLatar();

  // Layar judul & pilih karakter: cukup latar + partikel dekoratif.
  if (statusGame === "title" || statusGame === "select") {
    for (const p of bgPartikels) {
      ctx.fillStyle = "rgba(255, 210, 63, " + p.alpha + ")";
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.restore();
    return;
  }

  // ---------- Rendering game (status "main" / "pause" / "over") ----------
  for (const r of rings) {
    const alpha = 1 - r.t / r.life;
    ctx.strokeStyle = "rgba(255, 210, 63, " + alpha + ")";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (const e of enemies) {
    if (e.hitFlash > 0) {
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r + 6, 0, Math.PI * 2);
      ctx.globalAlpha = 0.5;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // Aura warna sesuai tipe musuh (biasa merah, cepet biru, tank ungu).
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = e.warna;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r * 1.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    if (tekstur.musuh) {
      gambarPixel(tekstur.musuh, e.x, e.y, e.skala || 1);
    }
    ctx.fillStyle = "#000";
    ctx.fillRect(e.x - 16, e.y - 22, 32, 3);
    ctx.fillStyle = e.warna;
    ctx.fillRect(e.x - 16, e.y - 22, 32 * (e.hp / e.maxHp), 3);
  }

  // Efek TEbasan sabit Vender: garis api merayap di sepanjang TEPI ATAS
  // (tepian luar) hitbox ayunan sabit — dari ujung kiri ke ujung kanan,
  // muncul perlahan (linear, tanpa fade-in/fade-out), hilang seketika.
  for (const sl of slashes) {
    // Fase 1 (muncul): garis merayap dari ujung kiri ke kanan.
    // Fase 2 (hilang): ujung KIRI memudar, mengejar ke arah kanan,
    // seperti munculnya tapi terbalik.
    const full = sl.halfArc * 2;
    const half = sl.life / 2;
    let a1, a2;
    if (sl.t < half) {
      const p = sl.t / half;
      a1 = sl.angle - sl.halfArc;
      a2 = a1 + full * p;
    } else {
      const q = (sl.t - half) / half;
      a1 = sl.angle - sl.halfArc + full * q;
      a2 = sl.angle + sl.halfArc;
    }
    const r = sl.reach;

    ctx.lineCap = "round";
    // Bara lebar di tepi.
    ctx.strokeStyle = "rgba(255, 70, 20, 0.5)";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(sl.x, sl.y, r, a1, a2);
    ctx.stroke();
    // Garis api utama.
    ctx.strokeStyle = "rgba(255, 150, 40, 0.95)";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(sl.x, sl.y, r, a1, a2);
    ctx.stroke();
    // Inti kuning terang.
    ctx.strokeStyle = "#ffd75f";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(sl.x, sl.y, r, a1, a2);
    ctx.stroke();
    // Titik terang di ujung yang merayap.
    ctx.fillStyle = "#fff7cc";
    ctx.beginPath();
    ctx.arc(sl.x + Math.cos(a2) * r, sl.y + Math.sin(a2) * r, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Peluru Kenji: anak panah — ujung putih, batang abu-abu, ekor bulu.
  // Dirotasi agar ujungnya sejajar arah tembak.
  for (const b of bullets) {
    const ang = Math.atan2(b.vy, b.vx);
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(ang + Math.PI / 2);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-1, -6, 2, 3);
    ctx.fillStyle = "#d9d9d9";
    ctx.fillRect(-1, -3, 2, 6);
    ctx.fillStyle = "#a9a9a9";
    ctx.fillRect(-2, 3, 4, 3);
    ctx.restore();
  }

  // Senjata + Pemain. Saat pause/game over tetap digambar agar adegan beku terlihat.
  if (karakter !== null && (statusGame === "main" || statusGame === "pause" || statusGame === "over")) {
    gambarSenjata();
    if (tekstur[karakter.kunci]) {
      gambarPixel(tekstur[karakter.kunci], player.x, player.y, karakter.skala);
    }
  }

  for (const p of particles) {
    ctx.globalAlpha = 1 - p.t / p.life;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  ctx.restore();

  // Banner transisi level (muncul-fade sederhana).
  if (levelBanner) {
    const p = levelBanner.t / levelBanner.life;
    const alpha = p < 0.15 ? p / 0.15 : p > 0.75 ? Math.max(0, 1 - (p - 0.75) / 0.25) : 1;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(W / 2 - 160, H / 2 - 45, 320, 76);
    ctx.strokeStyle = "#ffd23f";
    ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - 160, H / 2 - 45, 320, 76);
    ctx.fillStyle = "#ffd23f";
    ctx.font = "bold 34px DotGothic16";
    ctx.textAlign = "center";
    ctx.fillText(levelBanner.teks, W / 2, H / 2 + 4);
    ctx.fillStyle = "#fff";
    ctx.font = "14px DotGothic16";
    ctx.fillText("Habiskan semua musuh!", W / 2, H / 2 + 26);
    ctx.textAlign = "left";
    ctx.globalAlpha = 1;
  }

  drawHUD();

  // Biner error agar mudah terlihat bila ada runtime error.
  if (errorBanner) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, H - 30, W, 30);
    ctx.fillStyle = "#ff6b6b";
    ctx.font = "bold 14px DotGothic16";
    ctx.fillText("ERROR: " + errorBanner, 8, H - 9);
  }
}

function drawHUD() {
  ctx.fillStyle = "#000";
  ctx.fillRect(10, 10, 132, 14);
  ctx.fillStyle = "#4ade80";
  ctx.fillRect(12, 12, 128 * (player.hp / player.maxHp), 10);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1;
  ctx.strokeRect(10.5, 10.5, 131, 13);

  ctx.font = "14px DotGothic16";
  ctx.fillStyle = "#fff";
  ctx.fillText("HP", 146, 23);

  ctx.fillStyle = "#4ade80";
  ctx.font = "bold 18px DotGothic16";
  ctx.fillText("SKOR " + score, 470, 23);

  if (karakter) {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px DotGothic16";
    ctx.fillText(karakter.nama.toUpperCase(), 470, 42);
  }

  // Info level & sisa musuh.
  ctx.fillStyle = "#ffd23f";
  ctx.font = "bold 14px DotGothic16";
  ctx.fillText("LEVEL " + (level + 1) + "/" + LEVELS.length, 470, 58);
  const sisa = Math.max(0, LEVELS[level].jumlah - (levelSpawn - enemies.length));
  ctx.fillStyle = "#fff";
  ctx.fillText("MUSUH " + sisa, 470, 74);

  ctx.fillStyle = "#000";
  ctx.fillRect(10, 32, 132, 14);
  const ratio = 1 - player.specialCd / player.specialMax;
  ctx.fillStyle = "#ffd23f";
  ctx.fillRect(12, 34, 128 * ratio, 10);
  ctx.fillStyle = "#fff";
  ctx.fillText(player.specialCd > 0 ? "JURUS " + player.specialCd.toFixed(1) : "JURUS SIAP", 146, 45);
}