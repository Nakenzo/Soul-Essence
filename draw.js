// ============================================================
// DRAW - semua rendering ke canvas.
// ============================================================

// Senjata mengorbit mengelilingi karakter, selalu di sisi pointer/mouse.
// Ditampilkan apa adanya (tanpa rotasi) agar pixelnya tidak tercampur
// dan warnanya tidak bergeser — terlihat berputar-putar mengelilingi pemain.
function gambarSenjata() {
  const img = tekstur[karakter.senjata];
  if (!img) return;
  // Normalisasi: target lebar senjata = ±2× hitbox pemain, tinggi ikut rasio.
  // Senjata PNG kecil (40x64) atau besar (256x256) tetap tampil konsisten.
  const skala = karakter.senjataSkala || karakter.skala || 1;
  const { lebar: w, tinggi: h } = ukuranSprite(img, player.r * 3 * skala);
  const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

  // Jarak orbit dari pusat karakter
  const jarak = 35;

  ctx.save();
  ctx.translate(
    Math.round(player.x + Math.cos(angle) * jarak),
    Math.round(player.y + Math.sin(angle) * jarak)
  );
  // Perkecil (PNG besar diperkecil di genggaman) → smoothing agar tidak pecah.
  ctx.imageSmoothingEnabled = w < img.width || h < img.height;
  if (ctx.imageSmoothingEnabled) ctx.imageSmoothingQuality = "medium";
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

// ---------- Latar MAP (PNG asset, di-cache sekali) ----------
const _BG_M = 16;
let latarCache = null;
// Jadi true bila asset map PNG selesai dimuat → bake dibuat ulang.
let latarDirty = false;
// Skala bake latar: mode HP pakai ½ resolusi (blur halus, tapi jauh lebih
// ringan untuk perangkat kecil — tetap satu drawImage tiap frame, bukan
// rasterisasi ulang). Desktop: resolusi penuh.
function latarSkala() {
  return typeof deviceTerpilih === "string" && deviceTerpilih === "mobile" ? 0.5 : 1;
}
let latarSkalaTerpakai = 0;

// RNG deterministik agar hasil bake sama walaupun dirender ulang.
function rngPohon(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s * 1103515245 + 12345) >>> 0;
    return s / 4294967296;
  };
}

function buatLatarCache() {
  const S = latarSkala();
  // Build ulang hanya kalau belum ada ATAU skala berubah (ganti perangkat)
  // ATAU asset map baru selesai dimuat/diubah (latarDirty).
  if (latarCache && latarSkalaTerpakai === S && !latarDirty) return;
  latarSkalaTerpakai = S;
  latarDirty = false;
  const c = document.createElement("canvas");
  // Latar dibake untuk SELURUH DUNIA (kamera bisa bergeser), + margin shake.
  c.width = Math.max(2, Math.ceil((WORLD_W + _BG_M * 2) * S));
  c.height = Math.max(2, Math.ceil((WORLD_H + _BG_M * 2) * S));
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  const M = _BG_M;
  const cw = WORLD_W + _BG_M * 2, chh = WORLD_H + _BG_M * 2;

  // ============ MAP = GAMBAR PNG (asset, persis seperti karakter) ============
  // Tanah dasar: alas di belakang gambar map (tertutup penuh bila PNG ada).
  g.fillStyle = MAP_ASSET.warnaTanah;
  g.fillRect(0, 0, cw, chh);
  // Gambar assets/maps/*.png diperbesar "pixel-perfect" ke ukuran DUNIA
  // (WORLD_W×WORLD_H), ditempatkan di offset margin. User menggambar map
  // di editor pixel (mis. 160×120 → tiap 1px = 16 unit dunia). Pixel HITAM
  // (#000000) = penghalang (dinding/batu); warna lain bebas = bisa dilewati.
  if (petaSiap && petaImage) {
    g.drawImage(petaImage, M * S, M * S, WORLD_W * S, WORLD_H * S);
  }

  latarCache = c;
}

function gambarLatar() {
  if (!latarCache) buatLatarCache();
  // Gambar hanya jendela dunia yang terlihat (+ margin untuk shake), lebar
  // sama dengan buffer → jangan rasterisasi seluruh lahan 2560x1920 / frame.
  const S = latarSkala();
  const sw = W + _BG_M * 2;
  const sh = H + _BG_M * 2;
  // Sumber = piksel bake ter-scaling; dartikan agar srcX/S - M = koordinat
  // dunia (sejajar dengan translate(-kam)) dan dijepit ke tepi canvas bake.
  const sx = Math.min(latarCache.width - 1, Math.max(0, kam.x * S));
  const sy = Math.min(latarCache.height - 1, Math.max(0, kam.y * S));
  const srx = Math.min(sw * S, latarCache.width - sx);
  const sry = Math.min(sh * S, latarCache.height - sy);
  ctx.drawImage(latarCache, sx, sy, srx, sry, sx / S - _BG_M, sy / S - _BG_M, srx / S, sry / S);
}

// ---------- Lidah api kecil (3 lapis gradient) — dipakai Kobaran API Vender.
// Dipanggil di dalam bakeApi (ctx sementara = canvas sprite). ----------
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

// Gambar satu kobaran api ke ctx saat ini (dipakai saat bake; origin = (0,0)
// di titik dasar api, api menjulang ke atas).
function gambarApiPasifP(f, tAnim) {
  const fade = 1; // fade dikerjakan saat blit (globalAlpha luar)
  const skala = f.radius * (0.9 + 0.25 * Math.sin(tAnim * 8 + f.phase));
  const lidah = [
    { dx: -skala * 0.5, w: skala * 0.9, h: skala * 2.2, ph: 0.0, sway: 1.6 + Math.sin(tAnim * 5) * 2 },
    { dx: skala * 0.45, w: skala * 0.8, h: skala * 1.9, ph: 1.9, sway: -1.2 + Math.cos(tAnim * 6) * 1.5 },
    { dx: 0,            w: skala * 1.05, h: skala * 2.7, ph: 3.1, sway: 0.4 + Math.sin(tAnim * 7 + 1) * 2 }
  ];
  ctx.globalAlpha = fade;
  for (const L of lidah) {
    const flk = 0.65 + 0.35 * Math.sin(tAnim * 10 + L.ph);
    gambarLidahApi(f.x + L.dx, f.y, L.w, L.h * (0.8 + 0.3 * flk), L.sway);
  }
  ctx.globalAlpha = 1;
}

// Bake kobaran api jadi 20 frame sprite (0.05 dtk/frame = 20fps, loop 1 dtk) —
// sekali per kobaran, lalu tiap frame cukup drawImage dengan crossfade.
function bakeApi(f) {
  const K = 20, dtF = 0.05;
  const skalaMax = f.radius * 1.15;
  const Wd = Math.ceil(skalaMax * 1.35) * 2 + 14;
  const Hd = Math.ceil(skalaMax * 2.7) + 10;
  const frames = [];
  for (let j = 0; j < K; j++) {
    const cs = document.createElement("canvas");
    cs.width = Wd;
    cs.height = Hd;
    const csctx = cs.getContext("2d");
    const ctxAsli = ctx;
    ctx = csctx;
    try {
      csctx.translate(Wd / 2, Hd); // origin = tengah horizontal, dasar api
      const fv = { ...f, x: 0, y: 0 };
      gambarApiPasifP(fv, j * dtF);
    } finally {
      ctx = ctxAsli;
    }
    frames.push(cs);
  }
  f.frames = frames;
}

// Campur warna hex dengan porsi putih (p>0) / hitam (p<0) → warna slime.
function campurWarna(hex, p) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const m = (v) => Math.max(0, Math.min(255, Math.round(p >= 0 ? v + (255 - v) * p : v * (1 + p))));
  return "rgb(" + m(r) + "," + m(g) + "," + m(b) + ")";
}

