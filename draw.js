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

  // Lidah api kecil (ujung api soul meter versi sederhana): 3 lapis gradient
  // dari pangkal merah marun ke puncak putih, berayun ke samping.
  function gambarLidahApi(bx, by, w, h, sway) {
    const g1 = ctx.createLinearGradient(0, by, 0, by - h);
    g1.addColorStop(0, "#b31008");
    g1.addColorStop(1, "#ff3d00");
    ctx.fillStyle = g1;
    ctx.beginPath();
    ctx.moveTo(bx - w / 2, by);
    ctx.quadraticCurveTo(bx - w * 0.35 + sway, by - h * 0.55, bx + sway, by - h);
    ctx.quadraticCurveTo(bx + w * 0.35 + sway, by - h * 0.55, bx + w / 2, by);
    ctx.closePath();
    ctx.fill();

    const g2 = ctx.createLinearGradient(0, by, 0, by - h * 0.7);
    g2.addColorStop(0, "#ff5500");
    g2.addColorStop(1, "#ffd23f");
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.moveTo(bx - w * 0.3, by);
    ctx.quadraticCurveTo(bx - w * 0.18 + sway, by - h * 0.5, bx + sway * 0.6, by - h * 0.72);
    ctx.quadraticCurveTo(bx + w * 0.18 + sway, by - h * 0.5, bx + w * 0.3, by);
    ctx.closePath();
    ctx.fill();

    const g3 = ctx.createLinearGradient(0, by, 0, by - h * 0.5);
    g3.addColorStop(0, "#ffe042");
    g3.addColorStop(1, "#ffffff");
    ctx.fillStyle = g3;
    ctx.beginPath();
    ctx.moveTo(bx - w * 0.14, by);
    ctx.quadraticCurveTo(bx - w * 0.06 + sway * 0.4, by - h * 0.38, bx + sway * 0.4, by - h * 0.52);
    ctx.quadraticCurveTo(bx + w * 0.06 + sway * 0.4, by - h * 0.38, bx + w * 0.14, by);
    ctx.closePath();
    ctx.fill();
  }

  // Kobaran api pasif (ultimate Vender): rumpun lidah api kecil menjulang,
  // berkedip hidup dengan 3 lidah (tengah tertinggi), memudar 20% terakhir.
  for (const f of fires) {
    const hidup = 1 - f.t / f.life;
    const fade = hidup < 0.2 ? hidup / 0.2 : 1;
    const skala = f.radius * (0.9 + 0.25 * Math.sin(f.t * 8 + f.phase));
    const lidah = [
      { dx: -skala * 0.5, w: skala * 0.9, h: skala * 2.2, ph: 0.0, sway: 1.6 + Math.sin(f.t * 5) * 2 },
      { dx: skala * 0.45, w: skala * 0.8, h: skala * 1.9, ph: 1.9, sway: -1.2 + Math.cos(f.t * 6) * 1.5 },
      { dx: 0,            w: skala * 1.05, h: skala * 2.7, ph: 3.1, sway: 0.4 + Math.sin(f.t * 7 + 1) * 2 }
    ];
    ctx.globalAlpha = fade;
    for (const L of lidah) {
      const flk = 0.65 + 0.35 * Math.sin(f.t * 10 + L.ph);
      gambarLidahApi(f.x + L.dx, f.y, L.w, L.h * (0.8 + 0.3 * flk), L.sway);
    }
  }
  ctx.globalAlpha = 1;

  // Koridor BEKU PASIF (ultimate Kenzro): jalur lurus yang dilalui anak panah.
  // Sisi-sisinya duri es runcing (tinggi & arah acak, tetap sejajar koridor),
  // dan di area tengahnya turun salju (gaya soul meter Kenzro saat penuh).
  ctx.save();
  const tNow = performance.now() / 1000;
  for (const fz of freezes) {
    const hidup = 1 - fz.t / fz.life;
    const fade = hidup < 0.2 ? hidup / 0.2 : 1;
    // Hanya bagian yang sudah dilewati panah (reveal) yang ditampilkan —
    // koridor "ter-render" perlahan mengikuti gerakan anak panah.
    const effLen = Math.max(30, Math.min(fz.length, fz.reveal));
    const ex = fz.x0 + fz.nx * effLen;
    const ey = fz.y0 + fz.ny * effLen;
    // Keempat sudut koridor.
    const k1x = fz.x0 + fz.px * fz.half,  k1y = fz.y0 + fz.py * fz.half;
    const k2x = ex + fz.px * fz.half,     k2y = ey + fz.py * fz.half;
    const g1x = fz.x0 - fz.px * fz.half,  g1y = fz.y0 - fz.py * fz.half;
    const g2x = ex - fz.px * fz.half,     g2y = ey - fz.py * fz.half;

    // Lapisan beku tipis di jalurnya (transparan, cukup pekat).
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(125, 211, 252, " + 0.24 * fade + ")";
    ctx.beginPath();
    ctx.moveTo(k1x, k1y);
    ctx.lineTo(k2x, k2y);
    ctx.lineTo(g2x, g2y);
    ctx.lineTo(g1x, g1y);
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    // Garis pendar dingin tipis di kedua sisi.
    ctx.globalAlpha = fade;
    const sisi = [
      { a1x: k1x, a1y: k1y, a2x: k2x, a2y: k2y, sgn: 1 },
      { a1x: g1x, a1y: g1y, a2x: g2x, a2y: g2y, sgn: -1 }
    ];
    for (const s of sisi) {
      ctx.strokeStyle = "rgba(191, 233, 255, " + 0.3 * fade + ")";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(s.a1x, s.a1y);
      ctx.lineTo(s.a2x, s.a2y);
      ctx.stroke();
    }

    // DURI ES rapat & saling menempel di tiap sisi — tinggi, lebar, bentuk,
    // dan condong benar-benar acak, menjulur keluar sejajar koridor.
    const nSp = Math.max(4, Math.floor(effLen / 11));
    for (let k = 0; k < nSp; k++) {
      const r1 = Math.abs(Math.sin(k * 12.9898 + fz.seed * 1.7));
      const r2 = Math.abs(Math.sin(k * 78.233 + fz.seed * 2.3 + 1));
      const r3 = Math.abs(Math.sin(k * 39.19 + fz.seed + 4.7));
      const r4 = Math.abs(Math.sin(k * 91.7 + fz.seed * 3.3));
      const r5 = Math.abs(Math.sin(k * 33.7 + fz.seed * 4.9));
      const rr = (k + 0.5 + (r3 - 0.5) * 0.45) / nSp; // posisi rapat + jitter
      const h = 7 + r1 * 26;                         // tinggi acak 7–33
      const w = 6 + r2 * 10;                         // pangkal lebar 6–16 (menempel)
      // Condong: sebagian lurus, sebagian miring sedang, sebagian tajam.
      const leanAmt = r1 > 0.74 ? 30 : (r1 > 0.3 ? 15 : 5);
      const leanDir = Math.sin(k * 41.3 + fz.seed * 5.1);
      const lean = leanDir * leanAmt;
      for (const s of sisi) {
        const bx = s.a1x + (s.a2x - s.a1x) * rr;
        const by = s.a1y + (s.a2y - s.a1y) * rr;
        const tx = bx + fz.px * s.sgn * h + fz.nx * lean;
        const ty = by + fz.py * s.sgn * h + fz.ny * lean;
        const axs = tx - bx, ays = ty - by;
        const L = Math.sqrt(axs * axs + ays * ays) || 1;
        const ux = -ays / L, uy = axs / L;
        const e1x = bx - ux * w / 2, e1y = by - uy * w / 2;
        const e2x = bx + ux * w / 2, e2y = by + uy * w / 2;
        ctx.fillStyle = "#d8f2ff";
        ctx.beginPath();
        ctx.moveTo(e1x, e1y);
        ctx.lineTo(tx, ty);
        ctx.lineTo(bx, by);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(tx, ty);
        ctx.lineTo(e2x, e2y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        // Bentuk acak: sebagian duri bercabang dua-tip dari pangkal yang sama.
        if (r4 > 0.64 && h > 14) {
          const h2 = h * (0.7 + r2 * 0.35);
          const tx2 = bx + fz.px * s.sgn * h2 + fz.nx * (lean + r5 * 26 - 13);
          const ty2 = by + fz.py * s.sgn * h2 + fz.ny * (lean + r5 * 26 - 13);
          const axs2 = tx2 - bx, ays2 = ty2 - by;
          const L2 = Math.sqrt(axs2 * axs2 + ays2 * ays2) || 1;
          const ux2 = -ays2 / L2, uy2 = axs2 / L2;
          const w2 = w * 0.55;
          const f1x = bx - ux2 * w2 / 2, f1y = by - uy2 * w2 / 2;
          const f2x = bx + ux2 * w2 / 2, f2y = by + uy2 * w2 / 2;
          ctx.fillStyle = "#e6f6ff";
          ctx.beginPath();
          ctx.moveTo(f1x, f1y);
          ctx.lineTo(tx2, ty2);
          ctx.lineTo(bx, by);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#60c7f5";
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(tx2, ty2);
          ctx.lineTo(f2x, f2y);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(tx2, ty2);
          ctx.stroke();
        }
      }
    }

    // Es DALAM: dasarnya yang rata menempel langsung DI SISI hitbox (garis
    // tepi itu sendiri) dan ujungnya MENUSUK KE DALAM koridor — kebalikan
    // duri luar, ukuran lebih kecil.
    const nSpIn = Math.max(4, Math.floor(effLen / 9));
    for (let k = 0; k < nSpIn; k++) {
      const r1 = Math.abs(Math.sin(k * 12.9898 + fz.seed * 2.2));
      const r2 = Math.abs(Math.sin(k * 78.233 + fz.seed * 2.9 + 3));
      const r3 = Math.abs(Math.sin(k * 39.19 + fz.seed * 1.4 + 8));
      const rr = (k + 0.5) / nSpIn;
      const h = 4 + r1 * 13;                        // kecil 4–17
      const w = 4 + r2 * 7;                         // pangkal 4–11
      const lean = Math.sin(k * 41.3 + fz.seed * 6.1) * 10;
      for (const s of sisi) {
        const bx = s.a1x + (s.a2x - s.a1x) * rr;
        const by = s.a1y + (s.a2y - s.a1y) * rr;
        const tx = bx - fz.px * s.sgn * h + fz.nx * lean;
        const ty = by - fz.py * s.sgn * h + fz.ny * lean;
        const axs = tx - bx, ays = ty - by;
        const L = Math.sqrt(axs * axs + ays * ays) || 1;
        const ux = -ays / L, uy = axs / L;
        const e1x = bx - ux * w / 2, e1y = by - uy * w / 2;
        const e2x = bx + ux * w / 2, e2y = by + uy * w / 2;
        ctx.fillStyle = "#dff4ff";
        ctx.beginPath();
        ctx.moveTo(e1x, e1y);
        ctx.lineTo(tx, ty);
        ctx.lineTo(bx, by);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#4db8e8";
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(tx, ty);
        ctx.lineTo(e2x, e2y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(tx, ty);
        ctx.stroke();
      }
    }

    // SALJU MENGGAMBANG di dalam koridor (klip ke bentuk koridor) — 5x lebih
    // rapat, melayang berputar pelan di tempat, tidak jatuh ke bawah.
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(k1x, k1y);
    ctx.lineTo(k2x, k2y);
    ctx.lineTo(g2x, g2y);
    ctx.lineTo(g1x, g1y);
    ctx.closePath();
    ctx.clip();
    const JUMLAH_SALJU = Math.max(90, Math.floor(effLen * 0.7));
    for (let i = 0; i < JUMLAH_SALJU; i++) {
      const xr = ((i * 53 + 7) % 100) / 100;
      const perp = ((i * 29 + 11) % 101) / 100 - 0.5;
      const bxS = fz.x0 + fz.nx * xr * effLen + fz.px * perp * fz.half * 1.5;
      const byS = fz.y0 + fz.ny * xr * effLen + fz.py * perp * fz.half * 1.5;
      const kecepatan = 0.5 + (i % 5) * 0.22;
      const ph = i * 1.3;
      const amp = 4 + (i % 4) * 2;
      const sx = bxS + Math.sin(tNow * kecepatan + ph) * amp;
      const sy = byS + Math.cos(tNow * kecepatan * 0.8 + ph * 1.7) * amp * 0.6;
      const r = 1.6 + (i % 5 === 0 ? 1.6 : (i % 2 === 0 ? 0.9 : 0.4));
      const alpha = (0.5 + 0.45 * Math.abs(Math.sin(tNow * 0.9 + ph))) * fade;
      if (i % 8 === 0) {
        gambarKepingSalju(sx, sy, r, tNow * 0.3 + ph * 0.2, alpha);
      } else {
        ctx.fillStyle = "rgba(224, 242, 254, " + alpha + ")";
        ctx.fillRect(sx - r * 0.4, sy - r * 0.4, r * 0.8, r * 0.8);
      }
    }
    ctx.restore();
  }
  ctx.restore();
  ctx.globalAlpha = 1;

  for (const e of enemies) {
    if (e.hitFlash > 0) {
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r + 6, 0, Math.PI * 2);
      ctx.globalAlpha = 0.5;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
// Sprite sesuai tipe: musuh.png / cepet.png / tank.png.
    const imgMusuh = tekstur[e.kunci] || tekstur.musuh;
    if (imgMusuh) {
      gambarPixel(imgMusuh, e.x, e.y, e.skala || 1);
    }
    ctx.fillStyle = "#000";
    ctx.fillRect(e.x - 16, e.y - 22, 32, 3);
    ctx.fillStyle = e.warna;
    ctx.fillRect(e.x - 16, e.y - 22, 32 * (e.hp / e.maxHp), 3);

    // Musuh membeku: lingkaran es biru di sekelilingnya.
    if (e.freeze > 0) {
      ctx.fillStyle = "rgba(125, 211, 252, 0.35)";
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r + 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#7dd3fc";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Musuh terbakar: lingkaran api oranye di sekelilingnya.
    if (e.burn) {
      ctx.fillStyle = "rgba(255, 140, 63, 0.3)";
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r + 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ff8c3f";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // Efek TEbasan sabit Vender: garis api merayap di sepanjang TEPI ATAS
  // (tepian luar) hitbox ayunan sabit — dari ujung kiri ke ujung kanan,
  // muncul perlahan (linear, tanpa fade-in/fade-out), hilang seketika.
  for (const sl of slashes) {
    // Fase 1 (muncul): sabit merayap dari ujung kiri ke kanan.
    // Fase 2 (hilang): ujung KIRI mengecil, mengejar ke arah kanan.
    // Seluruh bentuk mengecil jadi RUNClNG (lancip) di KEDUA ujung —
    // seperti sabit/crescent: tipis di kiri-kanan, paling tebal di tengah.
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
    const span = a2 - a1;
    const N = 20;

    // ULTIMATE Vender: cakram api tebal seluruh area + sabit besar mengorbit.
    // Muncul (fase 1): sabit menyebar dari kiri ke kanan penuhi arena.
    // Menghilang (fase 2): busur terhapus dari kiri sampai habis.
    if (sl.burst) {
      const wSabit = tekstur[karakter.senjata];
      const rot = sl.t / sl.life;
      const tipA = sl.t < half ? a2 : a1; // ujung aktif (muncul/hapus)
      ctx.globalAlpha = Math.max(0.4, 1 - rot * 0.55);

      // Piringan api tembus pandang mengikuti busur aktif saat ini.
      ctx.fillStyle = "rgba(255, 60, 0, 0.18)";
      ctx.beginPath();
      ctx.moveTo(sl.x, sl.y);
      for (let i = 0; i <= 28; i++) {
        const t = i / 28;
        const a = a1 + span * t;
        ctx.lineTo(sl.x + Math.cos(a) * sl.reach, sl.y + Math.sin(a) * sl.reach);
      }
      ctx.closePath();
      ctx.fill();

      // Bilah bara luar (18) tebal, tersebar di sepanjang busur aktif.
      const B = 18;
      for (let b = 0; b < B; b++) {
        const a = a1 + span * (b / (B - 1));
        const panj = sl.reach * (0.45 + 0.55 * rot);
        ctx.save();
        ctx.translate(sl.x, sl.y);
        ctx.rotate(a);
        ctx.fillStyle = "rgba(255, 70, 10, 0.65)";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(panj * 0.9, -30);
        ctx.lineTo(panj, 0);
        ctx.lineTo(panj * 0.9, 30);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      // Inti kuning terang (14) tebal di lapisan atas.
      const B2 = 14;
      for (let b = 0; b < B2; b++) {
        const a = a1 + span * (b / (B2 - 1));
        const panj = sl.reach * (0.28 + 0.45 * rot);
        ctx.save();
        ctx.translate(sl.x, sl.y);
        ctx.rotate(a);
        ctx.fillStyle = "#ffd75f";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(panj * 0.9, -18);
        ctx.lineTo(panj, 0);
        ctx.lineTo(panj * 0.9, 18);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      // Sabit ASLI dibesarkan 10x, mengorbit di ujung aktif tebasan.
      if (wSabit) {
        const orbR = sl.reach * (0.6 + 0.4 * rot);
        const bx = sl.x + Math.cos(tipA) * orbR;
        const by = sl.y + Math.sin(tipA) * orbR;
        const skalaB = karakter.senjataSkala * 10;
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(tipA + Math.PI / 2); // sejajar arah orbit
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          wSabit,
          -wSabit.width * skalaB / 2,
          -wSabit.height * skalaB / 2,
          wSabit.width * skalaB,
          wSabit.height * skalaB
        );
        ctx.restore();
      }
      // Gelombang kejut tebal meluas keluar.
      const shockR = sl.reach * (0.3 + 0.7 * rot);
      ctx.strokeStyle = "#ffd75f";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(sl.x, sl.y, shockR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,90,0,0.9)";
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(sl.x, sl.y, shockR * 0.92, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      continue;
    }

    // Tebasan BESAR (skill Vender): kipas api berlapis & bergerigi yang
    // menutupi PENUH area hitbox — dari pusat hingga radius maksimum.
    if (sl.skill) {
      ctx.globalAlpha = Math.max(0.35, 1 - (sl.t / sl.life) * 0.6);
      function kipas(maksR, warna, spike) {
        ctx.fillStyle = warna;
        ctx.beginPath();
        ctx.moveTo(sl.x, sl.y);
        const S = 48;
        for (let i = 0; i <= S; i++) {
          const t = i / S;
          const a = a1 + span * t;
          const g = spike ? 0.78 + 0.22 * Math.sin(t * Math.PI * 5) : 1;
          ctx.lineTo(sl.x + Math.cos(a) * (maksR * g), sl.y + Math.sin(a) * (maksR * g));
        }
        ctx.closePath();
        ctx.fill();
      }

      // Dasar gelap tebal -> badan api bergerigi -> inti terang.
      kipas(r, "rgba(60, 8, 0, 0.5)", false);
      kipas(r, "rgba(255, 60, 0, 0.45)", true);
      kipas(r * 0.78, "rgba(255, 120, 35, 0.6)", true);
      kipas(r * 0.55, "#ff8c3f", true);
      kipas(r * 0.38, "#ffd75f", true);

      // Tepi luar radius maksimum biar jelas batas hitboxnya.
      ctx.strokeStyle = "rgba(255, 90, 0, 0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const t = i / 60;
        const a = a1 + span * t;
        if (i === 0) ctx.moveTo(sl.x + Math.cos(a) * r, sl.y + Math.sin(a) * r);
        else ctx.lineTo(sl.x + Math.cos(a) * r, sl.y + Math.sin(a) * r);
      }
      ctx.stroke();

      // Titik terang di ujung yang sedang berjalan.
      const tipA = sl.t < half ? a2 : a1;
      ctx.fillStyle = "#fff7cc";
      ctx.beginPath();
      ctx.arc(sl.x + Math.cos(tipA) * r, sl.y + Math.sin(tipA) * r, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
      continue;
    }

    // Bangun sabit lancip: lebar = 0 di kedua ujung, maksimal di tengah.
    function sabit(maxW, warna) {
      ctx.fillStyle = warna;
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const a = a1 + span * t;
        const w = maxW * Math.sin(Math.PI * t); // 0 di ujung, tebal di tengah
        const rad = r + w / 2;
        const x = sl.x + Math.cos(a) * rad;
        const y = sl.y + Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      for (let i = N; i >= 0; i--) {
        const t = i / N;
        const a = a1 + span * t;
        const w = maxW * Math.sin(Math.PI * t);
        ctx.lineTo(sl.x + Math.cos(a) * (r - w / 2), sl.y + Math.sin(a) * (r - w / 2));
      }
      ctx.closePath();
      ctx.fill();
    }

    // Bara lebar.
    sabit(22, "rgba(255, 70, 20, 0.55)");
    // Badan api.
    sabit(13, "rgba(255, 150, 40, 0.95)");
    // Inti kuning terang.
    sabit(6.5, "#ffd75f");

    // Titik terang kecil di ujung yang sedang merayap/menghilang.
    const tipA = sl.t < half ? a2 : a1;
    ctx.fillStyle = "#fff7cc";
    ctx.beginPath();
    ctx.arc(sl.x + Math.cos(tipA) * r, sl.y + Math.sin(tipA) * r, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Peluru Kenji: anak panah — ujung putih, batang abu-abu, ekor bulu.
  // Dirotasi agar ujungnya sejajar arah tembak.
  for (const b of bullets) {
    const ang = Math.atan2(b.vy, b.vx);
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(ang + Math.PI / 2);
    if (b.raksasa) {
      // PANAH LASER ES BESAR (ultimate Kenzro): ujung runcing menyala,
      // bodi pendek-padat — tanpa ekor panjang (jejaknya koridor beku).
      ctx.imageSmoothingEnabled = false;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      // Aura pendar membungkus anak panah.
      const gAura = ctx.createLinearGradient(0, -175, 0, 60);
      gAura.addColorStop(0, "rgba(191, 233, 255, 0.55)");
      gAura.addColorStop(0.5, "rgba(125, 211, 252, 0.22)");
      gAura.addColorStop(1, "rgba(56, 189, 248, 0)");
      ctx.fillStyle = gAura;
      ctx.beginPath();
      ctx.moveTo(0, -180);
      ctx.quadraticCurveTo(38, -70, 15, 55);
      ctx.quadraticCurveTo(0, 68, -15, 55);
      ctx.quadraticCurveTo(-38, -70, 0, -180);
      ctx.closePath();
      ctx.fill();

      // Bodi plasma: melebar di depan lalu meruncing ke pangkal (tanpa ekor).
      const gBadan = ctx.createLinearGradient(0, -168, 0, 52);
      gBadan.addColorStop(0, "#ffffff");
      gBadan.addColorStop(0.4, "#bfe9ff");
      gBadan.addColorStop(0.85, "#7dd3fc");
      gBadan.addColorStop(1, "rgba(125, 211, 252, 0.2)");
      ctx.fillStyle = gBadan;
      ctx.beginPath();
      ctx.moveTo(0, -170);
      ctx.lineTo(24, -95);
      ctx.lineTo(17, -55);
      ctx.lineTo(10, 40);
      ctx.lineTo(0, 50);
      ctx.lineTo(-10, 40);
      ctx.lineTo(-17, -55);
      ctx.lineTo(-24, -95);
      ctx.closePath();
      ctx.fill();

      // Ujung lance berkilau + rongga lebih terang.
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(0, -185);
      ctx.lineTo(-17, -92);
      ctx.lineTo(0, -66);
      ctx.lineTo(17, -92);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(224, 242, 254, 0.95)";
      ctx.beginPath();
      ctx.moveTo(0, -185);
      ctx.lineTo(-7, -92);
      ctx.lineTo(0, -66);
      ctx.lineTo(7, -92);
      ctx.closePath();
      ctx.fill();

      // Garis inti putih membara.
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.fillRect(-2, -165, 4, 205);

      // EKOR ROKET: semburan pendorong biru muda stabil (bukan lidah api
      // yang naik-turun) — melebar di pangkal lalu meruncing ke belakang.
      const gEkor = ctx.createLinearGradient(0, 48, 0, 142);
      gEkor.addColorStop(0, "rgba(224, 242, 254, 0.95)");
      gEkor.addColorStop(0.35, "rgba(125, 211, 252, 0.6)");
      gEkor.addColorStop(1, "rgba(56, 189, 248, 0)");
      ctx.fillStyle = gEkor;
      ctx.beginPath();
      ctx.moveTo(-8, 48);
      ctx.quadraticCurveTo(-34, 84, -14, 128);
      ctx.quadraticCurveTo(0, 148, 14, 128);
      ctx.quadraticCurveTo(34, 84, 8, 48);
      ctx.closePath();
      ctx.fill();

      // Inti jet terang di tengah semburan.
      const gJet = ctx.createLinearGradient(0, 50, 0, 98);
      gJet.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      gJet.addColorStop(1, "rgba(125, 211, 252, 0)");
      ctx.fillStyle = gJet;
      ctx.beginPath();
      ctx.moveTo(-3.5, 50);
      ctx.quadraticCurveTo(-8, 72, -4, 94);
      ctx.quadraticCurveTo(0, 102, 4, 94);
      ctx.quadraticCurveTo(8, 72, 3.5, 50);
      ctx.closePath();
      ctx.fill();

      // Garis dorongan yang mundur ke belakang (kesan semburan stabil).
      ctx.fillStyle = "rgba(224, 242, 254, 0.45)";
      const fl = (performance.now() / 11) % 84;
      for (let i = 0; i < 3; i++) {
        const oy = 50 + ((i * 28 + fl) % 84);
        ctx.fillRect(-2.5, oy, 5, 16);
      }
      ctx.restore();
    } else {
      // Panah pembeku (saat buff aktif) berwarna biru muda.
      const wTip = b.beku ? "#ffffff" : "#ffffff";
      const wBadan = b.beku ? "#9fd9ff" : "#d9d9d9";
      const wEkor = b.beku ? "#5cb0e8" : "#a9a9a9";
      ctx.fillStyle = wTip;
      ctx.fillRect(-1, -6, 2, 3);
      ctx.fillStyle = wBadan;
      ctx.fillRect(-1, -3, 2, 6);
      ctx.fillStyle = wEkor;
      ctx.fillRect(-2, 3, 4, 3);
    }
    ctx.restore();
  }

  // Senjata + Pemain. Saat pause/game over tetap digambar agar adegan beku terlihat.
  if (karakter !== null && (statusGame === "main" || statusGame === "pause" || statusGame === "over")) {
    gambarSenjata();
    // Aura es saat buff panah pembeku aktif.
    if (player.specialBuff > 0) {
      ctx.strokeStyle = "rgba(125, 211, 252, 0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 24, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Aura dingin ultimate: wajah lebih terang & berdenyut.
    if (player.ultBuff) {
      const pu = 0.7 + 0.3 * Math.sin(performance.now() / 120);
      ctx.strokeStyle = "rgba(125, 211, 252, " + (0.85 * pu) + ")";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(191, 233, 255, " + (0.45 * pu) + ")";
      ctx.beginPath();
      ctx.arc(player.x, player.y, 42, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Preview panah raksasa: bar kecil di BAWAH karakter, terisi saat cooldown.
    if (player.ultCd > 0 && (player.ultArrows || 0) > 0) {
      const prog = 1 - player.ultCd / ULT_CHARGE;
      const bw = 40, bh = 5;
      const bx = player.x - bw / 2, by = player.y + 26;
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = "#7dd3fc";
      ctx.fillRect(bx, by, bw * prog, bh);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, bw, bh);
    }
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

  // Jiwa hijau terang: berdenyut kecil (kosmetik, bisa diserap pemain).
  for (const s of souls) {
    const pulse = 0.6 + 0.4 * Math.sin(s.t * 6);
    ctx.globalAlpha = 0.35 * pulse;
    ctx.fillStyle = "#7cff5e";
    ctx.fillRect(s.x - 4, s.y - 4, 8, 8);
    ctx.globalAlpha = pulse;
    ctx.fillRect(s.x - 2, s.y - 2, 4, 4);
  }
  ctx.globalAlpha = 1;

  // Angka damage melayang: kuning = ke musuh, merah = ke karakter.
  for (const dm of damages) {
    ctx.globalAlpha = 1 - dm.t / dm.life;
    ctx.font = "bold 14px Zen Dots";
    ctx.textAlign = "center";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#000";
    ctx.strokeText(dm.teks, dm.x, dm.y);
    ctx.fillStyle = dm.warna;
    ctx.fillText(dm.teks, dm.x, dm.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = "left";

  ctx.restore();

  // Flash layar penuh (efek ultimate, game over): memudar dari alpha penuh.
  for (const f of flashes) {
    const a = f.alpha * (1 - Math.min(1, f.t / f.life));
    ctx.fillStyle = f.warna;
    ctx.globalAlpha = a;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.globalAlpha = 1;

  // Vignette merah di tepi layar saat pemain terluka.
  if (hurtVig > 0.01) {
    const v = Math.min(0.65, hurtVig);
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 0.85);
    g.addColorStop(0, "rgba(255, 0, 30, 0)");
    g.addColorStop(1, "rgba(255, 0, 30, " + v + ")");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

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
    ctx.font = "bold 34px Zen Dots";
    ctx.textAlign = "center";
    ctx.fillText(levelBanner.teks, W / 2, H / 2 + 4);
    ctx.fillStyle = "#fff";
    ctx.font = "14px Zen Dots";
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
    ctx.font = "bold 14px Zen Dots";
    ctx.fillText("ERROR: " + errorBanner, 8, H - 9);
  }
}

// KOBARAN API VENDER untuk SOUL METER saat penuh.
// Desain: api tinggi menjulang di kedua ujung (sayap/tanduk), pendek di tengah.
// Mendukung transisi pembakaran bertahap (burnProgress: 0.0 -> 1.0) dari hijau ke api membara.
let soulIgniteStart = null;

function gambarApiPixel(px, py, pw, ph, t, burnProgress = 1.0) {
  ctx.save();

  // 1. PENDAR PANAS (Thermal Aura & Ambient Bloom)
  ctx.globalCompositeOperation = "lighter";
  const glowRadius = pw * (0.48 + 0.22 * burnProgress);
  const denyutAura = (0.65 + 0.35 * Math.sin(t * 3.5)) * burnProgress;
  const gGlow = ctx.createRadialGradient(
    px + pw / 2, py + ph / 2, 4,
    px + pw / 2, py + ph / 2, glowRadius
  );
  gGlow.addColorStop(0, "rgba(255, 140, 30, " + (0.45 * denyutAura) + ")");
  gGlow.addColorStop(0.4, "rgba(255, 60, 10, " + (0.25 * denyutAura) + ")");
  gGlow.addColorStop(0.75, "rgba(180, 20, 0, " + (0.09 * denyutAura) + ")");
  gGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = gGlow;
  ctx.beginPath();
  ctx.arc(px + pw / 2, py + ph / 2, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  // 2. BADAN BAR (Transisi Warna Magma: Hijau Panas -> Kuning Pijar -> Merah Magma)
  const gBadan = ctx.createLinearGradient(0, py, 0, py + ph);
  if (burnProgress < 1.0) {
    const bp = burnProgress;
    gBadan.addColorStop(0, bp < 0.5 ? "#d9ff66" : "#fff5cc");
    gBadan.addColorStop(0.3, bp < 0.5 ? "#a6ff33" : "#ffb82e");
    gBadan.addColorStop(0.7, bp < 0.5 ? "#3ec720" : "#ff5500");
    gBadan.addColorStop(1, bp < 0.5 ? "#166534" : "#540008");
  } else {
    gBadan.addColorStop(0, "#fff5cc");
    gBadan.addColorStop(0.22, "#ffb82e");
    gBadan.addColorStop(0.55, "#ff5500");
    gBadan.addColorStop(0.85, "#c71b0a");
    gBadan.addColorStop(1, "#540008");
  }
  ctx.fillStyle = gBadan;
  ctx.fillRect(px + 1, py + 1, pw - 2, ph - 2);

  // Riak magma internal yang mengalir di dalam bar
  if (burnProgress > 0.3) {
    ctx.fillStyle = "rgba(255, 245, 170, " + (0.35 * burnProgress) + ")";
    for (let i = 0; i < 7; i++) {
      const mx = px + ((i * 38 + t * 45) % pw);
      const mw = 14 + 6 * Math.sin(t * 4 + i);
      ctx.fillRect(Math.max(px + 1, mx - mw / 2), py + 2, mw, ph * 0.45);
    }
  }

  // 3. LIDAH-LIDAH API: TINGGI DI UJUNG, PENDEK DI TENGAH!
  const JUMLAH_LIDAH = 15;
  const stepW = pw / JUMLAH_LIDAH;
  const centerIdx = (JUMLAH_LIDAH - 1) / 2;

  function gambarLidah(baseX, baseY, width, height, sway, cBottom, cTop) {
    const gl = ctx.createLinearGradient(0, baseY, 0, baseY - height);
    gl.addColorStop(0, cBottom);
    gl.addColorStop(1, cTop);
    ctx.fillStyle = gl;
    ctx.beginPath();
    ctx.moveTo(baseX - width / 2, baseY);
    ctx.quadraticCurveTo(
      baseX - width * 0.45 + sway * 0.35,
      baseY - height * 0.55,
      baseX + sway,
      baseY - height
    );
    ctx.quadraticCurveTo(
      baseX + width * 0.45 + sway * 0.35,
      baseY - height * 0.55,
      baseX + width / 2,
      baseY
    );
    ctx.closePath();
    ctx.fill();
  }

  const flameGrow = Math.min(1.0, burnProgress * 1.25);

  for (let i = 0; i < JUMLAH_LIDAH; i++) {
    const bx = px + (i + 0.5) * stepW;

    // Jarak dari tengah (0 = tengah, 1 = ujung)
    const distFromCenter = Math.abs(i - centerIdx) / centerIdx;

    // Kurva kuadratik: tengah pendek (0.42), ujung tinggi menjulang (2.85)
    const shapeHeight = 0.42 + 2.43 * Math.pow(distFromCenter, 1.8);

    // Lengkungan menjauhi tengah ke arah luar
    const outwardDir = (i < centerIdx) ? -1 : (i > centerIdx ? 1 : 0);
    const outwardSway = outwardDir * (Math.pow(distFromCenter, 1.4) * 7.5);

    // LAYER 1: Belakang (Merah Marun / Crimson gelap)
    const fT1 = t * 6.5 + i * 1.4;
    const flk1 = 0.6 + 0.4 * Math.sin(fT1) + 0.2 * Math.cos(fT1 * 1.8);
    const h1 = ph * shapeHeight * (0.85 + 0.4 * flk1) * flameGrow;
    const sway1 = outwardSway + Math.sin(t * 5 + i * 1.1) * 3;
    const w1 = stepW * (1.1 + 0.3 * distFromCenter);
    gambarLidah(bx, py + 1, w1, h1, sway1, "#b31008", "#ff3d00");

    // LAYER 2: Tengah (Oranye Berkobar & Amber)
    const fT2 = t * 8.0 + i * 1.7 + 0.8;
    const flk2 = 0.5 + 0.5 * Math.sin(fT2);
    const h2 = h1 * 0.72;
    const sway2 = outwardSway * 0.8 + Math.sin(t * 6.5 + i * 1.3 + 0.5) * 2.5;
    const w2 = w1 * 0.75;
    gambarLidah(bx, py + 1, w2, h2, sway2, "#ff5500", "#ffa600");

    // LAYER 3: Inti Pijar (Kuning Emas & Putih Menyala)
    const h3 = h1 * 0.42;
    const sway3 = outwardSway * 0.5 + Math.sin(t * 8 + i * 1.5) * 1.5;
    const w3 = w1 * 0.46;
    gambarLidah(bx, py + 1, w3, h3, sway3, "#ffe042", "#ffffff");
  }

  // 4. JILATAN API DI BAGIAN BAWAH & TEPI BAR
  const SUB_GEL = 18;
  const subW = pw / SUB_GEL;
  for (let i = 0; i < SUB_GEL; i++) {
    const gx = px + (i + 0.5) * subW;
    const fLow = t * 7 + i * 1.3;
    const hLow = (2 + 2.5 * Math.abs(Math.sin(fLow))) * burnProgress;
    ctx.fillStyle = i % 2 === 0 ? "#ff4d00" : "#ff8c00";
    ctx.beginPath();
    ctx.arc(gx, py + ph + hLow * 0.5, hLow, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. PERCIKAN BARA API (Floating Embers & Sparks)
  const JUMLAH_BARA = 22;
  for (let i = 0; i < JUMLAH_BARA; i++) {
    const seedX = (i * 37) % pw;
    const speedY = 35 + ((i * 19) % 45);
    const cycle = (t * speedY + i * 23) % (ph * 5.5);
    const ey = py - cycle;
    const swayX = Math.sin(t * 4 + i * 1.7 + cycle * 0.08) * 7;
    const ex = px + seedX + swayX;

    const progress = cycle / (ph * 5.5);
    const alpha = Math.max(0, (1 - Math.pow(progress, 1.4)) * burnProgress);
    const size = Math.max(0.8, (1 - progress * 0.5) * (i % 3 === 0 ? 2.8 : 1.6));

    let col = progress < 0.25 ? "#fff8d6" : (progress < 0.55 ? "#ffb833" : (progress < 0.8 ? "#ff4d17" : "#b31408"));

    ctx.fillStyle = col;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(ex, ey, size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

let soulFreezeStart = null;

// Kumpulan posisi & dimensi prisma kristal es beku (padat/rigid, bukan api).
// Spike dirancang rapi agar TIDAK melebar keluar dari batas bar, dan sudut kiri-kanan ditebalkan.
const PILAR_KRISTAL_ES = [
  // KIRI TEBAL & PADAT (xr 0.03 sampai 0.20, condong sedikit ke dalam):
  { xr: 0.03, w: 16, h: 40, tilt: 2 },
  { xr: 0.08, w: 14, h: 30, tilt: 1 },
  { xr: 0.14, w: 13, h: 22, tilt: 0 },
  { xr: 0.20, w: 12, h: 15, tilt: 0 },
  // TENGAH PENDEK & RAPI (xr 0.27 sampai 0.73):
  { xr: 0.27, w: 11, h: 10, tilt: 0 },
  { xr: 0.35, w: 10, h: 8,  tilt: 0 },
  { xr: 0.43, w: 10, h: 7,  tilt: 0 },
  { xr: 0.50, w: 11, h: 9,  tilt: 0 },
  { xr: 0.57, w: 10, h: 7,  tilt: 0 },
  { xr: 0.65, w: 10, h: 8,  tilt: 0 },
  { xr: 0.73, w: 11, h: 10, tilt: 0 },
  // KANAN TEBAL & PADAT (xr 0.80 sampai 0.97, condong sedikit ke dalam):
  { xr: 0.80, w: 12, h: 15, tilt: 0 },
  { xr: 0.86, w: 13, h: 22, tilt: 0 },
  { xr: 0.92, w: 14, h: 30, tilt: -1 },
  { xr: 0.97, w: 16, h: 40, tilt: -2 }
];

// Tetesan es runcing gantung di bawah bar (icicles beku)
const TETESAN_ES = [
  { xr: 0.04, w: 8,  h: 15 },
  { xr: 0.12, w: 6,  h: 9 },
  { xr: 0.22, w: 5,  h: 6 },
  { xr: 0.35, w: 6,  h: 8 },
  { xr: 0.48, w: 5,  h: 5 },
  { xr: 0.62, w: 6,  h: 7 },
  { xr: 0.76, w: 5,  h: 6 },
  { xr: 0.88, w: 7,  h: 11 },
  { xr: 0.96, w: 8,  h: 16 }
];

// Helper menggambar kepingan salju 6-sisi
function gambarKepingSalju(x, y, r, rot, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.strokeStyle = `rgba(224, 242, 254, ${alpha})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let a = 0; a < 3; a++) {
    const ang = (a * Math.PI) / 3;
    const dx = Math.cos(ang) * r;
    const dy = Math.sin(ang) * r;
    ctx.moveTo(-dx, -dy);
    ctx.lineTo(dx, dy);
    if (r >= 2.6) {
      const bdx = dx * 0.55;
      const bdy = dy * 0.55;
      const px = -dy * 0.35;
      const py = dx * 0.35;
      ctx.moveTo(bdx - px, bdy - py);
      ctx.lineTo(bdx, bdy);
      ctx.lineTo(bdx + px, bdy + py);
    }
  }
  ctx.stroke();
  ctx.restore();
}

// Helper menggambar satu pilar kristal es prisma faset (padat/solid, bukan lidah api)
function gambarPrismaKristal(bx, by, w, h, tilt, grow) {
  if (grow <= 0.05) return;
  const ch = h * grow;
  const tipX = bx + tilt;
  const tipY = by - ch;

  // Faset Kiri (Highlight terang es)
  ctx.fillStyle = "#d8f2ff";
  ctx.beginPath();
  ctx.moveTo(bx - w / 2, by);
  ctx.lineTo(tipX, tipY);
  ctx.lineTo(bx, by);
  ctx.closePath();
  ctx.fill();

  // Faset Kanan (Warna cyan arktik teduh)
  ctx.fillStyle = "#38bdf8";
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(tipX, tipY);
  ctx.lineTo(bx + w / 2, by);
  ctx.closePath();
  ctx.fill();

  // Rusuk tengah runcing berkilau
  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();

  // Kontur luar kristal
  ctx.strokeStyle = "rgba(186, 230, 253, 0.6)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bx - w / 2, by);
  ctx.lineTo(tipX, tipY);
  ctx.lineTo(bx + w / 2, by);
  ctx.stroke();
}

// Helper menggambar tetesan es runcing (icicles) menggantung di bawah
function gambarIcicle(bx, by, w, h, grow) {
  if (grow <= 0.05) return;
  const ch = h * grow;
  const tipX = bx;
  const tipY = by + ch;

  // Sisi Kiri
  ctx.fillStyle = "#bae6fd";
  ctx.beginPath();
  ctx.moveTo(bx - w / 2, by);
  ctx.lineTo(tipX, tipY);
  ctx.lineTo(bx, by);
  ctx.closePath();
  ctx.fill();

  // Sisi Kanan
  ctx.fillStyle = "#0284c7";
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(tipX, tipY);
  ctx.lineTo(bx + w / 2, by);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();
}

// EFEK BEKU ES KRISTAL untuk SOUL METER Kenzro saat penuh.
// Desain murni es padat/beku: balok es faset, pilar kristal prisma kaku di atas,
// tetesan icicles di bawah, hawa kabut dingin, kepingan salju (snowflakes) jatuh perlahan,
// dan kilauan berlian (glints) sesekali.
function gambarApiEs(px, py, pw, ph, t, freezeProgress = 1.0) {
  ctx.save();

  // 1. KABUT DINGIN / FROST MIST (Hawa dingin membeku yang tenang)
  ctx.globalCompositeOperation = "lighter";
  const mistW = pw * 0.68;
  const denyut = (0.55 + 0.35 * Math.sin(t * 2.2)) * freezeProgress;
  const gMist = ctx.createRadialGradient(px + pw / 2, py + ph * 0.6, 2, px + pw / 2, py + ph * 0.6, mistW);
  gMist.addColorStop(0, "rgba(125, 211, 252, " + (0.26 * denyut) + ")");
  gMist.addColorStop(0.5, "rgba(56, 189, 248, " + (0.11 * denyut) + ")");
  gMist.addColorStop(0.85, "rgba(2, 132, 199, " + (0.03 * denyut) + ")");
  gMist.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = gMist;
  ctx.beginPath();
  ctx.arc(px + pw / 2, py + ph * 0.6, mistW, 0, Math.PI * 2);
  ctx.fill();

  // 2. BADAN BAR KRISTAL ES PADAT (Solid Glacial Block)
  const gBadan = ctx.createLinearGradient(0, py, 0, py + ph);
  if (freezeProgress < 1.0) {
    const fp = freezeProgress;
    gBadan.addColorStop(0, fp < 0.5 ? "#a7f3d0" : "#e0f2fe");
    gBadan.addColorStop(0.3, fp < 0.5 ? "#6ee7b7" : "#7dd3fc");
    gBadan.addColorStop(0.7, fp < 0.5 ? "#34d399" : "#0284c7");
    gBadan.addColorStop(1, fp < 0.5 ? "#065f46" : "#082f49");
  } else {
    gBadan.addColorStop(0, "#f0f9ff");
    gBadan.addColorStop(0.2, "#bae6fd");
    gBadan.addColorStop(0.55, "#38bdf8");
    gBadan.addColorStop(0.85, "#0284c7");
    gBadan.addColorStop(1, "#082f49");
  }
  ctx.fillStyle = gBadan;
  ctx.fillRect(px + 1, py + 1, pw - 2, ph - 2);

  // PENEBALAN SUDUT KIRI & KANAN SUPAYA FULL & SOLID
  const crystalGrow = Math.min(1.0, freezeProgress * 1.3);
  if (freezeProgress > 0.25) {
    // Balok faset es sudut kiri
    ctx.fillStyle = "rgba(186, 230, 253, " + (0.75 * freezeProgress) + ")";
    ctx.beginPath();
    ctx.moveTo(px + 1, py + 1);
    ctx.lineTo(px + 28 * crystalGrow, py + 1);
    ctx.lineTo(px + 14 * crystalGrow, py + ph - 1);
    ctx.lineTo(px + 1, py + ph - 1);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, " + (0.85 * freezeProgress) + ")";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 1, py + 1);
    ctx.lineTo(px + 14 * crystalGrow, py + ph - 1);
    ctx.stroke();

    // Balok faset es sudut kanan
    ctx.fillStyle = "rgba(56, 189, 248, " + (0.75 * freezeProgress) + ")";
    ctx.beginPath();
    ctx.moveTo(px + pw - 1, py + 1);
    ctx.lineTo(px + pw - 28 * crystalGrow, py + 1);
    ctx.lineTo(px + pw - 14 * crystalGrow, py + ph - 1);
    ctx.lineTo(px + pw - 1, py + ph - 1);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, " + (0.85 * freezeProgress) + ")";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + pw - 1, py + 1);
    ctx.lineTo(px + pw - 14 * crystalGrow, py + ph - 1);
    ctx.stroke();

    // Garis retakan es putih (frost cracks)
    ctx.strokeStyle = "rgba(255, 255, 255, " + (0.55 * freezeProgress) + ")";
    ctx.lineWidth = 1;
    const crackPts = [
      [px + 50, py + 3, px + 58, py + 12, px + 54, py + 21],
      [px + 110, py + 2, px + 116, py + 10, px + 124, py + 16],
      [px + 140, py + 4, px + 134, py + 14, px + 142, py + 20],
      [px + 195, py + 3, px + 201, py + 11, px + 196, py + 19]
    ];
    for (const pts of crackPts) {
      ctx.beginPath();
      ctx.moveTo(pts[0], pts[1]);
      ctx.lineTo(pts[2], pts[3]);
      ctx.lineTo(pts[4], pts[5]);
      ctx.stroke();
    }
  }

  // 3. PILAR KRISTAL ES PADAT (PAS DI DALAM BATAS BAR)
  for (const sp of PILAR_KRISTAL_ES) {
    const bx = px + sp.xr * pw;
    gambarPrismaKristal(bx, py + 1, sp.w, sp.h, sp.tilt, crystalGrow);
  }

  // 4. TETESAN ES RUNClNG (ICICLES) DI BAWAH BAR
  for (const ic of TETESAN_ES) {
    const bx = px + ic.xr * pw;
    gambarIcicle(bx, py + ph, ic.w, ic.h, crystalGrow);
  }

  // 5. SNOWFLAKES JATUH SECARA PERLAHAN DI BAWAH BAR
  const JUMLAH_SALJU = 24;
  for (let i = 0; i < JUMLAH_SALJU; i++) {
    const seedX = (i * 37) % (pw - 8) + 4;
    const speedY = 16 + ((i * 11) % 15);
    const travelSpan = 52;
    const cycle = (t * speedY + i * 19) % travelSpan;
    const ey = py + ph + 4 + cycle;

    const swayX = Math.sin(t * 2.0 + i * 1.6 + cycle * 0.08) * 8;
    const ex = px + seedX + swayX;

    const progress = cycle / travelSpan;
    const alpha = Math.max(0, (1 - Math.pow(progress, 1.3)) * 0.95 * freezeProgress);
    const r = 1.8 + (i % 3 === 0 ? 1.4 : (i % 2 === 0 ? 0.8 : 0));
    const rot = t * (0.6 + (i % 3) * 0.4);

    if (i % 3 === 0) {
      gambarKepingSalju(ex, ey, r, rot, alpha);
    } else {
      ctx.fillStyle = "rgba(224, 242, 254, " + alpha + ")";
      ctx.beginPath();
      ctx.arc(ex, ey, r * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 6. KILAUAN KRISTAL SESEKALI (Occasional Diamond Glints ✦)
  const sparkPoints = [
    { rx: 0.03, ry: -38, period: 2.8, offset: 0.2 },
    { rx: 0.97, ry: -38, period: 3.2, offset: 1.6 },
    { rx: 0.08, ry: -28, period: 2.5, offset: 0.9 },
    { rx: 0.92, ry: -28, period: 3.6, offset: 2.1 },
    { rx: 0.50, ry: -8,  period: 2.2, offset: 0.5 },
    { rx: 0.05, ry: ph + 6, period: 3.0, offset: 1.2 }
  ];

  for (const sp of sparkPoints) {
    const cycle = (t + sp.offset) % sp.period;
    if (cycle < 0.45 && freezeProgress > 0.4) {
      const p = cycle / 0.45;
      const intensity = Math.sin(p * Math.PI);
      const sx = px + sp.rx * pw;
      const sy = py + sp.ry;
      const sSize = (5 + 7 * intensity) * freezeProgress;

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.translate(sx, sy);
      ctx.rotate(t * 1.2 + sp.offset);

      ctx.fillStyle = "rgba(255, 255, 255, " + (0.95 * intensity) + ")";
      ctx.beginPath();
      ctx.moveTo(0, -sSize);
      ctx.quadraticCurveTo(0, 0, sSize * 0.2, 0);
      ctx.lineTo(sSize, 0);
      ctx.quadraticCurveTo(0, 0, 0, sSize * 0.2);
      ctx.lineTo(0, sSize);
      ctx.quadraticCurveTo(0, 0, -sSize * 0.2, 0);
      ctx.lineTo(-sSize, 0);
      ctx.quadraticCurveTo(0, 0, 0, -sSize * 0.2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, sSize * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = "#000";
  ctx.fillRect(10, 10, 132, 14);
  ctx.fillStyle = "#4ade80";
  ctx.fillRect(12, 12, 128 * (player.hp / player.maxHp), 10);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1;
  ctx.strokeRect(10.5, 10.5, 131, 13);

  // Angka HP di dalam bar: "HP sekarang / HP maks".
  // Warna teks menyesuaikan latar: di atas hijau → hitam, di luar hijau → putih.
  ctx.save();
  ctx.font = "bold 10px Zen Dots";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const hpEdge = 12 + 128 * (player.hp / player.maxHp);
  ctx.fillStyle = hpEdge >= 76 ? "#000" : "#fff";
  ctx.fillText(`${Math.round(player.hp)}/${player.maxHp}`, 76, 17.5);
  ctx.restore();

  ctx.font = "14px Zen Dots";
  ctx.fillStyle = "#fff";
  ctx.fillText("HP", 146, 23);

  // Kotak info kanan atas: nama karakter, level, sisa musuh.
  ctx.fillStyle = "#000";
  ctx.fillRect(440, 10, 190, 62);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1;
  ctx.strokeRect(440.5, 10.5, 189, 61);
  ctx.font = "bold 14px Zen Dots";
  if (karakter) {
    ctx.fillStyle = "#fff";
    ctx.fillText(karakter.nama.toUpperCase(), 450, 28);
  }
  ctx.fillStyle = "#ffd23f";
  ctx.fillText("WAVES " + (level + 1) + "/" + LEVELS.length, 450, 48);
  const sisa = Math.max(0, LEVELS[level].jumlah - (levelSpawn - enemies.length));
  ctx.fillStyle = "#fff";
  ctx.fillText("MUSUH " + sisa, 450, 66);

  if (player.specialBuff > 0) {
    ctx.fillStyle = "#7dd3fc";
    ctx.fillText("FROSTBITE " + player.specialBuff.toFixed(1), 450, 86);
  }
  if (player.ultBuff) {
    ctx.fillStyle = "#7dd3fc";
    ctx.fillText("PANAH RAKSASA " + player.ultArrows, 450, 104);
  }

  // Bar cooldown jurus — teksnya berada DI DALAM bar.
  const namaSkill = karakter && karakter.tipe === "jarak" ? "FROSTBITE" : "HEATWAVE";
  const warnaSkill = karakter && karakter.tipe === "jarak" ? "#7dd3fc" : "#ffd23f";
  ctx.fillStyle = "#000";
  ctx.fillRect(10, 32, 132, 14);
  const ratio = 1 - player.specialCd / player.specialMax;
  ctx.fillStyle = warnaSkill;
  ctx.fillRect(12, 34, 128 * ratio, 10);
  ctx.font = "bold 11px Zen Dots";
  if (player.specialCd > 0) {
    // Sedang cooldown: angka sisa detik di sisi kanan dalam bar.
    ctx.textAlign = "right";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeText(player.specialCd.toFixed(1), 138, 43);
    ctx.fillStyle = "#fff";
    ctx.fillText(player.specialCd.toFixed(1), 138, 43);
    ctx.textAlign = "left";
  } else {
    // Siap dipakai: nama skill di tengah bar.
    ctx.textAlign = "center";
    ctx.fillStyle = "#0d1219";
    ctx.fillText(namaSkill, 76, 43);
    ctx.textAlign = "left";
  }

  // Soul meter: terisi dari jiwa hijau yang diserap (50 = penuh).
  // DIPINDAHKAN ke BAWAH-TENGAH layar + DIPERBESAR; ukuran mengikuti
  // W/H biar tetap proporsional (bukan ukuran tetap di pojok kiri atas).
  // Berlaku untuk SEMUA karakter (Vender & Kenzro sama-sama pakai bar ini).
  const bwS = Math.round(W * 0.34);
  const bhS = Math.round(H * 0.045);
  const bxS = Math.round((W - bwS) / 2);
  const byS = H - Math.round(H * 0.09) - bhS;
  const tNow = performance.now() / 1000;
  const apiMenyala = karakter && karakter.tipe === "dekat" && soul >= SOUL_MAX;
  const esMenyala = karakter && karakter.tipe === "jarak" && soul >= SOUL_MAX;

  let burnProgress = 1.0;
  if (apiMenyala) {
    if (soulIgniteStart === null) {
      soulIgniteStart = tNow;
      // Percikan semburan api saat pertama kali membakar penuh
      if (typeof spawnParticles === "function") {
        spawnParticles(bxS + bwS * 0.2, byS + bhS / 2, "#ffd23f", 15);
        spawnParticles(bxS + bwS * 0.8, byS + bhS / 2, "#ffd23f", 15);
        spawnParticles(bxS + bwS / 2, byS + bhS / 2, "#ff6a00", 25);
      }
      if (typeof addFlash === "function") {
        addFlash("rgba(255, 120, 20, 0.25)", 0.25, 0.35);
      }
    }
    burnProgress = Math.min(1.0, (tNow - soulIgniteStart) / 0.75);
  } else {
    soulIgniteStart = null;
  }

  let freezeProgress = 1.0;
  if (esMenyala) {
    if (soulFreezeStart === null) {
      soulFreezeStart = tNow;
      // Percikan partikel es & kristal saat membeku
      if (typeof spawnParticles === "function") {
        spawnParticles(bxS + bwS * 0.2, byS + bhS / 2, "#a5f3fc", 15);
        spawnParticles(bxS + bwS * 0.8, byS + bhS / 2, "#38bdf8", 15);
        spawnParticles(bxS + bwS / 2, byS + bhS / 2, "#ffffff", 25);
      }
      if (typeof addFlash === "function") {
        addFlash("rgba(186, 230, 253, 0.25)", 0.25, 0.35);
      }
    }
    freezeProgress = Math.min(1.0, (tNow - soulFreezeStart) / 0.75);
  } else {
    soulFreezeStart = null;
  }

  ctx.fillStyle = "#000";
  ctx.fillRect(bxS, byS, bwS, bhS);
  if (apiMenyala) {
    gambarApiPixel(bxS, byS, bwS, bhS, tNow, burnProgress);
  } else if (esMenyala) {
    gambarApiEs(bxS, byS, bwS, bhS, tNow, freezeProgress);
  } else {
    // Belum penuh: isian hijau proporsional jiwa yang diserap (50 = penuh).
    ctx.fillStyle = "#7cff5e";
    ctx.fillRect(bxS + 2, byS + 2, (bwS - 4) * Math.min(1, soul / SOUL_MAX), bhS - 4);
  }

  if (apiMenyala) {
    // Border emas tempaan bercahaya (Vender)
    ctx.strokeStyle = "#ffe27a";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bxS + 0.5, byS + 0.5, bwS - 1, bhS - 1);

    // Teks SOUL METER dengan bayangan pijar api
    ctx.font = "bold 11px Zen Dots";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255, 235, 140, 0.85)";
    ctx.fillText("SOUL METER", bxS + bwS / 2, byS + bhS / 2 + 5);
    ctx.fillStyle = "#260601";
    ctx.fillText("SOUL METER", bxS + bwS / 2, byS + bhS / 2 + 4);
    ctx.textAlign = "left";
  } else if (esMenyala) {
    // Border kristal es perak-cyan (Kenzro)
    ctx.strokeStyle = "#bae6fd";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bxS + 0.5, byS + 0.5, bwS - 1, bhS - 1);

    // Teks SOUL METER dengan bayangan es arktik
    ctx.font = "bold 11px Zen Dots";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(186, 230, 253, 0.9)";
    ctx.fillText("SOUL METER", bxS + bwS / 2, byS + bhS / 2 + 5);
    ctx.fillStyle = "#032030";
    ctx.fillText("SOUL METER", bxS + bwS / 2, byS + bhS / 2 + 4);
    ctx.textAlign = "left";
  } else {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.strokeRect(bxS + 0.5, byS + 0.5, bwS - 1, bhS - 1);

    ctx.font = "bold 11px Zen Dots";
    ctx.textAlign = "center";
    ctx.fillStyle = "#14532d";
    ctx.fillText("SOUL METER", bxS + bwS / 2, byS + bhS / 2 + 4);
    ctx.textAlign = "left";
  }

  if (soul >= SOUL_MAX) {
    ctx.font = "bold 11px Zen Dots";
    ctx.textAlign = "center";
    const pulse = 0.65 + 0.35 * Math.sin(tNow * 6);
    if (apiMenyala) {
      ctx.fillStyle = "rgba(255, 215, 60, " + (pulse * burnProgress) + ")";
    } else if (esMenyala) {
      ctx.fillStyle = "rgba(186, 230, 253, " + (pulse * freezeProgress) + ")";
    } else {
      ctx.fillStyle = "#ffd23f";
    }
    ctx.fillText("ULTIMATE SIAP [R]", bxS + bwS / 2, byS + bhS + 12);
    ctx.textAlign = "left";
  }
  // UI dash: lingkaran hitam transparan pojok kanan bawah + logo sepatu.
  const cx = W - 44, cy = H - 44, R = 30;
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();

  // Gambar satu sepatu mini (bisa dipakai ulang).
  const gambarSepatu = (sx, sy, bad, sol, tali) => {
    ctx.fillStyle = bad;
    ctx.beginPath();
    ctx.moveTo(sx - 10, sy + 5);
    ctx.lineTo(sx - 10, sy - 2);
    ctx.lineTo(sx - 8, sy - 6);
    ctx.lineTo(sx - 1, sy - 5);
    ctx.lineTo(sx + 2, sy + 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = sol;
    ctx.fillRect(sx - 10, sy + 5, 21, 5);
    ctx.fillStyle = tali;
    ctx.fillRect(sx - 6, sy - 4, 9, 3);
    ctx.fillRect(sx - 5, sy - 1, 9, 3);
  };

  if (player.dashMax > 1) {
    // Kenzro (2 dash): cooldown tiap dash MANDIRI, angka tampilannya digabung.
    // Sepatu: normal saat 2 dash siap, agak transparan saat hanya 1.
    ctx.globalAlpha = player.dashStacks >= 2 ? 1 : player.dashStacks === 1 ? 0.5 : 0.25;
    // Sepasang sepatu.
    gambarSepatu(cx - 4, cy, "rgba(125,211,252,0.85)", "#4a9fd8", "#dff4ff");
    gambarSepatu(cx + 6, cy, "#ffffff", "#9fd9ff", "#7dd3fc");
    ctx.globalAlpha = 1;
    // Titik charge di sisi kanan.
    for (let i = 0; i < player.dashMax; i++) {
      const px = cx + R - 6, py = cy - 10 + i * 16;
      ctx.fillStyle = i < player.dashStacks ? "#7dd3fc" : "rgba(255,255,255,0.2)";
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    // Angka gabungan di DALAM sepatu, putih pekat.
    if (player.dashCd > 0) {
      ctx.font = "bold 14px Zen Dots";
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.fillText(player.dashCd.toFixed(1), cx, cy + 7);
      ctx.textAlign = "left";
    }
  } else {
    // Vender (1 dash): angka bersih di tengah saat cooldown.
    if (player.dashCd > 0) {
      ctx.font = "bold 18px Zen Dots";
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.fillText(player.dashCd.toFixed(1), cx, cy + 7);
      ctx.textAlign = "left";
    } else {
      // Siap: sepatu putih-merah.
      gambarSepatu(cx, cy, "#ffffff", "#ff4d4d", "#ff2030");
    }
  }
}