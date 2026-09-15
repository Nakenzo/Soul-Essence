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

    // ULTIMATE Vender: cakram api tebal seluruh area + sabit besar yang MENGORBIT
    // keluar dari pemain, berputar 360° menebas seluruh arena.
    if (sl.burst) {
      const wSabit = tekstur[karakter.senjata];
      const rot = sl.t / sl.life;
      ctx.globalAlpha = Math.max(0.35, 1 - rot * 0.6);
      const theta = sl.angle - Math.PI + rot * Math.PI * 2; // orbit 360°

      // Piringan api tembus pandang menutupi area (bikin tebal & penuh).
      ctx.fillStyle = "rgba(255, 60, 0, 0.14)";
      ctx.beginPath();
      ctx.arc(sl.x, sl.y, sl.reach * (0.5 + 0.5 * rot), 0, Math.PI * 2);
      ctx.fill();

      // Bilah bara luar (16) tebal, memanjang mengikuti rot.
      const B = 16;
      for (let b = 0; b < B; b++) {
        const ang = theta + (b / B) * Math.PI * 2;
        const panj = sl.reach * (0.4 + 0.6 * rot);
        ctx.save();
        ctx.translate(sl.x, sl.y);
        ctx.rotate(ang);
        ctx.fillStyle = "rgba(255, 70, 10, 0.6)";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(panj * 0.9, -24);
        ctx.lineTo(panj, 0);
        ctx.lineTo(panj * 0.9, 24);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      // Inti kuning terang (12) tebal di lapisan atas.
      const B2 = 12;
      for (let b = 0; b < B2; b++) {
        const ang = theta + (b / B2) * Math.PI * 2;
        const panj = sl.reach * (0.26 + 0.45 * rot);
        ctx.save();
        ctx.translate(sl.x, sl.y);
        ctx.rotate(ang);
        ctx.fillStyle = "#ffd75f";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(panj * 0.9, -14);
        ctx.lineTo(panj, 0);
        ctx.lineTo(panj * 0.9, 14);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      // Sabit ASLI dibesarkan 10x, posisinya MENGORBIT keluar mengitari
      // pemain (radius bertambah seiring rot) dan berputar 360°.
      if (wSabit) {
        const orbR = sl.reach * (0.55 + 0.45 * rot);
        const bx = sl.x + Math.cos(theta) * orbR;
        const by = sl.y + Math.sin(theta) * orbR;
        const skalaB = karakter.senjataSkala * 10;
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(theta + Math.PI / 2); // sejajar arah orbit
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
    // Panah pembeku (saat buff aktif) berwarna biru muda.
    const wTip = b.beku ? "#ffffff" : "#ffffff";
    const wBadan = b.beku ? "#9fd9ff" : "#d9d9d9";
    const wEkor = b.beku ? "#5cb0e8" : "#a9a9a9";
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(ang + Math.PI / 2);
    ctx.fillStyle = wTip;
    ctx.fillRect(-1, -6, 2, 3);
    ctx.fillStyle = wBadan;
    ctx.fillRect(-1, -3, 2, 6);
    ctx.fillStyle = wEkor;
    ctx.fillRect(-2, 3, 4, 3);
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

function drawHUD() {
  ctx.fillStyle = "#000";
  ctx.fillRect(10, 10, 132, 14);
  ctx.fillStyle = "#4ade80";
  ctx.fillRect(12, 12, 128 * (player.hp / player.maxHp), 10);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1;
  ctx.strokeRect(10.5, 10.5, 131, 13);

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
  ctx.fillStyle = "#000";
  ctx.fillRect(10, 54, 132, 14);
  ctx.fillStyle = "#7cff5e";
  ctx.fillRect(12, 56, 128 * Math.min(1, soul / SOUL_MAX), 10);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1;
  ctx.strokeRect(10.5, 54.5, 131, 13);
  ctx.font = "bold 11px Zen Dots";
  ctx.textAlign = "center";
  ctx.fillStyle = "#14532d";
  ctx.fillText("SOUL METER", 76, 65);
  ctx.textAlign = "left";
  if (soul >= SOUL_MAX) {
    ctx.font = "bold 11px Zen Dots";
    ctx.fillStyle = "#ffd23f";
    ctx.fillText("ULTIMATE SIAP [R]", 10, 77);
  }
}