// Bake 6 frame animasi slime ke canvas offscreen per musuh (cache sekali).
// Tiap frame = pose squash/jiggle berbeda; hasil-nya drawImage cepat tiap
// frame layar. Titik asal (0,0) canvas = pusat musuh (e.x, e.y).
function bakeSlimeFrames(e) {
  if (e.slimeFrameData) return e.slimeFrameData;
  const r = e.r;
  const warna = e.warna || "#ff5060";
  const lebar = Math.max(0.7, r * 2.1);
  const ting = Math.max(0.7, r * 1.7);
  const W = Math.ceil(lebar * 1.12 + 4);
  const H = Math.ceil(ting + r * 0.9 + 4);
  const JML = 6;
  const frames = [];
  for (let k = 0; k < JML; k++) {
    const cs = document.createElement("canvas");
    cs.width = W;
    cs.height = H;
    const g = cs.getContext("2d");
    // Pose frame k: sudut fasa + phBase agar tiap musuh tidak serempak.
    const ph = (k / JML) * Math.PI * 2 + e.phBase || 0;
    const ox = W / 2;                    // e.x
    const oy = H - r * 0.9 - 2;          // e.y (pusat musuh)
    const squash = Math.sin(ph);
    const jg = Math.sin(ph * 1.7) * 0.09;
    const bob = Math.abs(Math.cos(ph * 0.9)) * r * 0.05;
    const w = lebar * (1 + squash * 0.07);
    const h = ting * (1 - squash * 0.07);
    const yo = -bob;                     // naik-turun badan vs e.y
    const dasar = oy + r * 0.55 + yo;
    const atas = dasar - h;

    // Bayangan di tanah.
    g.fillStyle = "rgba(0, 0, 0, 0.28)";
    g.beginPath();
    g.ellipse(ox, oy + r * 0.72, w * 0.52, r * 0.16, 0, 0, Math.PI * 2);
    g.fill();

    // Badan jelly.
    g.beginPath();
    g.moveTo(ox - w / 2, dasar);
    g.quadraticCurveTo(ox - w / 2 - w * 0.02, dasar - h * 0.42, ox - w * 0.30, atas + h * 0.06);
    g.quadraticCurveTo(ox - w * 0.10, atas - h * 0.05, ox, atas);
    g.quadraticCurveTo(ox + w * 0.10, atas - h * 0.05, ox + w * 0.30, atas + h * 0.06);
    g.quadraticCurveTo(ox + w / 2 + w * 0.02, dasar - h * 0.42, ox + w / 2, dasar);
    g.closePath();
    const grd = g.createLinearGradient(0, atas, 0, dasar);
    grd.addColorStop(0, campurWarna(warna, 0.35));
    grd.addColorStop(0.55, warna);
    grd.addColorStop(1, campurWarna(warna, -0.25));
    g.fillStyle = grd;
    g.fill();

    // Lipatan bawah (2 gundukan) mengikuti fase.
    g.strokeStyle = "rgba(0, 0, 0, 0.18)";
    g.lineWidth = 2;
    g.beginPath();
    for (const s of [-1, 1]) {
      const gx = ox + s * w * 0.30;
      g.moveTo(gx, dasar - h * 0.14);
      g.quadraticCurveTo(gx + s * r * 0.18, dasar - h * 0.07 + jg * r, gx + s * w * 0.16, dasar);
    }
    g.stroke();

    // Cermin kilap di atas-kiri.
    g.fillStyle = "rgba(255, 255, 255, 0.35)";
    g.beginPath();
    g.ellipse(ox - w * 0.18 + jg * r * 0.6, atas + h * 0.18, w * 0.13, h * 0.09, -0.5, 0, Math.PI * 2);
    g.fill();

    frames.push(cs);
  }
  const data = { frames: frames, ox: W / 2, oy: H - r * 0.9 - 2 };
  e.slimeFrameData = data;
  return data;
}

