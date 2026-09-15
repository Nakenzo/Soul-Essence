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
  ctx.rotate(angle + (karakter.rot || 0));
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
      ctx.arc(e.x, e.y, 16, 0, Math.PI * 2);
      ctx.globalAlpha = 0.5;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (tekstur.musuh) {
      gambarPixel(tekstur.musuh, e.x, e.y, 1);
    }
    ctx.fillStyle = "#000";
    ctx.fillRect(e.x - 16, e.y - 22, 32, 3);
    ctx.fillStyle = "#ff4d4d";
    ctx.fillRect(e.x - 16, e.y - 22, 32 * (e.hp / e.maxHp), 3);
  }

  // Ayunan pedang
  for (const sl of slashes) {
    const alpha = 1 - sl.t / sl.life;
    ctx.fillStyle = "rgba(255, 255, 255, " + 0.45 * alpha + ")";
    ctx.beginPath();
    ctx.moveTo(sl.x, sl.y);
    ctx.arc(sl.x, sl.y, sl.reach * (0.4 + 0.6 * alpha), sl.angle - sl.halfArc, sl.angle + sl.halfArc);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 210, 63, " + alpha + ")";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(sl.x, sl.y, sl.reach, sl.angle - sl.halfArc, sl.angle + sl.halfArc);
    ctx.stroke();
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

  ctx.fillStyle = "#000";
  ctx.fillRect(10, 32, 132, 14);
  const ratio = 1 - player.specialCd / player.specialMax;
  ctx.fillStyle = "#ffd23f";
  ctx.fillRect(12, 34, 128 * ratio, 10);
  ctx.fillStyle = "#fff";
  ctx.fillText(player.specialCd > 0 ? "JURUS " + player.specialCd.toFixed(1) : "JURUS SIAP", 146, 45);
}