// Slime (musuh digambar prosedural, pakai warna tipe masing-masing).
// 6 frame animasi sudah di-bake; di sini tinggal drawImage + mata dinamis
// yang tetap menghadap pemain. Hitbox tetap e.r.
function gambarSlime(e, tAnim) {
  let data = e.slimeFrameData;
  if (!data) {
    e.phBase = e.phBase !== undefined ? e.phBase : Math.abs(e.x * 0.9 + e.y * 0.35) * 0.7;
    data = bakeSlimeFrames(e);
  }
  const JML = data.frames.length;
  const t = tAnim * 6 + (e.phBase || 0);
  const i = Math.floor(t / (Math.PI * 2) * JML) % JML;
  const fr = data.frames[i];
  ctx.drawImage(fr, e.x - data.ox, e.y - data.oy);

  // Pose saat ini (samakan dengan frame terpilih) untuk posisi mata.
  const r = e.r, warna = e.warna || "#ff5060";
  const lebar = Math.max(0.7, r * 2.1), ting = Math.max(0.7, r * 1.7);
  const ph = (i / JML) * Math.PI * 2 + (e.phBase || 0);
  const squash = Math.sin(ph);
  const w = lebar * (1 + squash * 0.07);
  const h = ting * (1 - squash * 0.07);
  const bob = Math.abs(Math.cos(ph * 0.9)) * r * 0.05;
  const dasar = e.y + r * 0.55 - bob;
  const atas = dasar - h;

  // Mata arah pemain.
  const a = Math.atan2(player.y - e.y, player.x - e.x);
  const ex = Math.cos(a) * r * 0.30, ey = Math.sin(a) * r * 0.30;
  for (const s of [-1, 1]) {
    const mx = e.x + s * w * 0.22;
    const my = atas + h * 0.38;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(mx, my, r * 0.20, r * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#201822";
    ctx.beginPath();
    ctx.arc(mx + ex, my + ey, r * 0.10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.arc(mx + ex - r * 0.03, my + ey - r * 0.04, r * 0.035, 0, Math.PI * 2);
    ctx.fill();
  }
}

function draw() {
  _shakeX = 0;
  _shakeY = 0;
  ctx.save();

  // Kamera mengikuti pemain (batas → tepi dunia tidak kelihatan kosong).
  hitungKamera();

  if (shake > 0) {
    shake -= 1 / 60;
    _shakeX = (Math.random() - 0.5) * 8;
    _shakeY = (Math.random() - 0.5) * 8;
    ctx.translate(_shakeX, _shakeY);
  }

  // Seluruh isi DUNIA digambar dalam koordinat dunia; kamera menggesernya.
  ctx.translate(-kam.x, -kam.y);

  gambarLatar();

  // Animasi lingkungan map (bayangan awan, daun, hembusan angin, kilau).
  // Digambar dalam koordinat dunia, di bawah objek game.
  gambarAmbience();

  // (Batas dunia = dinding batu di-bake di buatLatarCache: statis,
  // ikut bergeser bersama tanah, tidak berkedip saat kamera digeser.)

  // Layar judul, pilih level, & pilih karakter: cukup latar + partikel dekoratif.
  if (statusGame === "title" || statusGame === "level" || statusGame === "select") {
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

  // Kobaran api pasif (ultimate Vender): animasi di-bake jadi 16 frame sprite
  // saat diciptakan — per frame cukup drawImage, tanpa gradient/path per-frame.
  for (const f of fires) {
    if (!f.frames) bakeApi(f);
    if (!f.frames) continue;
    const hidup = 1 - f.t / f.life;
    const fade = hidup < 0.2 ? hidup / 0.2 : 1;
    const fr = f.frames[0];
    blitX(f.frames, performance.now() / 1000, 20, Math.round(f.x - fr.width / 2), Math.round(f.y - fr.height), fade);
  }

  // Koridor BEKU PASIF (ultimate Kenzro): bentuk penuh (duri es, lapisan,
  // salju) di-bake SEKALI jadi sprite offscreen saat pertama digambar.
  // Setelah itu tiap frame cukup drawImage + source-rect sesuai reveal panah.
  ctx.save();
  let tNow = performance.now() / 1000;
  for (const fz of freezes) {
    // BAKU: gambar seluruh koridor (reveal penuh) ke canvas sprite.
    if (!fz.sprite) {
      const uOff = 44, vOff = fz.half + 45;
      const cs = document.createElement("canvas");
      cs.width = Math.ceil(fz.length + uOff + 48);
      cs.height = Math.ceil(vOff * 2 + 2);
      fz.uOff = uOff;
      fz.vOff = vOff;
      const csctx = cs.getContext("2d");
      const ctxAsli = ctx;
      const revealAsli = fz.reveal;
      fz.reveal = fz.length;        // isi penuh saat bake
      tNow = fz.seed;               // salju statis khas tiap koridor
      ctx = csctx;
      try {
        // world → sprite: sumbu-x sprite = arah n (maju panah), sumbu-y = arah p.
        // CATATAN: argumen setTransform adalah (a, b, c, d, e, f) dengan
        // x' = a·x + c·y + e ; y' = b·x + d·y + f.
        csctx.setTransform(
          fz.nx, fz.px, fz.ny, fz.py,
          uOff - fz.nx * fz.x0 - fz.ny * fz.y0,
          vOff - fz.px * fz.x0 - fz.py * fz.y0
        );
        // Seluruh gambar koridor di bawah berjalan dengan ctx = canvas sprite.
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
      } finally {
        fz.reveal = revealAsli;
        tNow = performance.now() / 1000;
        ctx = ctxAsli;
      }
      fz.sprite = cs;
    }
    // Blit sprite koridor: satu drawImage berpotongan sesuai reveal panah.
    const hidup = 1 - fz.t / fz.life;
    const fade = hidup < 0.2 ? hidup / 0.2 : 1;
    const effLen2 = Math.max(30, Math.min(fz.length, fz.reveal));
    const srcW = Math.max(10, effLen2 + fz.uOff);
    const spKor = fz.sprite;
    ctx.globalAlpha = fade;
    ctx.save();
    // sprite → world: piksel (0,0) sprite diletakkan di P0, sumbu-x = arah n.
    // Dikali ke transform KAMERA (pakai transform, bukan setTransform, agar
    // offset kamera tetap berlaku).
    ctx.transform(
      fz.nx, fz.ny, fz.px, fz.py,
      fz.x0 - fz.uOff * fz.nx - fz.vOff * fz.px,
      fz.y0 - fz.uOff * fz.ny - fz.vOff * fz.py
    );
    ctx.drawImage(spKor, 0, 0, srcW, spKor.height, 0, 0, srcW, spKor.height);
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  ctx.globalAlpha = 1;

  for (const e of enemies) {
    // Slime digambar prosedural dengan warna tipe (jiggle + lihat pemain).
    // Hitbox tetap e.r, ukuran render mengikuti r agar konsisten.
    gambarSlime(e, performance.now() / 1000);
    const sw = e.r * 2.1, sh = e.r * 1.7;
    // Flash overlay saat kena damage
    if (e.hitFlash > 0) {
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = "#ff4040";
      ctx.fillRect(e.x - sw / 2, e.y - sh / 2, sw, sh);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
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

    // ULTIMATE Vender: TEBASAN API RAKSASA 360° — gelombang kebakaran masif
    if (sl.burst) {
      const wSabit = tekstur[karakter.senjata];
      const rot = sl.t / sl.life;
      const tipA = sl.t < half ? a2 : a1;
      ctx.globalAlpha = Math.max(0.3, 1 - rot * 0.6);

      // 1. GELOMBANG KEBAKARAN — 3 lapis api radial bergradasi
      const fireLayers = [
        { r: 1.0, c1: "rgba(180, 20, 0, 0.25)", c2: "rgba(255, 60, 0, 0.12)" },
        { r: 0.75, c1: "rgba(255, 80, 0, 0.35)", c2: "rgba(255, 140, 0, 0.18)" },
        { r: 0.5, c1: "rgba(255, 160, 20, 0.45)", c2: "rgba(255, 210, 60, 0.22)" }
      ];
      for (const fl of fireLayers) {
        const fr = sl.reach * fl.r * (0.3 + 0.7 * rot);
        const g = ctx.createRadialGradient(sl.x, sl.y, 0, sl.x, sl.y, fr);
        g.addColorStop(0, fl.c1);
        g.addColorStop(0.6, fl.c2);
        g.addColorStop(1, "rgba(255, 100, 0, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(sl.x, sl.y);
        for (let i = 0; i <= 26; i++) {
          const t = i / 26;
          const a = a1 + span * t;
          const w = Math.sin(t * 18 + rot * 12) * 0.03;
          ctx.lineTo(sl.x + Math.cos(a + w) * fr, sl.y + Math.sin(a + w) * fr);
        }
        ctx.closePath();
        ctx.fill();
      }

      // 2. BILAH API TEBAL — 18 gelombang menyapu dengan wobble
      const B = 18;
      for (let b = 0; b < B; b++) {
        const a = a1 + span * (b / (B - 1));
        const panj = sl.reach * (0.5 + 0.5 * rot);
        const wb = Math.sin(b * 2.3 + rot * 15) * 8;
        ctx.save();
        ctx.translate(sl.x, sl.y);
        ctx.rotate(a);
        ctx.fillStyle = "rgba(200, 40, 0, 0.6)";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(panj * 0.92, -28 - wb);
        ctx.lineTo(panj, 0);
        ctx.lineTo(panj * 0.92, 28 + wb);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "rgba(255, 100, 10, 0.7)";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(panj * 0.85, -18 - wb * 0.6);
        ctx.lineTo(panj * 0.95, 0);
        ctx.lineTo(panj * 0.85, 18 + wb * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // 3. INTI KUNING TERANG — pusat ledakan
      const B2 = 14;
      for (let b = 0; b < B2; b++) {
        const a = a1 + span * (b / (B2 - 1));
        const panj = sl.reach * (0.3 + 0.45 * rot);
        ctx.save();
        ctx.translate(sl.x, sl.y);
        ctx.rotate(a);
        ctx.fillStyle = "#ffd75f";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(panj * 0.88, -14);
        ctx.lineTo(panj, 0);
        ctx.lineTo(panj * 0.88, 14);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // 4. PUSAT PUTIH MENYALA
      const coreR = sl.reach * 0.12 * rot;
      const gCore = ctx.createRadialGradient(sl.x, sl.y, 0, sl.x, sl.y, coreR);
      gCore.addColorStop(0, "rgba(255, 255, 220, 0.9)");
      gCore.addColorStop(0.4, "rgba(255, 200, 50, 0.5)");
      gCore.addColorStop(1, "rgba(255, 100, 0, 0)");
      ctx.fillStyle = gCore;
      ctx.beginPath();
      ctx.arc(sl.x, sl.y, coreR, 0, Math.PI * 2);
      ctx.fill();

      // 5. SABIT ASLI dibesarkan 12x, mengorbit
      if (wSabit) {
        const orbR = sl.reach * (0.55 + 0.45 * rot);
        const bx = sl.x + Math.cos(tipA) * orbR;
        const by = sl.y + Math.sin(tipA) * orbR;
        const skalaB = karakter.senjataSkala * 12;
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(tipA + Math.PI / 2);
        ctx.imageSmoothingEnabled = false;
        ctx.globalAlpha = Math.max(0.5, 1 - rot * 0.4);
        ctx.drawImage(wSabit, -wSabit.width * skalaB / 2, -wSabit.height * skalaB / 2, wSabit.width * skalaB, wSabit.height * skalaB);
        ctx.restore();
      }

      // 6. GELOMBANG KEJUT BERTINGKAT — 3 cincin
      const shockPhases = [
        { rMul: 0.3, rMax: 1.0, w: 10, col: "rgba(255, 220, 80, 0.9)" },
        { rMul: 0.2, rMax: 0.85, w: 6, col: "rgba(255, 140, 20, 0.7)" },
        { rMul: 0.1, rMax: 0.7, w: 3, col: "rgba(255, 80, 0, 0.5)" }
      ];
      for (const sp of shockPhases) {
        const sR = sl.reach * (sp.rMul + (sp.rMax - sp.rMul) * rot);
        ctx.strokeStyle = sp.col;
        ctx.lineWidth = sp.w * (1 - rot * 0.5);
        ctx.beginPath();
        ctx.arc(sl.x, sl.y, sR, a1, a1 + span);
        ctx.stroke();
      }

      // 7. PERCIKAN API — 22 bara beterbangan
      for (let i = 0; i < 22; i++) {
        const seed = i * 7.3 + 1.1;
        const sA = a1 + span * (Math.sin(seed) * 0.5 + 0.5);
        const sR = sl.reach * (0.4 + 0.6 * rot) + Math.sin(seed * 3.1) * 40;
        const ex = sl.x + Math.cos(sA) * sR;
        const ey = sl.y + Math.sin(sA) * sR;
        const sAlpha = Math.max(0, 1 - rot * 1.2) * (0.5 + 0.5 * Math.sin(seed * 4.3));
        ctx.fillStyle = i % 3 === 0 ? "#fff8d6" : (i % 3 === 1 ? "#ffb833" : "#ff4d17");
        ctx.globalAlpha = sAlpha;
        ctx.beginPath();
        ctx.arc(ex, ey, 2 + Math.sin(seed * 5.7) * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // 8. BARA jatuh dari busur
      for (let i = 0; i < 12; i++) {
        const eA = a1 + span * (i / 15);
        const eR = sl.reach * (0.6 + 0.4 * rot);
        const fallT = (rot * 3 + i * 0.5) % 1;
        const ex = sl.x + Math.cos(eA) * eR + Math.sin(i * 4.7) * 15 * fallT;
        const ey = sl.y + Math.sin(eA) * eR + fallT * 60;
        ctx.fillStyle = i % 2 === 0 ? "#ff6a00" : "#ffd23f";
        ctx.globalAlpha = Math.max(0, 1 - fallT) * (1 - rot * 0.5);
        ctx.fillRect(ex - 1.5, ey - 1.5, 3, 3);
      }

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
      ctx.scale(2, 2);
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
      const wTip = "#ffffff";
      const wBadan = b.beku ? "#9fd9ff" : "#d9d9d9";
      const wEkor = b.beku ? "#5cb0e8" : "#a9a9a9";
      ctx.fillStyle = wTip;
      ctx.fillRect(-2, -12, 4, 6);
      ctx.fillStyle = wBadan;
      ctx.fillRect(-2, -6, 4, 12);
      ctx.fillStyle = wEkor;
      ctx.fillRect(-4, 6, 8, 6);
    }
    ctx.restore();
  }

  // Senjata + Pemain. Saat pause/game over/pilih kartu tetap digambar agar adegan beku terlihat.
  if (karakter !== null && (statusGame === "main" || statusGame === "pause" || statusGame === "over" || statusGame === "upgrade")) {
    gambarSenjata();
    // Aura es saat buff panah pembeku aktif.
    if (player.specialBuff > 0) {
      ctx.strokeStyle = "rgba(125, 211, 252, 0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 48, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Aura dingin ultimate: wajah lebih terang & berdenyut.
    if (player.ultBuff) {
      const pu = 0.7 + 0.3 * Math.sin(performance.now() / 120);
      ctx.strokeStyle = "rgba(125, 211, 252, " + (0.85 * pu) + ")";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 60, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(191, 233, 255, " + (0.45 * pu) + ")";
      ctx.beginPath();
      ctx.arc(player.x, player.y, 84, 0, Math.PI * 2);
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
      // Animasi karakter: ATTACK > HIT > WALK/IDLE.
      const tAnim = performance.now() / 1000;
      let modeP, jmlF, fpsF;
      if (player.attackAnimT > 0) {
        modeP = "attack";
        jmlF = 4;
        fpsF = 16;
      } else if (player.hitFlash > 0) {
        modeP = "idle";
        jmlF = 1;
        fpsF = 1;
      } else {
        modeP = player.gerak ? "walk" : "idle";
        jmlF = 12;
        fpsF = player.gerak ? 12 : 4;
      }
      const idxF = Math.floor(tAnim * fpsF) % jmlF;
      const imgA = tekstur[karakter.kunci + "-" + modeP + "-" + idxF]
        || tekstur[karakter.kunci + "-idle-" + idxF]
        || tekstur[karakter.kunci];
      // Normalisasi ukuran render: target lebar dari hitbox (player.r),
      // tinggi menyesuaikan rasio aspek PNG. Resolusi file apa pun → tampil sama.
      const { lebar: szWr, tinggi: szHr } = ukuranSprite(imgA, player.r * karakter.skala * 4.6);
      ctx.drawImage(imgA, player.x - szWr / 2, player.y - szHr / 2, szWr, szHr);
      // Flash overlay saat kena damage
      if (player.hitFlash > 0) {
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = "#ff4040";
        ctx.fillRect(player.x - szWr / 2, player.y - szHr / 2, szWr, szHr);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }
    }
  }

  // Partikel efek
  for (const p of particles) {
    ctx.globalAlpha = 1 - p.t / p.life;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  // Efek pixel disintegration: potongan sprite beterbangan saat musuh mati
  for (const p of deathPixels) {
    ctx.globalAlpha = 1 - p.t / p.life;
    ctx.fillStyle = "rgb(" + p.r + "," + p.g + "," + p.b + ")";
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  // Jiwa hijau terang: berdenyut kecil (kosmetik, bisa diserap pemain).
  for (const s of souls) {
    const pulse = 0.6 + 0.4 * Math.sin(s.t * 6);
    ctx.globalAlpha = 0.35 * pulse;
    ctx.fillStyle = "#7cff5e";
    ctx.fillRect(s.x - 8, s.y - 8, 16, 16);
    ctx.globalAlpha = pulse;
    ctx.fillRect(s.x - 4, s.y - 4, 8, 8);
  }
  ctx.globalAlpha = 1;

  // Angka damage melayang: kuning = ke musuh, merah = ke karakter.
  const dmgFontSize = Math.round(W * 0.03);
  for (const dm of damages) {
    ctx.globalAlpha = 1 - dm.t / dm.life;
    ctx.font = "bold " + dmgFontSize + "px Zen Dots";
    ctx.textAlign = "center";
    ctx.lineWidth = Math.max(3, dmgFontSize * 0.22);
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
    const bw = W * 0.32, bh = H * 0.1;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(W / 2 - bw / 2, H / 2 - bh / 2, bw, bh);
    ctx.strokeStyle = "#ffd23f";
    ctx.lineWidth = Math.max(1, W * 0.002);
    ctx.strokeRect(W / 2 - bw / 2, H / 2 - bh / 2, bw, bh);
    ctx.fillStyle = "#ffd23f";
    ctx.font = "bold " + Math.round(W * 0.035) + "px Zen Dots";
    ctx.textAlign = "center";
    ctx.fillText(levelBanner.teks, W / 2, H / 2 + H * 0.005);
    ctx.fillStyle = "#fff";
    ctx.font = Math.round(W * 0.014) + "px Zen Dots";
    ctx.fillText("Habiskan semua musuh!", W / 2, H / 2 + H * 0.035);
    ctx.textAlign = "left";
    ctx.globalAlpha = 1;
  }

  drawHUD();

  // Layar pilih kartu upgrade antar gelombang.
  if (statusGame === "upgrade" && pilihanKartu && pilihanKartu.length) {
    gambarKartuUpgrade();
  }

  // Biner error agar mudah terlihat bila ada runtime error.
  if (errorBanner) {
    const errH = H * 0.04;
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, H - errH, W, errH);
    ctx.fillStyle = "#ff6b6b";
    ctx.font = "bold " + Math.round(W * 0.014) + "px Zen Dots";
    ctx.fillText("ERROR: " + errorBanner, W * 0.008, H - errH * 0.3);
  }
}

// KOBARAN API VENDER untuk SOUL METER saat penuh.
// Desain: api tinggi menjulang di kedua ujung (sayap/tanduk), pendek di tengah.
// Mendukung transisi pembakaran bertahap (burnProgress: 0.0 -> 1.0) dari hijau ke api membara.
let soulIgniteStart = null;

// ---------- Layar pilih kartu upgrade antar gelombang ----------
function gambarBundar(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function kartuDefById(id) {
  for (const k of KARTU_UPGRADE) if (k.id === id) return k;
  return null;
}

function gambarKartuUpgrade() {
  ctx.save();
  const t = (performance.now() - kartuMulaiPada) / 1000;
  const muncul = (i) => Math.max(0, Math.min(1, (t - 0.25 - i * 0.12) / 0.28));

  // Latar gelap: game di belakang membeku.
  ctx.fillStyle = "rgba(5, 8, 18, 0.78)";
  ctx.fillRect(0, 0, W, H);

  // Judul.
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ffd23f";
  ctx.font = "bold " + Math.round(W * 0.036) + "px Zen Dots";
  ctx.fillText("PILIH KARTU", W / 2, H * 0.28);

  // Kartu.
  const hoverIdx = kartuIndexDariKlik(mouse.sx, mouse.sy);
  for (let i = 0; i < pilihanKartu.length; i++) {
    const id = pilihanKartu[i];
    const kart = kartuDefById(id);
    if (!kart) continue;
    const r = rectKartuUpgrade(i);
    const a = muncul(i);
    const ay = (1 - a) * 34;
    const x = r.x, y = r.y + ay;
    const cx = x + r.w / 2;
    const hover = hoverIdx === i && a >= 1;
    const wr = kart.warna;

    ctx.globalAlpha = a;
    ctx.save();
    ctx.translate(cx, y);

    // Bayangan.
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    gambarBundar(-r.w / 2 + 4, 4, r.w, r.h, 12);
    ctx.fill();

    // Badan kartu remi: warna flat sesuai tier (common krem, rare biru,
    // epic ungu) — tanpa gradasi. Rare/epic: garis bingkai berwarna tier,
    // pendar lembut, dan ornamen agar mencolok.
    const tierDef = TIER_DEF[kart.tier || "common"] || TIER_DEF.common;
    const tGaris = tierDef.garis || "#59492f";
    const tAksen = tierDef.aksen || "#9a7b3c";
    const bg = tierDef.bg || TIER_DEF.common.bg;
    ctx.fillStyle = hover ? bg.hover : bg.gelap;
    if (kart.tier !== "common") { ctx.shadowColor = tGaris + "88"; ctx.shadowBlur = 20; }
    gambarBundar(-r.w / 2, 0, r.w, r.h, 12);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Bingkai rangkap (gaya kartu remi), menyala saat hover.
    if (hover) {
      ctx.shadowColor = wr + "aa";
      ctx.shadowBlur = 22;
    }
    ctx.strokeStyle = hover ? wr : tGaris;
    ctx.lineWidth = hover ? 3 : 1.5;
    gambarBundar(-r.w / 2, 0, r.w, r.h, 12);
    ctx.stroke();
    if (hover) ctx.shadowBlur = 0;
    ctx.strokeStyle = hover ? wr + "66" : tGaris + "55";
    ctx.lineWidth = hover ? 1.5 : 1;
    gambarBundar(-r.w / 2 + 6, 6, r.w - 12, r.h - 12, 8);
    ctx.stroke();

    // Ornamen tier: rare = belah ketupat biru + pita, epic = bintang emas + pita,
    // legend = pita + sinar gold + mahkota kecil (paling mencolok).
    if (kart.tier === "rare") {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold " + Math.round(r.w * 0.1) + "px Zen Dots";
      ctx.fillStyle = tAksen;
      ctx.globalAlpha = 0.9;
      ctx.fillText("\u25C6", -r.w / 2 + r.w * 0.15, -r.h / 2 + r.w * 0.18);
      ctx.fillText("\u25C6", r.w / 2 - r.w * 0.15, r.h / 2 - r.w * 0.18);
      ctx.font = Math.round(r.w * 0.05) + "px Zen Dots";
      ctx.globalAlpha = 0.35 * a;
      for (let q = 0; q < 3; q++) {
        ctx.fillText("\u25C6", r.w * (q - 1) * 0.33, r.h * 0.43 + r.w * 0.02);
      }
      ctx.globalAlpha = a;
    } else if (kart.tier === "epic") {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold " + Math.round(r.w * 0.1) + "px Zen Dots";
      ctx.fillStyle = tAksen;
      ctx.globalAlpha = 0.95 * a;
      ctx.fillText("\u2726", -r.w / 2 + r.w * 0.15, -r.h / 2 + r.w * 0.18);
      ctx.fillText("\u2726", r.w / 2 - r.w * 0.15, r.h / 2 - r.w * 0.18);
      ctx.fillStyle = "rgba(109, 40, 217, 0.18)";
      gambarBundar(-r.w * 0.36, r.h * 0.43, r.w * 0.72, r.h * 0.04, 5);
      ctx.fill();
      ctx.fillStyle = tAksen;
      ctx.font = Math.round(r.w * 0.045) + "px Zen Dots";
      ctx.globalAlpha = 0.6 * a;
      ctx.fillText("\u2726 \u2726 \u2726", 0, r.h * 0.43);
      ctx.globalAlpha = a;
    } else if (kart.tier === "legend") {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold " + Math.round(r.w * 0.1) + "px Zen Dots";
      ctx.fillStyle = tAksen;
      ctx.globalAlpha = 0.95 * a;
      // Mahkota di dua sudut berlawanan (kartu remi).
      ctx.fillText("\u265B", -r.w / 2 + r.w * 0.15, -r.h / 2 + r.w * 0.18);
      ctx.fillText("\u265B", r.w / 2 - r.w * 0.15, r.h / 2 - r.w * 0.18);
      // Pita emas di bawah + sulur sinar.
      ctx.fillStyle = "rgba(180, 120, 12, 0.20)";
      gambarBundar(-r.w * 0.36, r.h * 0.43, r.w * 0.72, r.h * 0.04, 5);
      ctx.fill();
      ctx.fillStyle = tAksen;
      ctx.font = "bold " + Math.round(r.w * 0.05) + "px Zen Dots";
      ctx.globalAlpha = 0.8 * a;
      ctx.fillText("\u2726 \u265B \u2726", 0, r.h * 0.43);
      ctx.globalAlpha = a;
    }

    // Sudut kartu (angka 1/2/3) seperti nilai kartu remi + diputar di kanan bawah.
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = hover ? wr : "#4a4237";
    ctx.font = "bold " + Math.round(r.w * 0.1) + "px Zen Dots";
    ctx.fillText(String(i + 1), -r.w / 2 + r.w * 0.07, -r.h / 2 + r.w * 0.11);
    ctx.save();
    ctx.translate(r.w / 2 - r.w * 0.07, r.h / 2 - r.w * 0.11);
    ctx.rotate(Math.PI);
    ctx.fillText(String(i + 1), 0, 0);
    ctx.restore();

    // Logo upgrade (ikon) di tengah atas.
    const ir = Math.round(r.w * 0.13);
    const icy = -r.h * 0.16;
    ctx.fillStyle = wr + "26";
    ctx.beginPath();
    ctx.arc(0, icy, ir, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = wr;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = wr;
    ctx.font = "bold " + Math.round(ir * 1.15) + "px Zen Dots";
    ctx.fillText(kart.ikon, 0, icy);

    // Nama kartu.
    ctx.font = "bold " + Math.round(r.w * 0.082) + "px Zen Dots";
    ctx.fillStyle = "#241f18";
    ctx.fillText(kart.nama, 0, r.h * 0.075);

    // Keterangan efek.
    ctx.font = Math.round(r.w * 0.05) + "px Zen Dots";
    ctx.fillStyle = "#4a4438";
    const kata = kart.ket.split(" ");
    let baris = "", garis = [];
    for (const wd of kata) {
      if (ctx.measureText(baris + wd).width > r.w * 0.82 && baris) { garis.push(baris); baris = wd; }
      else baris = baris ? baris + " " + wd : wd;
    }
    if (baris) garis.push(baris);
    for (let g = 0; g < Math.min(garis.length, 3); g++) {
      ctx.fillText(garis[g], 0, r.h * 0.2 + g * r.h * 0.075);
    }

    // Badge tumpukan kartu yang sama (xN) di atas tengah.
    const n = player.kartu[id] || 0;
    if (n > 0) {
      const bw = r.w * 0.24, bh = r.h * 0.1;
      ctx.fillStyle = wr;
      gambarBundar(-bw / 2, -r.h / 2 + r.w * 0.05, bw, bh, bh / 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold " + Math.round(bh * 0.6) + "px Zen Dots";
      ctx.textBaseline = "middle";
      ctx.fillText("x" + n, 0, -r.h / 2 + r.w * 0.05 + bh / 2);
    }

    ctx.restore();
  }
  ctx.globalAlpha = 1;

  ctx.restore();
}

function gambarApiPixel(px, py, pw, ph, t, burnProgress = 1.0, tanpGlow = false) {
  ctx.save();

  // 1. PENDAR PANAS (Thermal Aura & Ambient Bloom)
  // Saat bake, glow digambar live terpisah (1 gradient/frame) biar sprite kecil.
  if (!tanpGlow) {
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
  }

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
function gambarApiEs(px, py, pw, ph, t, freezeProgress = 1.0, tanpGlow = false) {
  ctx.save();

  // 1. KABUT DINGIN / FROST MIST (Hawa dingin membeku yang tenang)
  if (!tanpGlow) {
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
  }

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

// ==================== SOUL METER DI-BAKE JADI ANIMASI SPRITE ====================
// Saat soul penuh, efek api/es rayaan dirender SEKALI jadi ~13 frame sprite;
// tiap frame HUD hanya drawImage + 1 glow kecil (gradient) — bukan puluhan
// gradient/lidah/bara setiap frame.
const SOUL_ANIM_K = 20;
const SOUL_ANIM_RATE = 20;
let soulAnim = null; // { jenis: "api"|"es", frames, left, top }

function bakeSoulAnim(jenis, bw, bh) {
  let over, under, side;
  if (jenis === "api") {
    over = Math.ceil(bh * 5.6) + 6;   // lidah + bara yang naik tinggi
    under = Math.ceil(bh * 0.35) + 10;
    side = 12;
  } else {
    over = Math.ceil(bh * 1.4) + 14;  // pilar kristal (40px) + kilauan + margin
    under = Math.ceil(bh) + 64;       // icicles + salju turun di bawah bar
    side = 12;
  }
  const frames = [];
  for (let j = 0; j < SOUL_ANIM_K; j++) {
    const t = j / SOUL_ANIM_RATE;
    const cs = document.createElement("canvas");
    cs.width = bw + side * 2;
    cs.height = over + bh + under;
    const csctx = cs.getContext("2d");
    const ctxAsli = ctx;
    ctx = csctx;
    try {
      csctx.translate(side, over); // (0,0) = pojok kiri-atas bar
      if (jenis === "api") gambarApiPixel(0, 0, bw, bh, t, 1.0, true);
      else gambarApiEs(0, 0, bw, bh, t, 1.0, true);
    } finally {
      ctx = ctxAsli;
    }
    frames.push(cs);
  }
  return { jenis: jenis, frames: frames, left: side, top: over };
}

// Pendar/kabut di sekitar bar digambar live (1 gradient + 1 arc per frame —
// murah) agar sprite-nya tetap kecil tanpa tepian terpotong.
function gambarGlowBar(px, py, pw, ph, t, jenis, progress) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  if (jenis === "api") {
    const glowRadius = pw * (0.48 + 0.22 * progress);
    const denyutAura = (0.65 + 0.35 * Math.sin(t * 3.5)) * progress;
    const gl = ctx.createRadialGradient(px + pw / 2, py + ph / 2, 4, px + pw / 2, py + ph / 2, glowRadius);
    gl.addColorStop(0, "rgba(255, 140, 30, " + (0.45 * denyutAura) + ")");
    gl.addColorStop(0.4, "rgba(255, 60, 10, " + (0.25 * denyutAura) + ")");
    gl.addColorStop(0.75, "rgba(180, 20, 0, " + (0.09 * denyutAura) + ")");
    gl.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gl;
    ctx.beginPath();
    ctx.arc(px + pw / 2, py + ph / 2, glowRadius, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const mistW = pw * 0.68;
    const denyut = (0.55 + 0.35 * Math.sin(t * 2.2)) * progress;
    const gl = ctx.createRadialGradient(px + pw / 2, py + ph * 0.6, 2, px + pw / 2, py + ph * 0.6, mistW);
    gl.addColorStop(0, "rgba(125, 211, 252, " + (0.26 * denyut) + ")");
    gl.addColorStop(0.5, "rgba(56, 189, 248, " + (0.11 * denyut) + ")");
    gl.addColorStop(0.85, "rgba(2, 132, 199, " + (0.03 * denyut) + ")");
    gl.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gl;
    ctx.beginPath();
    ctx.arc(px + pw / 2, py + ph * 0.6, mistW, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Blit animasi sprite dengan crossfade antar-frame bake — tanpa lompatan step
// dan loop terlihat halus (morph) meski baking hanya 20fps.
function blitX(frames, t, rate, x, y, alpha) {
  const K = frames.length;
  const tf = t * rate;
  let i0 = Math.floor(tf) % K;
  if (i0 < 0) i0 += K;
  const i1 = (i0 + 1) % K;
  const fa = tf - Math.floor(tf);
  ctx.globalAlpha = alpha;
  ctx.drawImage(frames[i0], x, y);
  if (fa > 0.001) {
    ctx.globalAlpha = alpha * fa;
    ctx.drawImage(frames[i1], x, y);
  }
  ctx.globalAlpha = 1;
}

// Blit animasi soul dengan crossfade antar frame bake — tanpa lompatan step
// dan loop jadi terlihat halus (morph), bukan patah-patah.
function blitSoulFrame(frames, t, x, y, alpha) {
  blitX(frames, t, SOUL_ANIM_RATE, x, y, alpha);
}

// ---------- Transisi "ULTIMATE SIAP": ledakan ring + semburan sinar saat
// soul pertama kali penuh (dipakai di bawah/mendekati bar, GLOBAL COMPOSITE
// "lighter" biar menyala di atas latar gelap). ----------
function gambarBurstSoul(jenis, cx, cy, h, tNow, start) {
  if (start === null) return;
  const age = tNow - start;
  if (age <= 0 || age > 0.95) return;
  const q = 1 - age / 0.95; // fade 1 -> 0
  const w1 = jenis === "api" ? "255, 190, 80" : "226, 242, 254";
  const w2 = jenis === "api" ? "255, 80, 20" : "56, 189, 248";
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  // Cincin kejut 1 — meluas ke luar dari tengah bar.
  const R1 = h * (2.2 + age * 16);
  ctx.strokeStyle = "rgba(" + w1 + ", " + (0.5 * q).toFixed(3) + ")";
  ctx.lineWidth = Math.max(1, h * 0.55 * q);
  ctx.beginPath();
  ctx.arc(cx, cy, R1, 0, Math.PI * 2);
  ctx.stroke();

  // Cincin kejut 2 — lebih kecil, lebih cepat, mengejarnya.
  const R2 = h * (0.8 + age * 21);
  if (R2 > h * 1.5) {
    ctx.strokeStyle = "rgba(" + w2 + ", " + (0.4 * q).toFixed(3) + ")";
    ctx.lineWidth = Math.max(1, h * 0.35 * q);
    ctx.beginPath();
    ctx.arc(cx, cy, R2, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Semburan 8 sinar (starburst) berputar perlahan, menyebar ke luar.
  const L = h * (2.6 + age * 13);
  const rot = tNow * 2.4;
  ctx.fillStyle = "rgba(" + w2 + ", " + (0.45 * q).toFixed(3) + ")";
  ctx.beginPath();
  for (let k = 0; k < 8; k++) {
    const a = k * Math.PI / 4 + rot;
    const ca = Math.cos(a), sa = Math.sin(a);
    ctx.moveTo(cx - sa * h * 0.6, cy + ca * h * 0.6);
    ctx.lineTo(cx + ca * L, cy + sa * L);
    ctx.lineTo(cx + sa * h * 0.6, cy - ca * h * 0.6);
  }
  ctx.fill();

  // Inti putih menyala sesaat di tengah.
  ctx.fillStyle = "rgba(255, 255, 255, " + (0.55 * q).toFixed(3) + ")";
  ctx.beginPath();
  ctx.arc(cx, cy, h * 0.9, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Satu panah es (style panah raksasa Kenzro, diarahkan menghadap KANAN),
// origin = ujung runcing; sgr = skala (buat hantu/afterimage yang mengecil).
function gambarPanahEsSatuan(tipX, cy, h, alfa, sgr) {
  const m = sgr;
  const w2 = h * 0.6 * m, L = h * 3.4 * m, tj = h * 0.95 * m, hn = h * 0.45 * m;
  ctx.save();
  ctx.globalAlpha = alfa;
  ctx.globalCompositeOperation = "lighter";

  // 1. Aura pendar membungkus bagian depan.
  const gA = ctx.createLinearGradient(tipX - L, 0, tipX, 0);
  gA.addColorStop(0, "rgba(56, 189, 248, 0)");
  gA.addColorStop(0.7, "rgba(56, 189, 248, 0.3)");
  gA.addColorStop(1, "rgba(224, 242, 254, 0.55)");
  ctx.fillStyle = gA;
  ctx.beginPath();
  ctx.ellipse(tipX - L * 0.42, cy, L * 0.72, w2 * 1.7, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Lance putih runcing di ujung.
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(tipX, cy);
  ctx.lineTo(tipX - tj, cy - w2);
  ctx.lineTo(tipX - tj * 0.7, cy);
  ctx.lineTo(tipX - tj, cy + w2);
  ctx.fill();

  // 3. Lance inti lebih terang.
  ctx.fillStyle = "rgba(224, 242, 254, 0.95)";
  ctx.beginPath();
  ctx.moveTo(tipX, cy);
  ctx.lineTo(tipX - tj, cy - w2 * 0.5);
  ctx.lineTo(tipX - tj * 0.74, cy);
  ctx.lineTo(tipX - tj, cy + w2 * 0.5);
  ctx.fill();

  // 4. Bodi plasma: melebar di belakang lance, meruncing ke pangkal (tanpa ekor panjang).
  const bx0 = tipX - tj;
  const gB = ctx.createLinearGradient(bx0, 0, bx0 - L * 0.7, 0);
  gB.addColorStop(0, "#bfe9ff");
  gB.addColorStop(1, "rgba(125, 211, 252, 0.25)");
  ctx.fillStyle = gB;
  ctx.beginPath();
  ctx.moveTo(bx0, cy);
  ctx.lineTo(bx0, cy - w2);
  ctx.lineTo(tipX - L * 0.82, cy - hn * 0.9);
  ctx.lineTo(tipX - L * 0.9, cy);
  ctx.lineTo(tipX - L * 0.82, cy + hn * 0.9);
  ctx.lineTo(bx0, cy + w2);
  ctx.fill();

  // 5. Garis inti putih membara.
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.fillRect(tipX - L * 0.8, cy - hn * 0.22, L * 0.5, hn * 0.44);

  // 6. Ekor roket biru (di belakang = kiri) menyala lalu memudar.
  const glX = tipX - L * 0.9;
  const gE = ctx.createLinearGradient(glX, 0, glX - hn * 3.2, 0);
  gE.addColorStop(0, "rgba(224, 242, 254, 0.95)");
  gE.addColorStop(0.35, "rgba(125, 211, 252, 0.6)");
  gE.addColorStop(1, "rgba(56, 189, 248, 0)");
  ctx.fillStyle = gE;
  ctx.beginPath();
  ctx.moveTo(glX, cy - hn * 0.6);
  ctx.quadraticCurveTo(glX - hn * 1.1, cy - hn * 1.5, glX - hn * 2.4, cy);
  ctx.quadraticCurveTo(glX - hn * 1.1, cy + hn * 1.5, glX, cy + hn * 0.6);
  ctx.fill();

  ctx.restore();
}

// Transisi soul meter Kenzro: anak panah es menembus bar dari kiri ke kanan,
// bar "dibekukan" mengikuti ujungnya, lalu bloem kecil saat tiba di kanan.
function gambarPanahEsSoul(x0, wBar, cy, h, tNow, sweep, start) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const umur = start !== null ? tNow - start : 9999;
  if (sweep < 1) {
    const tipX = x0 + wBar * sweep;
    // Hantu di belakang panah utama (afterimage mengecil & memudar).
    gambarPanahEsSatuan(tipX - h * 4.1, cy, h, 0.28, 0.85);
    gambarPanahEsSatuan(tipX - h * 7.2, cy, h, 0.1, 0.7);
    // Panah utama di ujung sapuan.
    gambarPanahEsSatuan(tipX, cy, h, 1, 1);
    // Kilau tajam kecil tepat di mata panah.
    const sh1 = 0.6 + 0.4 * Math.sin(tNow * 25);
    ctx.fillStyle = "rgba(240, 253, 255, " + (0.75 * sh1).toFixed(3) + ")";
    ctx.beginPath();
    ctx.arc(tipX + h * 0.15, cy, h * (0.3 + 0.12 * sh1), 0, Math.PI * 2);
    ctx.fill();
    // Serpihan es beterbangan di belakang panah.
    for (let i = 0; i < 6; i++) {
      const fr = (i * 0.17 + tNow * 1.3) % 1;
      const fx = tipX - h * (0.5 + fr * 5);
      const fy = cy + Math.sin(fr * Math.PI * 2 + i) * h * 1.6 - h * 0.5;
      ctx.fillStyle = i % 2 === 0 ? "rgba(224, 242, 254, " + ((1 - fr) * 0.8).toFixed(3) + ")"
                                   : "rgba(125, 211, 252, " + ((1 - fr) * 0.6).toFixed(3) + ")";
      ctx.fillRect(fx, fy, h * 0.14, h * 0.14);
    }
  }
  // Bloem es saat ujung panah tiba di ujung kanan bar (0.4 dtk).
  if (umur >= 1.5 && umur < 1.9) {
    const tb = (umur - 1.5) / 0.4;
    const q = 1 - tb;
    const ex = x0 + wBar + h * 0.6;
    ctx.strokeStyle = "rgba(186, 230, 253, " + (0.55 * q).toFixed(3) + ")";
    ctx.lineWidth = Math.max(1, h * 0.4 * q);
    ctx.beginPath();
    ctx.arc(ex, cy, h * (1 + tb * 7), 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 255, 255, " + (0.5 * q).toFixed(3) + ")";
    ctx.beginPath();
    ctx.arc(ex, cy, h * (0.6 + tb * 1.2), 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 10; i++) {
      const angI = (i / 10) * Math.PI * 2;
      const rI = h * (1.5 + tb * 6);
      ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255," + (0.6 * q) + ")" : "rgba(125,211,252," + (0.45 * q) + ")";
      ctx.fillRect(ex + Math.cos(angI) * rI, cy + Math.sin(angI) * rI, h * 0.12, h * 0.12);
    }
  }
  ctx.restore();
}

// ---------- Efek berkelanjutan saat soul PENUH (digambar di atas sprite):
// border energi berjalan, kilau menyapu, bara/salju melayang, glint sudut. ---
function gambarNyalaSoul(jenis, x, y, w, h, tNow) {
  const kunci = jenis === "api" ? "255, 200, 80" : "186, 230, 253";
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  // 1. Border energi berjalan mengelilingi bar (marching lights).
  ctx.setLineDash([w * 0.22, w * 0.16]);
  ctx.lineDashOffset = -tNow * w * 0.8;
  ctx.strokeStyle = "rgba(" + kunci + ", 0.75)";
  ctx.lineWidth = Math.max(1, h * 0.05);
  ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
  ctx.setLineDash([]);

  // 2. Bara naik di atas bar (api) / salju turun ke bar (es) — 12 titik.
  for (let i = 0; i < 12; i++) {
    const ph = (tNow * 0.9 + i * 0.61) % 1;
    const xi = x + w * 0.12 + w * 0.76 * ((i * 97) % 100) / 100 + Math.sin(tNow * 2 + i * 1.7) * 3;
    const a = Math.sin(ph * Math.PI);
    const yi = jenis === "api"
      ? y + h - 5 - ph * (h + 48)
      : y - 36 + ph * (h + 36);
    const colr = jenis === "api"
      ? (i % 3 === 0 ? "255, 248, 214" : (i % 3 === 1 ? "255, 184, 51" : "255, 77, 23"))
      : (i % 3 === 0 ? "255, 255, 255" : (i % 3 === 1 ? "224, 242, 254" : "125, 211, 252"));
    ctx.fillStyle = "rgba(" + colr + ", " + (0.85 * a).toFixed(3) + ")";
    ctx.fillRect(xi - 1.2, yi - 1.2, 2.4, 2.4);
  }

  // 3. Kilau terang menyapu dari kiri ke kanan di tepi atas bar.
  const sw = (tNow * 0.55) % 1.4;
  if (sw < 0.6) {
    const t2 = sw / 0.6;
    const sx0 = x - w * 0.5 + t2 * (w * 1.5);
    ctx.fillStyle = "rgba(255, 255, 255, " + (0.16 * Math.sin(t2 * Math.PI)).toFixed(3) + ")";
    ctx.fillRect(sx0, y + 1.5, w * 0.5, Math.max(2, h * 0.12));
  }

  // 4. Glint berlian kecil di keempat sudut.
  const pulse = 0.35 + 0.3 * Math.sin(tNow * 5);
  ctx.fillStyle = "rgba(" + kunci + ", " + pulse.toFixed(3) + ")";
  const gl = Math.max(2.5, h * 0.14);
  ctx.beginPath();
  for (const pair of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) {
    ctx.moveTo(pair[0] - gl, pair[1]);
    ctx.lineTo(pair[0], pair[1] - gl);
    ctx.lineTo(pair[0] + gl, pair[1]);
    ctx.lineTo(pair[0], pair[1] + gl);
  }
  ctx.fill();

  ctx.restore();
}

function drawHUD() {
  // ---------- Skala proporsional terhadap canvas ----------
  const sx = W / 1280;
  const sy = H / 960;
  const s  = Math.min(sx, sy) * 1.35;  // 1.35x agar lebih besar di layar
  const m  = Math.round(20 * s);   // margin umum
  const fs = (px) => Math.round(px * s); // font size helper

  // ---------- HP BAR (kiri atas) ----------
  const hpX = m, hpY = m;
  const hpBarW = Math.round(264 * s), hpBarH = Math.round(28 * s);
  const hpFillW = hpBarW - Math.round(8 * s);
  const hpFillH = hpBarH - Math.round(8 * s);
  const hpFillX = hpX + Math.round(4 * s);
  const hpFillY = hpY + Math.round(4 * s);

  ctx.fillStyle = "#000";
  ctx.fillRect(hpX, hpY, hpBarW, hpBarH);
  ctx.fillStyle = "#ef4444";
  ctx.fillRect(hpFillX, hpFillY, hpFillW * (player.hp / player.maxHp), hpFillH);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = Math.max(1, Math.round(2 * s));
  ctx.strokeRect(hpX + Math.round(1 * s), hpY + Math.round(1 * s), hpBarW - Math.round(2 * s), hpBarH - Math.round(2 * s));

  // Angka HP di dalam bar (sistem yang sama: latar belakang gelap → putih,
  // terang → gelap). Karena fill merah & dasar hitam sama-sama gelap,
  // angkanya putih di kedua sisi agar terbaca.
  ctx.save();
  ctx.font = "bold " + fs(20) + "px Zen Dots";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const hpEdge = hpFillX + hpFillW * (player.hp / player.maxHp);
  ctx.fillStyle = "#fff";
  ctx.fillText(Math.round(player.hp) + "/" + player.maxHp, hpX + hpBarW / 2, hpY + hpBarH / 2);
  ctx.restore();

  // Label "HP"
  ctx.font = fs(28) + "px Zen Dots";
  ctx.fillStyle = "#fff";
  ctx.fillText("HP", hpX + hpBarW + Math.round(12 * s), hpY + hpBarH * 0.85);

  // ---------- INFO BOX (kanan atas): nama karakter, wave, sisa musuh ----------
  const infoW = Math.round(380 * s);
  const infoPad = Math.round(16 * s);
  const infoLineH = Math.round(32 * s);
  const infoBaris = 3;
  const infoH = Math.round(infoPad * 2 + infoLineH * infoBaris + fs(8));
  const infoX = W - infoW - m, infoY = m;

  ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
  ctx.fillRect(infoX, infoY, infoW, infoH);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  ctx.lineWidth = Math.max(1, Math.round(2 * s));
  ctx.strokeRect(infoX + Math.round(1 * s), infoY + Math.round(1 * s), infoW - Math.round(2 * s), infoH - Math.round(2 * s));

  ctx.font = "bold " + fs(24) + "px Zen Dots";
  ctx.textAlign = "left";
  if (karakter) {
    ctx.fillStyle = "#ffd23f";
    ctx.fillText(karakter.nama.toUpperCase(), infoX + infoPad, infoY + infoPad + fs(4));
  }
  const sisa = Math.max(0, LEVELS[level].jumlah - (levelSpawn - enemies.length));
  ctx.fillStyle = "#ffd23f";
  ctx.fillText("WAVES " + (level - waveMulaiLevel() + 1) + "/" + totalWaveLevel(), infoX + infoPad, infoY + infoPad + infoLineH);
  ctx.fillStyle = "#fff";
  ctx.fillText("MUSUH " + sisa, infoX + infoPad, infoY + infoPad + infoLineH * 2);
  ctx.textAlign = "left";

  // ---------- SKILL BAR (bawah HP bar) ----------
  const namaSkill = karakter && karakter.tipe === "jarak" ? "FROSTBITE" : "HEATWAVE";
  const warnaSkill = karakter && karakter.tipe === "jarak" ? "#7dd3fc" : "#ffd23f";
  const skY = hpY + hpBarH + Math.round(8 * s);
  const skBarW = hpBarW, skBarH = hpBarH;
  const skFillW = skBarW - Math.round(8 * s);
  const skFillH = skBarH - Math.round(8 * s);
  const skFillX = hpX + Math.round(4 * s);
  const skFillY = skY + Math.round(4 * s);
  const ratio = 1 - player.specialCd / player.specialMax;

  ctx.fillStyle = "#000";
  ctx.fillRect(hpX, skY, skBarW, skBarH);
  ctx.fillStyle = warnaSkill;
  ctx.fillRect(skFillX, skFillY, skFillW * ratio, skFillH);
  ctx.font = "bold " + fs(22) + "px Zen Dots";
  if (player.specialCd > 0) {
    ctx.textAlign = "right";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = Math.max(1, Math.round(2 * s));
    ctx.strokeText(player.specialCd.toFixed(1), hpX + skBarW - Math.round(4 * s), skY + skBarH * 0.7);
    ctx.fillStyle = "#fff";
    ctx.fillText(player.specialCd.toFixed(1), hpX + skBarW - Math.round(4 * s), skY + skBarH * 0.7);
    ctx.textAlign = "left";
  } else {
    ctx.textAlign = "center";
    ctx.fillStyle = "#0d1219";
    ctx.fillText(namaSkill, hpX + skBarW / 2, skY + skBarH * 0.7);
    ctx.textAlign = "left";
  }

  // ---------- NOTA KARTU (mode HP: sidebar disembunyikan) ----------
  // Upgrade yang sudah diambil ditampilkan sebagai teks ringkas di kiri
  // atas (mis. "+15% damage serangan"), supaya tetap terbaca di game.
  if (deviceTerpilih === "mobile" && statusGame === "main" && player && player.kartu) {
    const kartu = player.kartu;
    const ids = Object.keys(kartu);
    if (ids.length > 0) {
      const nota = [];
      for (const id in kartu) {
        const k = KARTU_UPGRADE.find((c) => c.id === id);
        if (!k) continue;
        const tierDef = TIER_DEF[k.tier || "common"] || TIER_DEF.common;
        nota.push({ teks: k.ket, warna: tierDef.gem || "#f3e5c0", jml: kartu[id] });
      }
      if (nota.length > 0) {
        const nx = hpX;
        const ny = skY + skBarH + Math.round(10 * s);
        const lh = Math.round(18 * s);
        const pad = Math.round(8 * s);
        const lebar = hpBarW;
        const tinggi = pad * 2 + lh * nota.length;
        ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
        ctx.fillRect(nx, ny, lebar, tinggi);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
        ctx.lineWidth = Math.max(1, Math.round(1 * s));
        ctx.strokeRect(nx + 0.5, ny + 0.5, lebar - 1, tinggi - 1);
        ctx.font = "bold " + fs(13) + "px Zen Dots";
        ctx.textBaseline = "middle";
        nota.forEach((b, i) => {
          const ty = ny + pad + lh * i + lh / 2;
          ctx.fillStyle = b.warna;
          ctx.fillText("\u25C6", nx + Math.round(7 * s), ty);
          ctx.fillStyle = "#e6edf5";
          ctx.fillText(b.teks + (b.jml > 1 ? " \u00D7" + b.jml : ""), nx + Math.round(18 * s), ty);
        });
        ctx.textBaseline = "alphabetic";
      }
    }
  }

  // ---------- SOUL METER (bawah tengah) ----------
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

  // Sapuan panah es untuk transisi: lambat (1.5 dtk, ease out), terpisah dari
  // freezeProgress (yang mengendalikan efek soul meter lama 0.75 dtk).
  const esSweep = soulFreezeStart !== null
    ? 1 - Math.pow(1 - Math.min(1, (tNow - soulFreezeStart) / 1.5), 3)
    : 1;

  ctx.fillStyle = "#000";
  ctx.fillRect(bxS, byS, bwS, bhS);
  if (apiMenyala) {
    if (!soulAnim || soulAnim.jenis !== "api") {
      soulAnim = bakeSoulAnim("api", bwS, bhS);
    }
    gambarGlowBar(bxS, byS, bwS, bhS, tNow, "api", burnProgress);
    gambarBurstSoul("api", bxS + bwS / 2, byS + bhS / 2, bhS, tNow, soulIgniteStart);
    blitSoulFrame(soulAnim.frames, tNow, bxS - soulAnim.left, byS - soulAnim.top, Math.min(1, burnProgress * 1.4));
    gambarNyalaSoul("api", bxS, byS, bwS, bhS, tNow);
  } else if (esMenyala) {
    if (!soulAnim || soulAnim.jenis !== "es") {
      soulAnim = bakeSoulAnim("es", bwS, bhS);
    }
    // Efek soul meter LAMA tetap utuh & langsung kelihatan (fade-in 0.75 dtk
    // seperti sebelumnya) — seluruh bar terisi es membara.
    gambarGlowBar(bxS, byS, bwS, bhS, tNow, "es", freezeProgress);
    blitSoulFrame(soulAnim.frames, tNow, bxS - soulAnim.left, byS - soulAnim.top, Math.min(1, freezeProgress * 1.4));
    gambarNyalaSoul("es", bxS, byS, bwS, bhS, tNow);
    // Anak panah es HANYA animasi transisi di ATAS bar (tidak mengganti/
    // menghilangkan efek lama) — menyapu kiri → kanan pelan, + bloem di ujung.
    gambarPanahEsSoul(bxS, bwS, byS + bhS / 2, bhS, tNow, esSweep, soulFreezeStart);
  } else {
    soulAnim = null;
    ctx.fillStyle = "#7cff5e";
    ctx.fillRect(bxS + 2, byS + 2, (bwS - 4) * Math.min(1, soul / SOUL_MAX), bhS - 4);
  }

  const soulFont = "bold " + fs(22) + "px Zen Dots";
  if (apiMenyala) {
    ctx.strokeStyle = "#ffe27a";
    ctx.lineWidth = Math.max(1, Math.round(1.5 * s));
    ctx.strokeRect(bxS + 0.5, byS + 0.5, bwS - 1, bhS - 1);
    ctx.font = soulFont;
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255, 235, 140, 0.85)";
    ctx.fillText("SOUL METER", bxS + bwS / 2, byS + bhS / 2 + fs(10));
    ctx.fillStyle = "#260601";
    ctx.fillText("SOUL METER", bxS + bwS / 2, byS + bhS / 2 + fs(8));
    ctx.textAlign = "left";
  } else if (esMenyala) {
    ctx.strokeStyle = "#bae6fd";
    ctx.lineWidth = Math.max(1, Math.round(1.5 * s));
    ctx.strokeRect(bxS + 0.5, byS + 0.5, bwS - 1, bhS - 1);
    ctx.font = soulFont;
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(186, 230, 253, 0.9)";
    ctx.fillText("SOUL METER", bxS + bwS / 2, byS + bhS / 2 + fs(10));
    ctx.fillStyle = "#032030";
    ctx.fillText("SOUL METER", bxS + bwS / 2, byS + bhS / 2 + fs(8));
    ctx.textAlign = "left";
  } else {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = Math.max(1, s);
    ctx.strokeRect(bxS + 0.5, byS + 0.5, bwS - 1, bhS - 1);
    ctx.font = soulFont;
    ctx.textAlign = "center";
    ctx.fillStyle = "#14532d";
    ctx.fillText("SOUL METER", bxS + bwS / 2, byS + bhS / 2 + fs(8));
    ctx.textAlign = "left";
  }

  if (soul >= SOUL_MAX && deviceTerpilih !== "mobile") {
    ctx.font = soulFont;
    ctx.textAlign = "center";
    const ignT = apiMenyala ? soulIgniteStart : (esMenyala ? soulFreezeStart : null);
    const umurText = ignT !== null ? tNow - ignT : 9999;
    const pop = umurText < 0.8 ? 1 + 0.32 * Math.pow(1 - umurText / 0.8, 2) : 1;
    ctx.save();
    ctx.translate(bxS + bwS / 2, byS + bhS + fs(24));
    ctx.scale(pop, pop);
    const pulse = 0.65 + 0.35 * Math.sin(tNow * 6);
    const gl = apiMenyala ? "255, 140, 63" : (esMenyala ? "125, 211, 252" : "255, 210, 63");
    if (apiMenyala) {
      ctx.fillStyle = "rgba(255, 215, 60, " + (pulse * burnProgress) + ")";
    } else if (esMenyala) {
      ctx.fillStyle = "rgba(186, 230, 253, " + (pulse * freezeProgress) + ")";
    } else {
      ctx.fillStyle = "#ffd23f";
    }
    ctx.fillText("ULTIMATE SIAP [R]", 0, 0);
    if (umurText < 0.8 && (apiMenyala || esMenyala)) {
      ctx.shadowColor = "rgba(" + gl + ", 0.9)";
      ctx.shadowBlur = 18;
      ctx.fillStyle = "rgba(255, 255, 255, " + (0.6 * (1 - umurText / 0.8)).toFixed(3) + ")";
      ctx.fillText("ULTIMATE SIAP [R]", 0, 0);
      ctx.shadowBlur = 0;
    }
    ctx.restore();
    ctx.textAlign = "left";
  }

  // ---------- DASH UI (kanan bawah) ----------
  // Di mode HP tombol dash sudah ada di kontrol sentuh — cukup satu saja.
  if (deviceTerpilih !== "mobile") {
  const dashR = Math.round(60 * s);
  const cx = W - dashR - Math.round(28 * s);
  const cy = H - dashR - Math.round(28 * s);
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.beginPath();
  ctx.arc(cx, cy, dashR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = Math.max(1, Math.round(3 * s));
  ctx.beginPath();
  ctx.arc(cx, cy, dashR, 0, Math.PI * 2);
  ctx.stroke();

  const skalaSepatu = s * 1.6;
  const gambarSepatu = (sx, sy, bad, sol, tali) => {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(skalaSepatu, skalaSepatu);
    ctx.fillStyle = bad;
    ctx.beginPath();
    ctx.moveTo(-10, 5);
    ctx.lineTo(-10, -2);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-1, -5);
    ctx.lineTo(2, 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = sol;
    ctx.fillRect(-10, 5, 21, 5);
    ctx.fillStyle = tali;
    ctx.fillRect(-6, -4, 9, 3);
    ctx.fillRect(-5, -1, 9, 3);
    ctx.restore();
  };

  // Warna aksen dash mengikuti palet karakter (kenzro: biru es, vender: merah).
  const warnaDash = (karakter && karakter.warnaDash) ||
    (karakter && karakter.tipe === "dekat" ? "#ff4d4d" : "#7dd3fc");

  // Sepatu pusat: satu saja, berwarna palet karakter.
  gambarSepatu(cx, cy, warnaDash, "#0c0f1e", "#ffffff");

  // Titik charge MELINGKAR tepat di GARIS TEPI lingkaran indikator: jumlah
  // = dashMax (dasar karakter + kartu DASH +1). Titik yang tersedia berwarna
  // palet, yang masih kosong/terisi transparan.
  const nMax = Math.max(1, player.dashMax || 1);
  const rDot = Math.max(1, Math.round(7 * s));
  for (let i = 0; i < nMax; i++) {
    const sudut = -Math.PI / 2 + (i * Math.PI * 2) / nMax;
    // Jari-jari = dashR: titik duduk sejajar dengan garis tepi lingkaran.
    const dx = cx + Math.cos(sudut) * dashR;
    const dy = cy + Math.sin(sudut) * dashR;
    const siap = i < player.dashStacks;
    ctx.fillStyle = siap ? warnaDash : "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.arc(dx, dy, rDot, 0, Math.PI * 2);
    ctx.fill();
    if (siap) {
      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.lineWidth = Math.max(1, Math.round(1 * s));
      ctx.stroke();
    }
  }

  // Teks cooldown di tengah indikator bila sedang mengisi.
  if (player.dashCd > 0) {
    ctx.font = "bold " + fs(30) + "px Zen Dots";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.fillText(player.dashCd.toFixed(1), cx, cy + Math.round(16 * s));
    ctx.textAlign = "left";
  }
  }
}