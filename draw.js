let _kvWadah = null;
let winKonfeti = [];
let winFlash = 0;

function mulaiKonfeti(jumlah, durasi) {
  if (jumlah == null) jumlah = 80;
  if (durasi == null) durasi = 3.5;
  const warna = ["#ffd23f", "#ffb020", "#ff6a3a", "#4ade80", "#38bdf8", "#f472b6", "#f8fafc"];
  const rumah = document.querySelector(".posisi-game") || document.body;
  if (_kvWadah && _kvWadah.isConnected) _kvWadah.remove();
  _kvWadah = document.createElement("div");
  _kvWadah.className = "konfeti-wadah";
  const wadah = _kvWadah;
  for (let i = 0; i < jumlah; i++) {
    const b = document.createElement("span");
    const bentuk = Math.random() < 0.7 ? "kotak" : (Math.random() < 0.5 ? "bulat" : "zet");
    const warnaPilih = warna[Math.floor(Math.random() * warna.length)];
    const s = 5 + Math.random() * 9;
    const jt = durasi * (0.6 + Math.random() * 0.5);
    let isi = "";
    if (bentuk === "zet") {
      isi = "width:" + Math.round(s * 0.6) + "px;height:" + Math.round(s) + "px;" +
        "box-shadow:" + Math.round(s * 0.6) + "px 0 0 " + warnaPilih + ";";
    } else if (bentuk === "bulat") {
      isi = "width:" + Math.round(s) + "px;height:" + Math.round(s) + "px;border-radius:50%;background:" + warnaPilih + ";";
    } else {
      isi = "width:" + Math.round(s) + "px;height:" + Math.round(s * 0.6) + "px;background:" + warnaPilih + ";";
    }
    b.setAttribute(
      "style",
      "left:" + (Math.random() * 100).toFixed(2) + "%;top:-" + (3 + Math.random() * 6).toFixed(2) + "%;" +
      isi +
      "--kvsway:" + Math.round((Math.random() - 0.5) * 140) + "px;" +
      "--kvrot:" + Math.round(220 + Math.random() * 540) + "deg;" +
      "animation:konfetiJatuh " + jt.toFixed(2) + "s linear " + (-Math.random() * 1.2).toFixed(2) + "s forwards;"
    );
    if (Math.random() > 0.85) b.classList.add("konfeti-rintik");
    if (i < 12 && bentuk !== "zet") b.classList.add("konfeti-bintang");
    wadah.appendChild(b);
  }
  if (window.matchMedia && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const kilat = document.createElement("div");
    kilat.className = "konfeti-kilat";
    wadah.appendChild(kilat);
  }
  rumah.appendChild(wadah);
  winKonfeti.length = jumlah;
  winFlash = Math.min(1, winFlash + 0.45);
  setTimeout(() => { if (_kvWadah === wadah && wadah.isConnected) wadah.remove(); if (_kvWadah === wadah) _kvWadah = null; }, Math.round((durasi + 1) * 1000));
}

function hentikanKonfeti() {
  if (_kvWadah && _kvWadah.isConnected) _kvWadah.remove();
  _kvWadah = null;
  winKonfeti = [];
  winFlash = 0;
}

function gambarSenjata() {
  const img = tekstur[karakter.senjata];
  if (!img) return;

  const skala = karakter.senjataSkala || karakter.skala || 1;
  const { lebar: w, tinggi: h } = ukuranSprite(img, player.r * 6 * skala);
  const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

  const jarak = 48;

  ctx.save();
  ctx.translate(
    Math.round(player.x + Math.cos(angle) * jarak),
    Math.round(player.y + Math.sin(angle) * jarak)
  );

  ctx.imageSmoothingEnabled = w < img.width || h < img.height;
  if (ctx.imageSmoothingEnabled) ctx.imageSmoothingQuality = "medium";
  let rotTotal = angle + (karakter.rot || 0);

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

const _BG_M = 16;
let latarCache = null;

let latarDirty = false;

function latarSkala() {
  return typeof deviceTerpilih === "string" && deviceTerpilih === "mobile" ? 0.5 : 1;
}
let latarSkalaTerpakai = 0;

function buatLatarCache() {
  const S = latarSkala();

  if (latarCache && latarSkalaTerpakai === S && !latarDirty) return;
  latarSkalaTerpakai = S;
  latarDirty = false;
  const c = document.createElement("canvas");

  c.width = Math.max(2, Math.ceil((WORLD_W + _BG_M * 2) * S));
  c.height = Math.max(2, Math.ceil((WORLD_H + _BG_M * 2) * S));
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  const M = _BG_M;
  const cw = WORLD_W + _BG_M * 2, chh = WORLD_H + _BG_M * 2;

  g.fillStyle = MAP_ASSET.warnaTanah;
  g.fillRect(0, 0, cw, chh);

  if (petaSiap && petaImage) {
    g.drawImage(petaImage, M * S, M * S, WORLD_W * S, WORLD_H * S);
  }

  latarCache = c;
}

function gambarLatar() {
  buatLatarCache();

  const S = latarSkala();
  const sw = W + _BG_M * 2;
  const sh = H + _BG_M * 2;

  const sx = Math.min(latarCache.width - 1, Math.max(0, kam.x * S));
  const sy = Math.min(latarCache.height - 1, Math.max(0, kam.y * S));
  const srx = Math.min(sw * S, latarCache.width - sx);
  const sry = Math.min(sh * S, latarCache.height - sy);
  ctx.drawImage(latarCache, sx, sy, srx, sry, sx / S - _BG_M, sy / S - _BG_M, srx / S, sry / S);
}

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

function gambarApiPasifP(f, tAnim) {
  const fade = 1;
  const skala = f.radius * (0.9 + 0.25 * Math.sin(tAnim * 8 + f.phase));
  const lidah = [
    { dx: -skala * 0.5, w: skala * 0.9, h: skala * 2.2, ph: 0.0, sway: 1.6 + Math.sin(tAnim * 5) * 2 },
    { dx: skala * 0.45, w: skala * 0.8, h: skala * 1.9, ph: 1.9, sway: -1.2 + Math.cos(tAnim * 6) * 1.5 },
    { dx: 0, w: skala * 1.05, h: skala * 2.7, ph: 3.1, sway: 0.4 + Math.sin(tAnim * 7 + 1) * 2 }
  ];
  ctx.globalAlpha = fade;
  for (const L of lidah) {
    const flk = 0.65 + 0.35 * Math.sin(tAnim * 10 + L.ph);
    gambarLidahApi(f.x + L.dx, f.y, L.w, L.h * (0.8 + 0.3 * flk), L.sway);
  }
  ctx.globalAlpha = 1;
}

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
      csctx.translate(Wd / 2, Hd);
      const fv = { ...f, x: 0, y: 0 };
      gambarApiPasifP(fv, j * dtF);
    } finally {
      ctx = ctxAsli;
    }
    frames.push(cs);
  }
  f.frames = frames;
}

function campurWarna(hex, p) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const m = (v) => Math.max(0, Math.min(255, Math.round(p >= 0 ? v + (255 - v) * p : v * (1 + p))));
  return "rgb(" + m(r) + "," + m(g) + "," + m(b) + ")";
}

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

    const ph = (k / JML) * Math.PI * 2 + e.phBase || 0;
    const ox = W / 2;
    const oy = H - r * 0.9 - 2;
    const squash = Math.sin(ph);
    const jg = Math.sin(ph * 1.7) * 0.09;
    const bob = Math.abs(Math.cos(ph * 0.9)) * r * 0.05;
    const w = lebar * (1 + squash * 0.07);
    const h = ting * (1 - squash * 0.07);
    const yo = -bob;
    const dasar = oy + r * 0.55 + yo;
    const atas = dasar - h;

    g.fillStyle = "rgba(0, 0, 0, 0.28)";
    g.beginPath();
    g.ellipse(ox, oy + r * 0.72, w * 0.52, r * 0.16, 0, 0, Math.PI * 2);
    g.fill();

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

    g.strokeStyle = "rgba(0, 0, 0, 0.18)";
    g.lineWidth = 2;
    g.beginPath();
    for (const s of [-1, 1]) {
      const gx = ox + s * w * 0.30;
      g.moveTo(gx, dasar - h * 0.14);
      g.quadraticCurveTo(gx + s * r * 0.18, dasar - h * 0.07 + jg * r, gx + s * w * 0.16, dasar);
    }
    g.stroke();

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

  const r = e.r, warna = e.warna || "#ff5060";
  const lebar = Math.max(0.7, r * 2.1), ting = Math.max(0.7, r * 1.7);
  const ph = (i / JML) * Math.PI * 2 + (e.phBase || 0);
  const squash = Math.sin(ph);
  const w = lebar * (1 + squash * 0.07);
  const h = ting * (1 - squash * 0.07);
  const bob = Math.abs(Math.cos(ph * 0.9)) * r * 0.05;
  const dasar = e.y + r * 0.55 - bob;
  const atas = dasar - h;

  const a = Math.atan2(player.y - e.y, player.x - e.x);
  const maxEx = Math.max(0, r * 0.20 - r * 0.11) * 0.85;
  const maxEy = Math.max(0, r * 0.24 - r * 0.11) * 0.85;
  const ex = Math.cos(a) * maxEx, ey = Math.sin(a) * maxEy;
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

  if (e.bos) gambarMahkota(e.x, atas, r);
}

let _mahkotaCache = new Map();

function gambarMahkota(x, dasar, r) {
  let c = _mahkotaCache.get(r);
  if (!c) {
    const GRID = [
      ".........L.........",
      "........LDL........",
      ".......LGGGD.......",
      "......LGGGGGD......",
      "..L...LGGGGGD...L..",
      ".LGD.LGGGGGGGD.LGD.",
      "LGGGGGGGGGGGGGGGGGD",
      "GGGGGGGGGGGGGGGGGGG",
      "BBBBBBBBBBBBBBBBBBB",
      "BBBBBBBBBBBBBBBBBBB"
    ];
    const W = 19, H = GRID.length;
    const cell = Math.max(3, Math.floor(r * 0.068));
    const cv = document.createElement("canvas");
    cv.width = W * cell;
    cv.height = H * cell;
    const g = cv.getContext("2d");
    const col = { L: "#fff3b0", G: "#ffd23f", D: "#d99509", B: "#8a5a00" };
    const isi = [];
    GRID.forEach((row, yy) => {
      for (let xx = 0; xx < W; xx++) {
        if (row[xx] !== ".") {
          isi.push([xx, yy]);
          g.fillStyle = col[row[xx]] || "#ffd23f";
          g.fillRect(xx * cell, yy * cell, cell, cell);
        }
      }
    });
    g.fillStyle = "#5b3600";
    for (const [xx, yy] of isi) {
      for (const [nx, ny] of [[xx - 1, yy], [xx + 1, yy], [xx, yy - 1], [xx, yy + 1]]) {
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const o = isi.some(([px, py]) => px === nx && py === ny);
        if (!o) g.fillRect(nx * cell, ny * cell, cell, cell);
      }
    }
    c = { cv: cv, w: cv.width, h: cv.height, ox: cv.width / 2, oy: cv.height };
    _mahkotaCache.set(r, c);
  }
  ctx.drawImage(c.cv, Math.round(x - c.ox), Math.round(dasar - r * 0.08 - c.h));
}

function gambarJamur(e, tAnim) {
  const r = e.r, x = e.x, y = e.y;
  const warna = e.warna || "#86efac";
  const bob = Math.sin(tAnim * 5 + x * 0.1) * r * 0.05;
  const payung = r * 1.55;

  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.7, r * 0.95, r * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();

  const bx = x, bt = y - bob;
  ctx.fillStyle = campurWarna("#fdf6e3", 0.05);
  ctx.beginPath();
  ctx.ellipse(bx, bt + r * 0.05, r * 0.55, r * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();

  const px = bx, py = bt - r * 0.45;
  const grd = ctx.createRadialGradient(px - r * 0.2, py - r * 0.2, r * 0.1, px, py, payung);
  grd.addColorStop(0, campurWarna(warna, 0.35));
  grd.addColorStop(0.6, warna);
  grd.addColorStop(1, campurWarna(warna, -0.2));
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(px, py, payung, Math.PI, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  for (const [ox, oy, or] of [[-0.5, 0.55, 0.16], [0.15, 0.75, 0.1], [0.5, 0.4, 0.12]]) {
    ctx.beginPath();
    ctx.arc(px + ox * r, py - oy * r * 0.9, or * r, 0, Math.PI * 2);
    ctx.fill();
  }

  if (e.cd < 0.3) {
    ctx.fillStyle = "rgba(163, 230, 53, 0.55)";
    ctx.beginPath();
    ctx.arc(px, py - r * 0.95, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }

  const a = Math.atan2(player.y - y, player.x - x);
  const ex = Math.cos(a) * r * 0.2, ey = Math.sin(a) * r * 0.2;
  for (const s of [-1, 1]) {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(bx + s * r * 0.22, bt + r * 0.05, r * 0.14, r * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#14532d";
    ctx.beginPath();
    ctx.arc(bx + s * r * 0.22 + ex, bt + r * 0.05 + ey, r * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }
}

function gambarSerigala(e, tAnim) {
  const r = e.r, x = e.x, y = e.y;
  const warna = e.warna || "#aab3bc";
  const a = Math.atan2(player.y - y, player.x - x);
  const flp = Math.cos(a) >= 0 ? 1 : -1;
  const bersiap = e.lungeBersiap > 0;
  const lunge = e.lungeT > 0;
  const lari = Math.sin(tAnim * 10) * r * 0.18;

  const crouch = bersiap ? Math.min(1, e.lungeBersiap * 3) * 0.35 : 0;

  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.7 - crouch * r * 0.2, r * 1.1, r * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flp, 1);
  ctx.translate(0, crouch * r * 0.3);

  ctx.fillStyle = campurWarna(warna, -0.25);
  for (let k = 0; k < 4; k++) {
    const fx = -r * 0.55 + k * r * 0.38;
    const lift = (k % 2 === 0) ? lari : -lari;
    const fy = r * 0.15 - (lunge ? r * 0.28 : Math.max(0, lift));
    ctx.fillRect(fx - r * 0.07, fy - r * 0.42, r * 0.14, r * 0.42);
  }

  ctx.strokeStyle = campurWarna(warna, -0.15);
  ctx.lineWidth = r * 0.22;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-r * 0.85, -r * 0.1);
  ctx.quadraticCurveTo(-r * 1.15, -r * 0.35, -r * 1.0, -r * 0.7);
  ctx.stroke();
  const ang = a * flp;
  ctx.rotate(ang * 0.35);

  const grd = ctx.createLinearGradient(0, -r * 0.5, 0, r * 0.2);
  grd.addColorStop(0, campurWarna(warna, 0.25));
  grd.addColorStop(1, campurWarna(warna, -0.15));
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.12, r * 0.85, r * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = campurWarna(warna, 0.05);
  ctx.beginPath();
  ctx.ellipse(r * 0.72, -r * 0.18, r * 0.42, r * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = campurWarna(warna, -0.05);
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(r * 0.5 + s * r * 0.14, -r * 0.45);
    ctx.lineTo(r * 0.5 + s * r * 0.32, -r * 0.75);
    ctx.lineTo(r * 0.5 + s * r * 0.04, -r * 0.42);
    ctx.closePath();
    ctx.fill();
  }

  const irit = bersiap ? "#ff3d3d" : "#3d4248";
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(r * 0.92, -r * 0.3, r * 0.11, 0, Math.PI * 2);
  ctx.fill();
  if (bersiap) {
    ctx.fillStyle = "rgba(255, 80, 30, 0.35)";
    ctx.beginPath();
    ctx.arc(r * 0.95, -r * 0.3, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = irit;
  ctx.beginPath();
  ctx.arc(r * 0.95, -r * 0.3, r * 0.055, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2a2e33";
  ctx.beginPath();
  ctx.arc(r * 1.06, -r * 0.12, r * 0.07, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function gambarSemak(e, tAnim) {
  const r = e.r, x = e.x, y = e.y;
  const warna = e.warna || "#3ea05f";
  const goyang = Math.sin(tAnim * 4 + x * 0.07) * r * 0.05;

  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.65, r * 1.1, r * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();

  for (const [ox, oy, sr] of [[-r * 0.55, r * 0.05, r * 0.6], [r * 0.5, r * 0.05, r * 0.58], [0, -r * 0.25, r * 0.7]]) {
    const grd = ctx.createRadialGradient(x + ox - sr * 0.3, y + oy - sr * 0.3, sr * 0.1, x + ox, y + oy, sr);
    grd.addColorStop(0, campurWarna(warna, 0.35));
    grd.addColorStop(1, campurWarna(warna, -0.25));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x + ox, y + oy - Math.abs(goyang) * 0.4, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = campurWarna(warna, -0.4);
  ctx.lineWidth = 2;
  for (let k = 0; k < 8; k++) {
    const dg = (k / 8) * Math.PI * 2 + goyang * 0.3 + Math.PI;
    const dx = x + Math.cos(dg) * r * 0.85;
    const dy = y + Math.sin(dg) * r * 0.55 + r * 0.1;
    ctx.beginPath();
    ctx.moveTo(dx, dy);
    ctx.lineTo(dx + Math.cos(dg) * r * 0.28, dy + Math.sin(dg) * r * 0.28);
    ctx.stroke();
  }

  const a = Math.atan2(player.y - y, player.x - x);
  const ex = Math.cos(a) * r * 0.28, ey = Math.sin(a) * r * 0.28;
  for (const s of [-1, 1]) {
    ctx.fillStyle = "#fef08a";
    ctx.beginPath();
    ctx.arc(x + s * r * 0.3, y - r * 0.15, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#422006";
    ctx.beginPath();
    ctx.arc(x + s * r * 0.3 + ex, y - r * 0.15 + ey, r * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }
}

function gambarMusuh(e, tAnim) {
  if (e.tipe === "jamur") return gambarJamur(e, tAnim);
  if (e.tipe === "serigala") return gambarSerigala(e, tAnim);
  if (e.tipe === "semak") return gambarSemak(e, tAnim);
  if (e.bos) return gambarBos(e, tAnim);
  return gambarSlime(e, tAnim);
}

// Badan bos = slime + mahkota, dibungkus efek per fase + animasi kematian.
function gambarBos(e, tAnim) {
  let shrink = 1;
  let alpha = 1;
  const K = (typeof bosKematian !== "undefined" && bosKematian && bosKematian.e === e) ? bosKematian : null;
  if (K) {
    const u = Math.max(0, Math.min(1, K.t / BOS_MATI_TOTAL));
    if (u > 0.42) {
      const k = (u - 0.42) / 0.58;
      shrink = 1 - k * 0.7;
      alpha = 1 - k * 0.8;
    }
  }
  ctx.save();
  if (shrink !== 1) {
    ctx.translate(e.x, e.y);
    ctx.scale(shrink, shrink);
    ctx.translate(-e.x, -e.y);
  }
  if (alpha !== 1) ctx.globalAlpha = alpha;
  gambarSlime(e, tAnim);
  ctx.restore();

  if (K) return;
  gambarBosEfek(e, tAnim);
}

// Telegraph selalu terlihat >= 0.5s supaya sempat didash / di-counter.
function gambarTelegraphBos(e, fase, u) {
  const konf = e.bosDef.serangan[e.aksi] || {};
  const warna = fase.warnaBar;
  const a = 0.18 + u * 0.42;
  ctx.save();

  if (e.aksi === "slam") {
    const R = e.r * fase.radiusSlam;
    ctx.fillStyle = warnaRGBA(warna, a * 0.35);
    ctx.beginPath();
    ctx.arc(e.x, e.y, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = warnaRGBA(warna, 0.5 + u * 0.5);
    ctx.lineWidth = 4 + u * 5;
    ctx.beginPath();
    ctx.arc(e.x, e.y, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = warnaRGBA("#ffffff", 0.35 + u * 0.5);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(e.x, e.y, R * u, 0, Math.PI * 2);
    ctx.stroke();
  } else if (e.aksi === "charge") {
    const jang = 760;
    const cx = e.x + Math.cos(e.angSerang) * jang * 0.5;
    const cy = e.y + Math.sin(e.angSerang) * jang * 0.5;
    ctx.translate(cx, cy);
    ctx.rotate(e.angSerang);
    const w = e.r * 1.5;
    ctx.fillStyle = warnaRGBA(warna, a * 0.32);
    ctx.fillRect(-jang * 0.5, -w * 0.5, jang, w);
    ctx.strokeStyle = warnaRGBA(warna, 0.45 + u * 0.5);
    ctx.lineWidth = 3;
    ctx.strokeRect(-jang * 0.5, -w * 0.5, jang, w);
    ctx.fillStyle = warnaRGBA(warna, 0.3 + u * 0.5);
    ctx.fillRect(-jang * 0.5, -w * 0.5, jang * u, w);
  } else {
    const R = e.r * (1.5 + u * 0.7);
    ctx.strokeStyle = warnaRGBA(warna, 0.4 + u * 0.55);
    ctx.lineWidth = 3 + u * 4;
    ctx.beginPath();
    ctx.arc(e.x, e.y, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = warnaRGBA(warna, 0.25 + u * 0.4);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r * (1.05 + u * 0.25), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function gambarBosEfek(e, tAnim) {
  const def = e.bosDef;
  if (!def) return;
  const fase = def.fase[e.fase];

  // Aura per fase Ã¢â‚¬â€ makin merah/panas saat fase 3.
  const denyut = 0.5 + 0.5 * Math.sin(tAnim * (2 + e.fase) * 1.4);
  ctx.save();
  ctx.globalAlpha = 0.13 + denyut * 0.10;
  ctx.fillStyle = fase.warnaBar;
  ctx.beginPath();
  ctx.arc(e.x, e.y, e.r * (1.45 + denyut * 0.2), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (e.state === "tele" && e.telegrafDur > 0) {
    gambarTelegraphBos(e, fase, Math.max(0, Math.min(1, e.stateT / e.telegrafDur)));
  }

  // Cincin emas = window parry.
  if (e.bosParah) {
    ctx.save();
    ctx.strokeStyle = "rgba(251, 191, 36, " + (0.45 + 0.45 * Math.sin(tAnim * 11)).toFixed(3) + ")";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r * 1.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Transisi fase: tanda weaken + damage multiplier.
  if (e.state === "transisi" || e.state === "stagger") {
    const k = e.state === "stagger" ? 1.35 : (def.transisi.damageKali || 1);
    const pulse = 0.5 + 0.5 * Math.sin(tAnim * 9);
    ctx.save();
    ctx.globalAlpha = 0.25 + pulse * 0.35;
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 34px Zen Dots";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = "rgba(0,0,0,0.9)";
    ctx.lineWidth = 5;
    const t = "x" + k.toFixed(2).replace("0.", ".");
    ctx.strokeText(t, e.x, e.y - e.r - 74);
    ctx.fillText(t, e.x, e.y - e.r - 74);
    ctx.restore();
  }
}

function draw() {
  _shakeX = 0;
  _shakeY = 0;
  ctx.save();

  hitungKamera();

  if (shake > 0) {
    shake -= 1 / 60;
    // Pengaturan "Goyang kamera" di layar Settings. Nilai tetap dikurangi
    // supaya efeknya selesai normal, cuma pergeserannya yang dilewati.
    const nyalakan = typeof pengaturanAmbil !== "function" || pengaturanAmbil("goyangKamera") !== false;
    if (nyalakan) {
      _shakeX = (Math.random() - 0.5) * 8;
      _shakeY = (Math.random() - 0.5) * 8;
      ctx.translate(_shakeX, _shakeY);
    }
  }

  ctx.translate(-kam.x, -kam.y);

  if (statusGame === "title" || statusGame === "level" || statusGame === "select") {
    ctx.save();
    ctx.translate(kam.x, kam.y);
    ctx.fillStyle = "#0a0c19";
    ctx.fillRect(-50, -50, ctx.canvas.width + 100, ctx.canvas.height + 100);
    ctx.restore();
    for (const p of bgPartikels) {
      ctx.fillStyle = "rgba(255, 210, 63, " + p.alpha + ")";
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    gambarMarkahVersi();
    ctx.restore();
    return;
  }

  gambarLatar();

  gambarAmbience();

  for (const r of rings) {
    const alpha = 1 - r.t / r.life;
    ctx.strokeStyle = "rgba(255, 210, 63, " + alpha + ")";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (const f of fires) {
    if (!f.frames) bakeApi(f);
    if (!f.frames) continue;
    const hidup = 1 - f.t / f.life;
    const fade = hidup < 0.2 ? hidup / 0.2 : 1;
    const fr = f.frames[0];
    blitX(f.frames, performance.now() / 1000, 20, Math.round(f.x - fr.width / 2), Math.round(f.y - fr.height), fade);
  }

  ctx.save();
  let tNow = performance.now() / 1000;
  for (const fz of freezes) {

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
      fz.reveal = fz.length;
      tNow = fz.seed;
      ctx = csctx;
      try {

        csctx.setTransform(
          fz.nx, fz.px, fz.ny, fz.py,
          uOff - fz.nx * fz.x0 - fz.ny * fz.y0,
          vOff - fz.px * fz.x0 - fz.py * fz.y0
        );

        const hidup = 1 - fz.t / fz.life;
        const fade = hidup < 0.2 ? hidup / 0.2 : 1;

        const effLen = Math.max(30, Math.min(fz.length, fz.reveal));
        const ex = fz.x0 + fz.nx * effLen;
        const ey = fz.y0 + fz.ny * effLen;

        const k1x = fz.x0 + fz.px * fz.half, k1y = fz.y0 + fz.py * fz.half;
        const k2x = ex + fz.px * fz.half, k2y = ey + fz.py * fz.half;
        const g1x = fz.x0 - fz.px * fz.half, g1y = fz.y0 - fz.py * fz.half;
        const g2x = ex - fz.px * fz.half, g2y = ey - fz.py * fz.half;

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

        const nSp = Math.max(4, Math.floor(effLen / 11));
        for (let k = 0; k < nSp; k++) {
          const r1 = Math.abs(Math.sin(k * 12.9898 + fz.seed * 1.7));
          const r2 = Math.abs(Math.sin(k * 78.233 + fz.seed * 2.3 + 1));
          const r3 = Math.abs(Math.sin(k * 39.19 + fz.seed + 4.7));
          const r4 = Math.abs(Math.sin(k * 91.7 + fz.seed * 3.3));
          const r5 = Math.abs(Math.sin(k * 33.7 + fz.seed * 4.9));
          const rr = (k + 0.5 + (r3 - 0.5) * 0.45) / nSp;
          const h = 7 + r1 * 26;
          const w = 6 + r2 * 10;

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

        const nSpIn = Math.max(4, Math.floor(effLen / 9));
        for (let k = 0; k < nSpIn; k++) {
          const r1 = Math.abs(Math.sin(k * 12.9898 + fz.seed * 2.2));
          const r2 = Math.abs(Math.sin(k * 78.233 + fz.seed * 2.9 + 3));
          const r3 = Math.abs(Math.sin(k * 39.19 + fz.seed * 1.4 + 8));
          const rr = (k + 0.5) / nSpIn;
          const h = 4 + r1 * 13;
          const w = 4 + r2 * 7;
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

    const hidup = 1 - fz.t / fz.life;
    const fade = hidup < 0.2 ? hidup / 0.2 : 1;
    const effLen2 = Math.max(30, Math.min(fz.length, fz.reveal));
    const srcW = Math.max(10, effLen2 + fz.uOff);
    const spKor = fz.sprite;
    ctx.globalAlpha = fade;
    ctx.save();

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

    gambarMusuh(e, performance.now() / 1000);
    const sw = e.r * 2.1, sh = e.r * 1.7;

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

    if (e.freeze > 0) {
      ctx.fillStyle = "rgba(125, 211, 252, 0.35)";
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r + 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#7dd3fc";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (e.paralyze > 0) {
      ctx.fillStyle = "rgba(168, 85, 247, 0.3)";
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r + 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "#c084fc";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
    }

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

  for (const hz of hazards) {
    const p = 1 - hz.t / hz.life;
    ctx.globalAlpha = 0.35 + p * 0.45;
    ctx.fillStyle = "#365e43";
    ctx.beginPath();
    ctx.arc(hz.x, hz.y, hz.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.3 + p * 0.4;
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(hz.x, hz.y, hz.r, 0, Math.PI * 2);
    ctx.stroke();

    for (let k = 0; k < 10; k++) {
      const dg = (k / 10) * Math.PI * 2 + hz.t;
      const dx = hz.x + Math.cos(dg) * hz.r;
      const dy = hz.y + Math.sin(dg) * hz.r;
      ctx.strokeStyle = "#86efac";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(dx, dy);
      ctx.lineTo(dx + Math.cos(dg) * 8, dy + Math.sin(dg) * 8);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  for (const s of enemyShots) {
    const pulsa = 1 + Math.sin(s.life * 20) * 0.2;
    const grd = ctx.createRadialGradient(s.x, s.y, 1, s.x, s.y, s.r * pulsa);
    grd.addColorStop(0, "#ecfccb");
    grd.addColorStop(0.6, "#a3e635");
    grd.addColorStop(1, "#65a30d");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r * pulsa, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.arc(s.x - s.r * 0.25, s.y - s.r * 0.25, s.r * 0.32, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const sl of slashes) {

    const geserWaktu = sl.gambar || sl.life;
    const full = sl.halfArc * 2;
    const half = geserWaktu / 2;
    const u = Math.max(0, Math.min(1, sl.t / geserWaktu));
    let a1, a2;
    if (sl.tebal) {
      // tumbuh cepat dari awal lalu BEKU di busur penuh (penuh setengah lingkaran)
      a1 = sl.angle - sl.halfArc;
      a2 = a1 + full * Math.min(1, u * 2);
    } else if (u < 0.5) {
      const p = u * 2;
      a1 = sl.angle - sl.halfArc;
      a2 = a1 + full * p;
    } else {
      const q = (u - 0.5) * 2;
      a1 = sl.angle - sl.halfArc + full * q;
      a2 = sl.angle + sl.halfArc;
    }
    const r = sl.reach;
    const span = a2 - a1;
    const N = 20;

    if (sl.burst) {
      const wSabit = tekstur[karakter.senjata];
      const rot = sl.t / sl.life;
      const tipA = sl.t < half ? a2 : a1;
      ctx.globalAlpha = Math.max(0.3, 1 - rot * 0.6);

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

      const coreR = sl.reach * 0.12 * rot;
      const gCore = ctx.createRadialGradient(sl.x, sl.y, 0, sl.x, sl.y, coreR);
      gCore.addColorStop(0, "rgba(255, 255, 220, 0.9)");
      gCore.addColorStop(0.4, "rgba(255, 200, 50, 0.5)");
      gCore.addColorStop(1, "rgba(255, 100, 0, 0)");
      ctx.fillStyle = gCore;
      ctx.beginPath();
      ctx.arc(sl.x, sl.y, coreR, 0, Math.PI * 2);
      ctx.fill();

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

    if (sl.tebal) {
      // ===== INFERNO: busur beku + jejak api di jalur bilah =====
      const g = sl.tebal;
      const usut = sl.t / sl.life;
      const pudar = usut < 0.8 ? 1 : 1 - (usut - 0.8) / 0.2;

      function sabit(maxW, warna, geser, taper) {
        const ges = geser || 0;
        const tpn = taper || 1;
        ctx.fillStyle = warna;
        ctx.beginPath();
        for (let i = 0; i <= N; i++) {
          const t = i / N;
          const a = a1 + span * t;
          const w = maxW * (0.2 + 0.8 * Math.sin(Math.PI * (0.15 + 0.85 * t)));
          const geserW = ges * t;
          ctx.lineTo(sl.x + Math.cos(a + geserW) * r + Math.cos(a + Math.PI / 2) * w * tpn,
            sl.y + Math.sin(a + geserW) * r + Math.sin(a + Math.PI / 2) * w * tpn);
        }
        for (let i = N; i >= 0; i--) {
          const t = i / N;
          const a = a1 + span * t;
          const w = maxW * (0.2 + 0.8 * Math.sin(Math.PI * (0.15 + 0.85 * t)));
          const geserW = ges * t;
          ctx.lineTo(sl.x + Math.cos(a + geserW) * r - Math.cos(a + Math.PI / 2) * w * tpn,
            sl.y + Math.sin(a + geserW) * r - Math.sin(a + Math.PI / 2) * w * tpn);
        }
        ctx.closePath();
        ctx.fill();
      }

      // jejak api di lintasan ujung bilah
      const jejak = sl.jejak || [];
      if (jejak.length > 2) {
        const pita = [34, 21, 10, 4];
        const warnaPita = ["rgba(255, 77, 23, 0.3)", "rgba(255, 140, 63, 0.5)", "rgba(255, 184, 51, 0.75)", "#fff3c4"];
        for (let L = 0; L < pita.length; L++) {
          ctx.fillStyle = warnaPita[L];
          ctx.beginPath();
          for (let i = 0; i < jejak.length; i++) {
            const p = jejak[i];
            const sebelum = i === 0 ? jejak[0] : jejak[i - 1];
            const dx = p.x - sebelum.x, dy = p.y - sebelum.y;
            const l = Math.hypot(dx, dy) || 1;
            const nx = -dy / l, ny = dx / l;
            const w = pita[L] * (i / (jejak.length - 1));
            if (i === 0) ctx.moveTo(p.x + nx * w, p.y + ny * w);
            else ctx.lineTo(p.x + nx * w, p.y + ny * w);
          }
          for (let i = jejak.length - 1; i >= 0; i--) {
            const p = jejak[i];
            const sebelum = i === 0 ? jejak[0] : jejak[i - 1];
            const dx = p.x - sebelum.x, dy = p.y - sebelum.y;
            const l = Math.hypot(dx, dy) || 1;
            const nx = -dy / l, ny = dx / l;
            const w = pita[L] * (i / (jejak.length - 1));
            ctx.lineTo(p.x - nx * w, p.y - ny * w);
          }
          ctx.closePath();
          ctx.fill();
        }
      }

      ctx.globalAlpha = pudar;
      sabit(34 * g, "rgba(255, 60, 20, 0.45)", 0.16, 1);
      sabit(22 * g, "rgba(255, 140, 60, 0.8)", 0.08, 1);
      sabit(12 * g, "#ffb833", 0.03, 1);
      sabit(5.5 * g, "#fff3c4", 0, 1);

      // kilau di ujung bilah
      const tipA = a1 + span;
      ctx.fillStyle = "#fff8dc";
      ctx.beginPath();
      ctx.moveTo(sl.x + Math.cos(tipA) * (r + 14 * g), sl.y + Math.sin(tipA) * (r + 14 * g));
      ctx.lineTo(sl.x + Math.cos(tipA - 0.09) * r, sl.y + Math.sin(tipA - 0.09) * r);
      ctx.lineTo(sl.x + Math.cos(tipA + 0.09) * r, sl.y + Math.sin(tipA + 0.09) * r);
      ctx.closePath();
      ctx.fill();

      ctx.globalAlpha = 1;
      continue;
    }

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

      kipas(r, "rgba(60, 8, 0, 0.5)", false);
      kipas(r, "rgba(255, 60, 0, 0.45)", true);
      kipas(r * 0.78, "rgba(255, 120, 35, 0.6)", true);
      kipas(r * 0.55, "#ff8c3f", true);
      kipas(r * 0.38, "#ffd75f", true);

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

      const tipA = sl.t < half ? a2 : a1;
      ctx.fillStyle = "#fff7cc";
      ctx.beginPath();
      ctx.arc(sl.x + Math.cos(tipA) * r, sl.y + Math.sin(tipA) * r, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
      continue;
    }

    function sabit(maxW, warna) {
      ctx.fillStyle = warna;
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const a = a1 + span * t;
        const w = maxW * Math.sin(Math.PI * t);
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

    sabit(22, "rgba(255, 70, 20, 0.55)");

    sabit(13, "rgba(255, 150, 40, 0.95)");

    sabit(6.5, "#ffd75f");

    const tipA = sl.t < half ? a2 : a1;
    ctx.fillStyle = "#fff7cc";
    ctx.beginPath();
    ctx.arc(sl.x + Math.cos(tipA) * r, sl.y + Math.sin(tipA) * r, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const b of bullets) {
    const ang = Math.atan2(b.vy, b.vx);
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(ang + Math.PI / 2);
    if (b.raksasa) {

      ctx.imageSmoothingEnabled = false;
      ctx.save();
      ctx.scale(2, 2);
      ctx.globalCompositeOperation = "lighter";

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

      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.fillRect(-2, -165, 4, 205);

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

      ctx.fillStyle = "rgba(224, 242, 254, 0.45)";
      const fl = (performance.now() / 11) % 84;
      for (let i = 0; i < 3; i++) {
        const oy = 50 + ((i * 28 + fl) % 84);
        ctx.fillRect(-2.5, oy, 5, 16);
      }
      ctx.restore();
    } else {

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

  if (karakter !== null && (statusGame === "main" || statusGame === "pause" || statusGame === "over" || statusGame === "menang" || statusGame === "upgrade")) {
    gambarSenjata();

    const aksenRing = (karakter && karakter.warnaDash) || "#7dd3fc";
    if (player.specialBuff > 0) {
      ctx.strokeStyle = warnaRGBA(aksenRing, 0.7);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 48, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (player.ultBuff) {
      const pu = 0.7 + 0.3 * Math.sin(performance.now() / 120);
      ctx.strokeStyle = warnaRGBA(aksenRing, 0.85 * pu);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 60, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = warnaRGBA(aksenRing, 0.45 * pu);
      ctx.beginPath();
      ctx.arc(player.x, player.y, 84, 0, Math.PI * 2);
      ctx.stroke();
    }

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

      const { lebar: szWr, tinggi: szHr } = ukuranSprite(imgA, player.r * karakter.skala * 4.6);
      ctx.drawImage(imgA, player.x - szWr / 2, player.y - szHr / 2, szWr, szHr);

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

  // INFERNO: ledakan barier - kipas api tumbuh sampai setengah lingkaran lalu beku
  for (const k of kipasLedak) {
    const u = Math.min(1, k.t / k.gambar);
    const R = k.r + (k.maksR - k.r) * (1 - (1 - u) * (1 - u));
    const a0 = k.angle - Math.PI / 2 * u;
    const sp = Math.PI * u;
    const pudar = k.t < k.gambar ? 1 : Math.max(0, 1 - (k.t - k.gambar) / (k.life - k.gambar));
    const lapisan = [
      [1.0, "rgba(120, 16, 0, 0.35)"],
      [0.72, "rgba(255, 80, 10, 0.45)"],
      [0.44, "rgba(255, 150, 40, 0.6)"],
      [0.2, "rgba(255, 215, 95, 0.8)"]
    ];
    ctx.globalAlpha = pudar;
    for (const [sk, warna] of lapisan) {
      ctx.fillStyle = warna;
      ctx.beginPath();
      ctx.moveTo(k.x, k.y);
      const S = 34;
      for (let i = 0; i <= S; i++) {
        const t = i / S;
        const a = a0 + sp * t;
        const gg = 0.82 + 0.18 * Math.sin(t * Math.PI * 4);
        ctx.lineTo(k.x + Math.cos(a) * R * sk * gg, k.y + Math.sin(a) * R * sk * gg);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(255, 240, 190, " + 0.7 * pudar + ")";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(k.x, k.y, R * 0.9, a0, a0 + sp);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // FROZFALL: panah beku (naik = tembak ke atas, turun = hujan)
  for (const p of panahEs) {
    const naik = p.fase === "naik";
    const kelajuan = Math.hypot(p.vx, p.vy) || 1;
    const sudut = Math.atan2(p.vy, p.vx) + Math.PI / 2;
    const panjang = naik ? 34 : 42;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(sudut);
    const gBodi = ctx.createLinearGradient(0, -panjang, 0, panjang * 0.7);
    gBodi.addColorStop(0, "#ffffff");
    gBodi.addColorStop(0.45, "#bae6fd");
    gBodi.addColorStop(1, "#38bdf8");
    ctx.fillStyle = gBodi;
    ctx.beginPath();
    ctx.moveTo(0, -panjang);
    ctx.lineTo(-7, -panjang * 0.35);
    ctx.lineTo(-4, panjang * 0.55);
    ctx.lineTo(4, panjang * 0.55);
    ctx.lineTo(7, -panjang * 0.35);
    ctx.closePath();
    ctx.fill();
    // bulu ekor
    ctx.fillStyle = "rgba(224, 242, 254, 0.9)";
    ctx.beginPath();
    ctx.moveTo(-4, panjang * 0.5);
    ctx.lineTo(0, panjang * 1.15);
    ctx.lineTo(4, panjang * 0.5);
    ctx.closePath();
    ctx.fill();
    // kilau es
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-1.5, -panjang * 0.9, 3, panjang * 1.2);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // VOIZ: bolt nihil melengkung (setitik cahaya ungu dengan aura)
  for (const b of boltNihil) {
    const sudut = Math.atan2(b.dy || 0, b.dx || 1);
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(sudut + Math.PI / 2);
    ctx.globalCompositeOperation = "lighter";
    const gb = ctx.createRadialGradient(0, -12, 1, 0, -12, 15);
    gb.addColorStop(0, "rgba(192, 132, 252, 0.95)");
    gb.addColorStop(0.4, "rgba(139, 92, 246, 0.7)");
    gb.addColorStop(1, "rgba(109, 40, 217, 0)");
    ctx.fillStyle = gb;
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.quadraticCurveTo(9, -12, 6, 2);
    ctx.quadraticCurveTo(3, 15, 0, 18);
    ctx.quadraticCurveTo(-3, 15, -6, 2);
    ctx.quadraticCurveTo(-9, -12, 0, -26);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#a855f7";
    ctx.fillRect(-1.5, -22, 3, 11);
    ctx.restore();
  }

  // VOIZ: UMBRA (balok ungu pekat tebal, arah terkunci sesuai kast)
  for (const L of nullLasers) {
    const pjg = 950;
    const dxL = (L.dx !== undefined ? L.dx : Math.cos(L.a));
    const dyL = (L.dy !== undefined ? L.dy : Math.sin(L.a));
    const exL = L.x + dxL * pjg;
    const eyL = L.y + dyL * pjg;
    const naik = Math.min(1, L.t / 0.4);
    const redup = L.life < 0.4 ? Math.max(0, L.life / 0.4) : 1;
    const bergetar = 1 + 0.06 * Math.sin(performance.now() / 22 + Math.random());
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const grad = ctx.createLinearGradient(L.x, L.y, exL, eyL);
    grad.addColorStop(0, "rgba(196, 181, 253, 0.9)");
    grad.addColorStop(0.45, "rgba(139, 92, 246, 0.78)");
    grad.addColorStop(1, "rgba(88, 28, 135, 0)");
    // selubung luar (glow) lebar & pekat
    ctx.strokeStyle = "rgba(88, 28, 135, " + (0.3 * naik * redup) + ")";
    ctx.lineWidth = 100 * bergetar * naik * redup;
    ctx.beginPath();
    ctx.moveTo(L.x, L.y);
    ctx.lineTo(exL, eyL);
    ctx.stroke();
    // badan balok tebal
    ctx.strokeStyle = grad;
    ctx.lineWidth = 46 * bergetar * naik * redup;
    ctx.beginPath();
    ctx.moveTo(L.x, L.y);
    ctx.lineTo(exL, eyL);
    ctx.stroke();
    // inti terang (setara berat visual panah kenzro)
    ctx.strokeStyle = "rgba(196, 181, 253, " + (0.95 * naik * redup) + ")";
    ctx.lineWidth = 11 * bergetar * naik;
    ctx.beginPath();
    ctx.moveTo(L.x, L.y);
    ctx.lineTo(exL, eyL);
    ctx.stroke();
    // kepala laser (titik cahaya di ujung)
    const tipR = 13 * naik * bergetar;
    const gTip = ctx.createRadialGradient(exL, eyL, 1, exL, eyL, tipR);
    gTip.addColorStop(0, "rgba(226, 196, 255, 1)");
    gTip.addColorStop(0.4, "rgba(168, 85, 247, 0.8)");
    gTip.addColorStop(1, "rgba(109, 40, 217, 0)");
    ctx.fillStyle = gTip;
    ctx.beginPath();
    ctx.arc(exL, eyL, tipR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // VOIZ: PRISM Ã¢â‚¬â€ aliran sihir tebal & halus: selubung lebar + badan + inti
// + butir sihir yang MENGALIR dari asal ke tujuan (bukan garis petir).
  for (const p of prismPulsa) {
    const muda = Math.min(1, p.t / 0.1);
    const tua = Math.max(0, p.life / 0.4);
    const op = muda * tua;
    if (op <= 0.01) continue;
    const dx = p.x2 - p.x1, dy = p.y2 - p.y1;
    const ll = Math.hypot(dx, dy) || 1;
    const nx = -dy / ll, ny = dx / ll;
    const mx = (p.x1 + p.x2) / 2, my = (p.y1 + p.y2) / 2;
    const of = Math.sin(p.t * 24 + (p.dua || 0)) * 6 * op;
    const cx = mx + nx * of, cy = my + ny * of;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    // 1) selubung luar (glow) lebar -> aliran terasa tebal
    ctx.strokeStyle = "rgba(109, 40, 217, " + (0.16 * op).toFixed(3) + ")";
    ctx.lineWidth = 26 * op;
    ctx.beginPath();
    ctx.moveTo(p.x1, p.y1);
    ctx.quadraticCurveTo(cx, cy, p.x2, p.y2);
    ctx.stroke();
    // 2) badan aliran (gradasi ungu halus)
    const gA = ctx.createLinearGradient(p.x1, p.y1, p.x2, p.y2);
    gA.addColorStop(0, "rgba(226, 196, 255, " + (0.8 * op).toFixed(3) + ")");
    gA.addColorStop(0.5, "rgba(168, 85, 247, " + (0.65 * op).toFixed(3) + ")");
    gA.addColorStop(1, "rgba(124, 58, 237, " + (0.5 * op).toFixed(3) + ")");
    ctx.strokeStyle = gA;
    ctx.lineWidth = 11 * op;
    ctx.beginPath();
    ctx.moveTo(p.x1, p.y1);
    ctx.quadraticCurveTo(cx, cy, p.x2, p.y2);
    ctx.stroke();
    // 3) inti terang
    ctx.strokeStyle = "rgba(255, 246, 255, " + (0.7 * op).toFixed(3) + ")";
    ctx.lineWidth = 3 * op;
    ctx.beginPath();
    ctx.moveTo(p.x1, p.y1);
    ctx.quadraticCurveTo(cx, cy, p.x2, p.y2);
    ctx.stroke();
    // 4) butir sihir MENGALIR sepanjang jalur
    const NW = 4;
    for (let b = 0; b < NW; b++) {
      const tt = ((p.t / 0.4 + b / NW) % 1 + 1) % 1;
      const ss = Math.sin(tt * Math.PI);
      const bob = Math.sin(p.t * 26 + b * 1.9) * 4 * op;
      const bx = p.x1 + dx * tt + nx * bob;
      const by = p.y1 + dy * tt + ny * bob;
      const br = (5 + b * 0.8) * (0.6 + 0.4 * ss) * op;
      const gB = ctx.createRadialGradient(bx, by, 0.4, bx, by, br * 2.2);
      gB.addColorStop(0, "rgba(255, 238, 255, " + (0.95 * op).toFixed(3) + ")");
      gB.addColorStop(0.45, "rgba(192, 132, 252, " + (0.7 * op).toFixed(3) + ")");
      gB.addColorStop(1, "rgba(109, 40, 217, 0)");
      ctx.fillStyle = gB;
      ctx.beginPath();
      ctx.arc(bx, by, br * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    // 5) cahaya titik sambaran
    const gT = ctx.createRadialGradient(p.x2, p.y2, 0.5, p.x2, p.y2, 10 * op + 2);
    gT.addColorStop(0, "rgba(255, 244, 255, " + (0.95 * op).toFixed(3) + ")");
    gT.addColorStop(0.5, "rgba(168, 85, 247, " + (0.7 * op).toFixed(3) + ")");
    gT.addColorStop(1, "rgba(109, 40, 217, 0)");
    ctx.fillStyle = gT;
    ctx.beginPath();
    ctx.arc(p.x2, p.y2, 10 * op + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // VOIZ: bola void yang dilempar (bola kegelapan beraura ungu)
  for (const ob of voidOrbs) {
    const obR = 20 * (1 + 0.08 * Math.sin(performance.now() / 60));
    ctx.save();
    ctx.translate(ob.x, ob.y);
    ctx.globalCompositeOperation = "lighter";
    const go = ctx.createRadialGradient(0, 0, 1, 0, 0, obR * 2.6);
    go.addColorStop(0, "rgba(139, 92, 246, 0.55)");
    go.addColorStop(0.5, "rgba(88, 28, 135, 0.22)");
    go.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = go;
    ctx.beginPath();
    ctx.arc(0, 0, obR * 2.6, 0, Math.PI * 2);
    ctx.fill();
    const cok = ctx.createRadialGradient(0, 0, 0, 0, 0, obR);
    cok.addColorStop(0, "#000000");
    cok.addColorStop(0.6, "#150726");
    cok.addColorStop(1, "rgba(124, 58, 237, 0.9)");
    ctx.fillStyle = cok;
    ctx.beginPath();
    ctx.arc(0, 0, obR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(196, 181, 253, 0.8)";
    ctx.lineWidth = Math.max(1.5, obR * 0.16);
    ctx.beginPath();
    ctx.arc(0, 0, obR * 0.92, 0, Math.PI * 2);
    ctx.stroke();
    const obT = performance.now() / 1000;
    for (let k = 0; k < 2; k++) {
      ctx.strokeStyle = "rgba(139, 92, 246, 0.6)";
      ctx.lineWidth = Math.max(1.5, obR * 0.14);
      ctx.beginPath();
      ctx.arc(0, 0, obR * (1.5 + k * 0.35), obT * (3 + k) + k * 2, obT * (3 + k) + k * 2 + Math.PI * 1.4);
      ctx.stroke();
    }
    ctx.restore();
  }

  // VOIZ: BLACKHOLE ultimate (piringan ungu berputar dengan inti hitam)
  for (const bh of blackholes) {
    const R = bh.R;
    if (R <= 1) continue;
    const tt = performance.now() / 1000 + (bh.seed || 0);
    const su = bh.t >= bh.TUMBUH ? Math.max(0, 1 - (bh.t - bh.TUMBUH) / bh.SUSUT) : 1;
    ctx.save();
    ctx.translate(bh.x, bh.y);
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
    g.addColorStop(0, "rgba(12, 4, 22, 0.98)");
    g.addColorStop(0.28, "rgba(20, 6, 40, 0.94)");
    g.addColorStop(0.52, "rgba(88, 28, 135, 0.62)");
    g.addColorStop(0.82, "rgba(109, 40, 217, 0.26)");
    g.addColorStop(1, "rgba(109, 40, 217, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(139, 92, 246, " + (0.5 * su) + ")";
    ctx.lineWidth = Math.max(2, R * 0.04);
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.arc(0, 0, R * (0.35 + k * 0.22), tt * (1.2 + k * 0.5) + k * 2, tt * (1.2 + k * 0.5) + k * 2 + Math.PI * 1.35);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
    const gc = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.32);
    gc.addColorStop(0, "#000000");
    gc.addColorStop(0.7, "#0b0214");
    gc.addColorStop(1, "#1e0b38");
    ctx.fillStyle = gc;
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.32 * su, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(124, 58, 237, " + (0.6 * su) + ")";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.34 * su, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  for (const p of particles) {
    ctx.globalAlpha = 1 - p.t / p.life;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  for (const p of deathPixels) {
    ctx.globalAlpha = 1 - p.t / p.life;
    ctx.fillStyle = "rgb(" + p.r + "," + p.g + "," + p.b + ")";
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  for (const s of souls) {
    const pulse = 0.6 + 0.4 * Math.sin(s.t * 6);
    const kedipWarna = Math.sin(s.t * 5) > 0 ? "#7cff5e" : "#ffd23f";
    ctx.globalAlpha = 0.35 * pulse;
    ctx.fillStyle = kedipWarna;
    ctx.fillRect(s.x - 8, s.y - 8, 16, 16);
    ctx.globalAlpha = pulse;
    ctx.fillRect(s.x - 4, s.y - 4, 8, 8);
  }
  ctx.globalAlpha = 1;

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

  for (const f of flashes) {
    const a = f.alpha * (1 - Math.min(1, f.t / f.life));
    ctx.fillStyle = f.warna;
    ctx.globalAlpha = a;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.globalAlpha = 1;

  if (hurtVig > 0.01) {
    const v = Math.min(0.65, hurtVig);
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 0.85);
    g.addColorStop(0, "rgba(255, 0, 30, 0)");
    g.addColorStop(1, "rgba(255, 0, 30, " + v + ")");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  if (levelBanner) {
    const p = levelBanner.t / levelBanner.life;
    const alpha = p < 0.15 ? p / 0.15 : p > 0.75 ? Math.max(0, 1 - (p - 0.75) / 0.25) : 1;
    ctx.globalAlpha = alpha;
    const bx = W / 2, by = H / 2;
    if (levelBanner.boss) {
      const bw = W * 0.46, bh = H * 0.16;
      const bx0 = bx - bw / 2, by0 = by - bh / 2;
      const denyut = 0.75 + 0.25 * Math.sin(levelBanner.t * 10);
      ctx.fillStyle = "rgba(48, 5, 6, 0.88)";
      gambarBundar(bx0, by0, bw, bh, Math.round(H * 0.02));
      ctx.fill();
      ctx.strokeStyle = "#ff2d2d";
      ctx.lineWidth = Math.max(2, W * 0.003);
      gambarBundar(bx0, by0, bw, bh, Math.round(H * 0.02));
      ctx.stroke();
      ctx.strokeStyle = "rgba(255, 120, 80, " + (0.5 * denyut) + ")";
      ctx.lineWidth = Math.max(1, W * 0.0015);
      gambarBundar(bx0 + W * 0.01, by0 + W * 0.01, bw - W * 0.02, bh - W * 0.02, Math.round(H * 0.015));
      ctx.stroke();
      gambarRambuPeringatan(bx0 + bw * 0.16, by, bh * 0.62);
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (levelBanner.sub) {
        ctx.font = "bold " + Math.round(W * 0.017) + "px Zen Dots";
        ctx.fillStyle = "#ffd23f";
        ctx.fillText(levelBanner.sub, bx + bw * 0.17, by0 + bh * 0.27);
      }
      ctx.font = "bold " + Math.round(W * 0.032) + "px Zen Dots";
      ctx.fillStyle = "#ff5540";
      ctx.strokeStyle = "rgba(0, 0, 0, 0.9)";
      ctx.lineWidth = Math.max(2, W * 0.002);
      ctx.strokeText(levelBanner.teks, bx + bw * 0.17, by + bh * 0.06);
      ctx.fillText(levelBanner.teks, bx + bw * 0.17, by + bh * 0.06);
      ctx.restore();
    } else {
      const bw = W * 0.32, bh = H * 0.1;
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(bx - bw / 2, by - bh / 2, bw, bh);
      ctx.strokeStyle = "#ffd23f";
      ctx.lineWidth = Math.max(1, W * 0.002);
      ctx.strokeRect(bx - bw / 2, by - bh / 2, bw, bh);
      ctx.fillStyle = "#ffd23f";
      ctx.font = "bold " + Math.round(W * 0.035) + "px Zen Dots";
      ctx.textAlign = "center";
      ctx.fillText(levelBanner.teks, bx, by + H * 0.005);
      ctx.fillStyle = "#fff";
      ctx.font = Math.round(W * 0.014) + "px Zen Dots";
      ctx.fillText(levelBanner.sub || "Habiskan semua musuh!", bx, by + H * 0.035);
      ctx.textAlign = "left";
    }
    ctx.globalAlpha = 1;
  }

  if (statusGame === "upgrade" && pilihanKartu && pilihanKartu.length) {
    gambarKartuUpgrade();
  }

  // HUD (termasuk soul meter) digambar SETELAH lapis gelap kartu, jadi
  // soul meter tetap terang & terlihat saat fase pilih kartu (HP & PC).
  drawHUD();
  gambarBossHealth();

  if (errorBanner) {
    const errH = H * 0.04;
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, H - errH, W, errH);
    ctx.fillStyle = "#ff6b6b";
    ctx.font = "bold " + Math.round(W * 0.014) + "px Zen Dots";
    ctx.fillText("ERROR: " + errorBanner, W * 0.008, H - errH * 0.3);
  }

  gambarMarkahVersi();
}

let soulIgniteStart = null;
let soulVoidStart = null;

// Tanda versi dicetak LANGSUNG ke kanvas game (selalu terlihat di layar
// permainan, bukan badge HTML yang bisa tertutup/terlewat). Kalau teks ini
// tidak muncul, berarti yang dimuat adalah file LAMA/salinan lain.
function gambarMarkahVersi() {
  try {
    const no = typeof BUILD_TERKINI === "number" ? BUILD_TERKINI : 0;
    if (!no) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 0.9;
    ctx.font = "bold 15px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(159,232,165,0.95)";
    ctx.strokeStyle = "rgba(0,0,0,0.75)";
    ctx.lineWidth = 3;
    const teks = "v" + no;
    ctx.strokeText(teks, 8, 8);
    ctx.fillText(teks, 8, 8);
    ctx.restore();
  } catch (err) {}
}

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

function gambarRambuPeringatan(cx, cy, u) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy - u / 2);
  ctx.lineTo(cx + u * 0.52, cy + u / 2);
  ctx.lineTo(cx - u * 0.52, cy + u / 2);
  ctx.closePath();
  ctx.fillStyle = "#ffb020";
  ctx.fill();
  ctx.strokeStyle = "#7a2d00";
  ctx.lineWidth = Math.max(1, u * 0.09);
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.strokeStyle = "#5b1a00";
  ctx.lineWidth = Math.max(2, u * 0.16);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx, cy - u * 0.26);
  ctx.lineTo(cx, cy + u * 0.02);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy + u * 0.24, Math.max(1.5, u * 0.06), 0, Math.PI * 2);
  ctx.fillStyle = "#5b1a00";
  ctx.fill();
  ctx.restore();
}

function gambarBossHealth() {
  let bos = null;
  for (const en of enemies) { if (en.bos) { bos = en; break; } }
  if (!bos || !bos.bosDef) return;
  if (bos.bosKematian) return;

  const def = bos.bosDef;
  const fase = def.fase[bos.fase];

  const s = Math.min(W / 1280, H / 960);
  const fs = (px) => Math.round(px * s);
  const bw = Math.round(W * 0.5);
  const bh = Math.round(34 * s);
  const bx = Math.round((W - bw) / 2);
  const sh = Math.min(W / 1280, H / 960) * 1.35;
  const by = Math.round((20 + 28 + 8 + 28 + 20) * sh);
  const ratio = Math.max(0, Math.min(1, bos.hp / bos.maxHp));

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold " + fs(22) + "px Zen Dots";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.9)";
  ctx.lineWidth = Math.max(2, fs(4));
  ctx.strokeText(def.nama, bx + bw / 2, by - Math.round(13 * s));
  ctx.fillStyle = "#ffb18a";
  ctx.fillText(def.nama, bx + bw / 2, by - Math.round(13 * s));
  ctx.font = "bold " + fs(14) + "px Zen Dots";
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.strokeText("FASE " + (bos.fase + 1) + "/" + def.fase.length, bx + bw / 2, by - Math.round(34 * s));
  ctx.fillText("FASE " + (bos.fase + 1) + "/" + def.fase.length, bx + bw / 2, by - Math.round(34 * s));
  ctx.restore();

  // Satu bar utuh Ã¢â‚¬â€ tidak dipecah per fase. Warna mengikuti fase aktif.
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
  gambarBundar(bx - 4, by - 4, bw + 8, bh + 8, (bh + 8) / 2);
  ctx.fill();
  ctx.fillStyle = "#2a0d0d";
  gambarBundar(bx, by, bw, bh, bh / 2);
  ctx.fill();

  const iw = bw - 4, ih = bh - 4;
  ctx.save();
  gambarBundar(bx + 2, by + 2, iw, ih, ih / 2);
  ctx.clip();
  const wIsi = iw * ratio;
  if (wIsi > 0.5) {
    ctx.fillStyle = fase.warnaBar;
    ctx.fillRect(bx + 2, by + 2, wIsi, ih);
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(bx + 2, by + 2, wIsi, ih * 0.32);
  }
  ctx.restore();
  ctx.restore();

  ctx.strokeStyle = "#ffb18a";
  ctx.lineWidth = Math.max(1, Math.round(2 * s));
  gambarBundar(bx + Math.round(1 * s), by + Math.round(1 * s), bw - Math.round(2 * s), bh - Math.round(2 * s), bh / 2);
  ctx.stroke();
  ctx.save();
  ctx.font = "bold " + fs(20) + "px Zen Dots";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
  ctx.lineWidth = Math.max(2, fs(3));
  ctx.strokeText(Math.round(ratio * 100) + "%", bx + bw / 2, by + bh / 2 + Math.round(1 * s));
  ctx.fillStyle = "#fff";
  ctx.fillText(Math.round(ratio * 100) + "%", bx + bw / 2, by + bh / 2 + Math.round(1 * s));
  ctx.restore();
}

function kartuDefById(id) {
  for (const k of KARTU_UPGRADE) if (k.id === id) return k;
  return null;
}

function gambarKartuUpgrade() {
  ctx.save();
  const t = (performance.now() - kartuMulaiPada) / 1000;
  const muncul = (i) => Math.max(0, Math.min(1, (t - 0.25 - i * 0.12) / 0.28));

  ctx.fillStyle = "rgba(5, 8, 18, 0.78)";
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ffd23f";
  ctx.font = "bold " + Math.round(W * 0.036) + "px Zen Dots";
  ctx.fillText("PILIH KARTU", W / 2, H * 0.28);

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

    ctx.fillStyle = "rgba(0,0,0,0.45)";
    gambarBundar(-r.w / 2 + 4, 4, r.w, r.h, 12);
    ctx.fill();

    const tierDef = TIER_DEF[kart.tier || "common"] || TIER_DEF.common;
    const tGaris = tierDef.garis || "#59492f";
    const tAksen = tierDef.aksen || "#9a7b3c";
    const bg = tierDef.bg || TIER_DEF.common.bg;
    ctx.fillStyle = hover ? bg.hover : bg.gelap;
    if (kart.tier !== "common") { ctx.shadowColor = tGaris + "88"; ctx.shadowBlur = 20; }
    gambarBundar(-r.w / 2, 0, r.w, r.h, 12);
    ctx.fill();
    ctx.shadowBlur = 0;

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

      ctx.fillText("\u265B", -r.w / 2 + r.w * 0.15, -r.h / 2 + r.w * 0.18);
      ctx.fillText("\u265B", r.w / 2 - r.w * 0.15, r.h / 2 - r.w * 0.18);

      ctx.fillStyle = "rgba(180, 120, 12, 0.20)";
      gambarBundar(-r.w * 0.36, r.h * 0.43, r.w * 0.72, r.h * 0.04, 5);
      ctx.fill();
      ctx.fillStyle = tAksen;
      ctx.font = "bold " + Math.round(r.w * 0.05) + "px Zen Dots";
      ctx.globalAlpha = 0.8 * a;
      ctx.fillText("\u2726 \u265B \u2726", 0, r.h * 0.43);
      ctx.globalAlpha = a;
    }

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

    ctx.font = "bold " + Math.round(r.w * 0.082) + "px Zen Dots";
    ctx.fillStyle = "#241f18";
    ctx.fillText(kart.nama, 0, r.h * 0.075);

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

  if (burnProgress > 0.3) {
    ctx.fillStyle = "rgba(255, 245, 170, " + (0.35 * burnProgress) + ")";
    for (let i = 0; i < 7; i++) {
      const mx = px + ((i * 38 + t * 45) % pw);
      const mw = 14 + 6 * Math.sin(t * 4 + i);
      ctx.fillRect(Math.max(px + 1, mx - mw / 2), py + 2, mw, ph * 0.45);
    }
  }

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

    const distFromCenter = Math.abs(i - centerIdx) / centerIdx;

    const shapeHeight = 0.42 + 2.43 * Math.pow(distFromCenter, 1.8);

    const outwardDir = (i < centerIdx) ? -1 : (i > centerIdx ? 1 : 0);
    const outwardSway = outwardDir * (Math.pow(distFromCenter, 1.4) * 7.5);

    const fT1 = t * 6.5 + i * 1.4;
    const flk1 = 0.6 + 0.4 * Math.sin(fT1) + 0.2 * Math.cos(fT1 * 1.8);
    const h1 = ph * shapeHeight * (0.85 + 0.4 * flk1) * flameGrow;
    const sway1 = outwardSway + Math.sin(t * 5 + i * 1.1) * 3;
    const w1 = stepW * (1.1 + 0.3 * distFromCenter);
    gambarLidah(bx, py + 1, w1, h1, sway1, "#b31008", "#ff3d00");

    const fT2 = t * 8.0 + i * 1.7 + 0.8;
    const flk2 = 0.5 + 0.5 * Math.sin(fT2);
    const h2 = h1 * 0.72;
    const sway2 = outwardSway * 0.8 + Math.sin(t * 6.5 + i * 1.3 + 0.5) * 2.5;
    const w2 = w1 * 0.75;
    gambarLidah(bx, py + 1, w2, h2, sway2, "#ff5500", "#ffa600");

    const h3 = h1 * 0.42;
    const sway3 = outwardSway * 0.5 + Math.sin(t * 8 + i * 1.5) * 1.5;
    const w3 = w1 * 0.46;
    gambarLidah(bx, py + 1, w3, h3, sway3, "#ffe042", "#ffffff");
  }

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

const PILAR_KRISTAL_ES = [

  { xr: 0.03, w: 16, h: 40, tilt: 2 },
  { xr: 0.08, w: 14, h: 30, tilt: 1 },
  { xr: 0.14, w: 13, h: 22, tilt: 0 },
  { xr: 0.20, w: 12, h: 15, tilt: 0 },

  { xr: 0.27, w: 11, h: 10, tilt: 0 },
  { xr: 0.35, w: 10, h: 8, tilt: 0 },
  { xr: 0.43, w: 10, h: 7, tilt: 0 },
  { xr: 0.50, w: 11, h: 9, tilt: 0 },
  { xr: 0.57, w: 10, h: 7, tilt: 0 },
  { xr: 0.65, w: 10, h: 8, tilt: 0 },
  { xr: 0.73, w: 11, h: 10, tilt: 0 },

  { xr: 0.80, w: 12, h: 15, tilt: 0 },
  { xr: 0.86, w: 13, h: 22, tilt: 0 },
  { xr: 0.92, w: 14, h: 30, tilt: -1 },
  { xr: 0.97, w: 16, h: 40, tilt: -2 }
];

const TETESAN_ES = [
  { xr: 0.04, w: 8, h: 15 },
  { xr: 0.12, w: 6, h: 9 },
  { xr: 0.22, w: 5, h: 6 },
  { xr: 0.35, w: 6, h: 8 },
  { xr: 0.48, w: 5, h: 5 },
  { xr: 0.62, w: 6, h: 7 },
  { xr: 0.76, w: 5, h: 6 },
  { xr: 0.88, w: 7, h: 11 },
  { xr: 0.96, w: 8, h: 16 }
];

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

function gambarPrismaKristal(bx, by, w, h, tilt, grow) {
  if (grow <= 0.05) return;
  const ch = h * grow;
  const tipX = bx + tilt;
  const tipY = by - ch;

  ctx.fillStyle = "#d8f2ff";
  ctx.beginPath();
  ctx.moveTo(bx - w / 2, by);
  ctx.lineTo(tipX, tipY);
  ctx.lineTo(bx, by);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#38bdf8";
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(tipX, tipY);
  ctx.lineTo(bx + w / 2, by);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();

  ctx.strokeStyle = "rgba(186, 230, 253, 0.6)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bx - w / 2, by);
  ctx.lineTo(tipX, tipY);
  ctx.lineTo(bx + w / 2, by);
  ctx.stroke();
}

function gambarIcicle(bx, by, w, h, grow) {
  if (grow <= 0.05) return;
  const ch = h * grow;
  const tipX = bx;
  const tipY = by + ch;

  ctx.fillStyle = "#bae6fd";
  ctx.beginPath();
  ctx.moveTo(bx - w / 2, by);
  ctx.lineTo(tipX, tipY);
  ctx.lineTo(bx, by);
  ctx.closePath();
  ctx.fill();

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

function gambarApiEs(px, py, pw, ph, t, freezeProgress = 1.0, tanpGlow = false) {
  ctx.save();

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

  const crystalGrow = Math.min(1.0, freezeProgress * 1.3);
  if (freezeProgress > 0.25) {

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

  for (const sp of PILAR_KRISTAL_ES) {
    const bx = px + sp.xr * pw;
    gambarPrismaKristal(bx, py + 1, sp.w, sp.h, sp.tilt, crystalGrow);
  }

  for (const ic of TETESAN_ES) {
    const bx = px + ic.xr * pw;
    gambarIcicle(bx, py + ph, ic.w, ic.h, crystalGrow);
  }

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

  const sparkPoints = [
    { rx: 0.03, ry: -38, period: 2.8, offset: 0.2 },
    { rx: 0.97, ry: -38, period: 3.2, offset: 1.6 },
    { rx: 0.08, ry: -28, period: 2.5, offset: 0.9 },
    { rx: 0.92, ry: -28, period: 3.6, offset: 2.1 },
    { rx: 0.50, ry: -8, period: 2.2, offset: 0.5 },
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

const SOUL_ANIM_K = 20;
const SOUL_ANIM_RATE = 20;
let soulAnim = null;

function bakeSoulAnim(jenis, bw, bh) {
  let over, under, side;
  if (jenis === "api") {
    over = Math.ceil(bh * 5.6) + 6;
    under = Math.ceil(bh * 0.35) + 10;
    side = 12;
  } else {
    over = Math.ceil(bh * 1.4) + 14;
    under = Math.ceil(bh) + 64;
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
      csctx.translate(side, over);
      if (jenis === "api") gambarApiPixel(0, 0, bw, bh, t, 1.0, true);
      else gambarApiEs(0, 0, bw, bh, t, 1.0, true);
    } finally {
      ctx = ctxAsli;
    }
    frames.push(cs);
  }
  return { jenis: jenis, frames: frames, left: side, top: over };
}

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
  } else if (jenis === "void") {
    const glowR = pw * 0.52;
    const denyut = (0.6 + 0.3 * Math.sin(t * 2.8)) * progress;
    const gl = ctx.createRadialGradient(px + pw / 2, py + ph / 2, 2, px + pw / 2, py + ph / 2, glowR);
    gl.addColorStop(0, "rgba(124, 58, 237, " + (0.4 * denyut) + ")");
    gl.addColorStop(0.5, "rgba(88, 28, 135, " + (0.16 * denyut) + ")");
    gl.addColorStop(0.85, "rgba(30, 11, 56, " + (0.05 * denyut) + ")");
    gl.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gl;
    ctx.beginPath();
    ctx.arc(px + pw / 2, py + ph / 2, glowR, 0, Math.PI * 2);
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

function blitSoulFrame(frames, t, x, y, alpha) {
  blitX(frames, t, SOUL_ANIM_RATE, x, y, alpha);
}

function gambarVoidSoul(px, py, pw, ph, t, progress) {
  const cx = px + pw / 2;
  const cy = py + ph / 2;
  const R = ph * 1.7 * (0.92 + 0.08 * Math.sin(t * 3));
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (let k = 0; k < 3; k++) {
    const rk = R * (1.45 + k * 0.5);
    ctx.strokeStyle = "rgba(139, 92, 246, " + (0.6 * progress) + ")";
    ctx.lineWidth = Math.max(1.5, R * 0.3 - k * R * 0.08);
    ctx.beginPath();
    ctx.arc(cx, cy, rk, t * (2 + k * 0.8) + k * 2.1, t * (2 + k * 0.8) + k * 2.1 + Math.PI * 1.35);
    ctx.stroke();
  }

  const gc = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
  gc.addColorStop(0, "#000000");
  gc.addColorStop(0.55, "#140528");
  gc.addColorStop(1, "rgba(124, 58, 237, 0.5)");
  ctx.fillStyle = gc;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.85, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(196, 181, 253, " + (0.75 * progress) + ")";
  ctx.lineWidth = Math.max(1.5, R * 0.14);
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.78, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 12; i++) {
    const a0 = (i / 12) * Math.PI * 2 + t * 2.4;
    const fr = (i * 0.11 + t * 0.55) % 1;
    const rr = R * (2 - fr * 1.3);
    const px2 = cx + Math.cos(a0 - fr * 1.7) * rr;
    const py2 = cy + Math.sin(a0 - fr * 1.7) * rr * 0.92;
    ctx.fillStyle = (i % 2 === 0 ? "rgba(192, 132, 252, " : "rgba(139, 92, 246, ") + ((1 - fr) * 0.85 * progress).toFixed(3) + ")";
    ctx.fillRect(px2 - 1.4, py2 - 1.4, 2.8, 2.8);
  }

  ctx.restore();
}

function gambarVoidTepi(px, py, pw, ph, t, progress) {
  const cx = px + pw / 2;
  const cy = py + ph / 2;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  // ---- ORNAMEN LUAR: partikel & ekor komet mengorbit di luar garis bar ----
  const Rx = pw * 0.62 + ph * 0.55;
  const Ry = ph * 1.1;
  const nLuar = 22;
  for (let i = 0; i < nLuar; i++) {
    const a0 = (i / nLuar) * Math.PI * 2 + t * 0.9;
    const ex = cx + Math.cos(a0) * Rx;
    const ey = cy + Math.sin(a0) * Ry;
    const siz = 3 + (i % 3) * 1.6;
    const al = (0.5 + 0.5 * Math.sin(t * 3 + i)) * progress;
    ctx.fillStyle = (i % 2 === 0 ? "rgba(192, 132, 252, " : "rgba(168, 85, 247, ") + al.toFixed(3) + ")";
    ctx.fillRect(ex - siz / 2, ey - siz / 2, siz, siz);
  }
  for (let k = 0; k < 3; k++) {
    const t0 = t * 1.15 + k * 2.1;
    for (let j = 0; j < 8; j++) {
      const a1 = t0 + j * 0.16;
      ctx.fillStyle = "rgba(139, 92, 246, " + ((1 - j / 8) * 0.55 * progress).toFixed(3) + ")";
      ctx.fillRect(cx + Math.cos(a1) * Rx - 1.7, cy + Math.sin(a1) * Ry - 1.7, 3.4, 3.4);
    }
  }
  // ornamen magnitudo di 4 sudut (ziarah berlian luar)
  for (let k = 0; k < 4; k++) {
    const sx = k === 0 ? px - ph * 0.75 : k === 1 ? px + pw + ph * 0.75 : k === 2 ? px - ph * 0.75 : px + pw + ph * 0.75;
    const sy = k === 1 || k === 0 ? py - ph * 0.75 : py + ph + ph * 0.75;
    const rot = t * 2.2 + k * 1.57;
    const Lm = ph * 0.5 * (1 + 0.25 * Math.sin(t * 4 + k * 2));
    ctx.strokeStyle = "rgba(168, 85, 247, " + (0.85 * progress) + ")";
    ctx.lineWidth = Math.max(1.6, ph * 0.12);
    ctx.beginPath();
    for (let j = 0; j < 4; j++) {
      const a = rot + j * Math.PI / 2;
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(a) * Lm, sy + Math.sin(a) * Lm);
    }
    ctx.stroke();
  }

  // ---- partikel TEPI bar yang tersedot ke inti void (lebih tebal) ----
  const kel = 2 * (pw + ph);
  for (let i = 0; i < 24; i++) {
    const fr = (t * 0.42 + i * 0.061) % 1;
    const jarak = fr * kel;
    let ex0, ey0;
    if (jarak < pw) { ex0 = px + jarak; ey0 = py; }
    else if (jarak < pw + ph) { ex0 = px + pw; ey0 = py + jarak - pw; }
    else if (jarak < 2 * pw + ph) { ex0 = px + pw - (jarak - pw - ph); ey0 = py + ph; }
    else { ex0 = px; ey0 = py + ph - (jarak - 2 * pw - ph); }
    const mode = Math.min(1, fr * fr * 3); // makin dekat pusat makin cepat terserap
    const px2 = ex0 + (cx - ex0) * mode;
    const py2 = ey0 + (cy - ey0) * mode;
    const alfa = (1 - fr) * (0.95 * progress);
    ctx.fillStyle = (i % 3 === 0 ? "rgba(192, 132, 252, " : (i % 3 === 1 ? "rgba(139, 92, 246, " : "rgba(168, 85, 247, ")) + alfa.toFixed(3) + ")";
    const ukur = 2.4 + (i % 4) * 1.0;
    ctx.fillRect(px2 - ukur / 2, py2 - ukur / 2, ukur, ukur);
  }

  // pusaran (vortex) kecil di 4 sudut bar, sedikit lebih besar
  for (let k = 0; k < 4; k++) {
    const sudutX = k === 0 || k === 1 ? px : px + pw;
    const sudutY = k === 0 || k === 2 ? py : py + ph;
    for (let j = 0; j < 2; j++) {
      ctx.strokeStyle = "rgba(139, 92, 246, " + (0.6 * progress) + ")";
      ctx.lineWidth = Math.max(1.3, ph * 0.1);
      ctx.beginPath();
      ctx.arc(sudutX, sudutY, ph * (0.34 + j * 0.26), t * (1.4 + j * 0.9) + k * 1.57, t * (1.4 + j * 0.9) + k * 1.57 + Math.PI * 1.5);
      ctx.stroke();
    }
  }

  // cincin denyut yang memancar dari void dan pudar di tepi bar
  ctx.beginPath();
  ctx.rect(px, py, pw, ph);
  ctx.clip();
  for (let k = 0; k < 3; k++) {
    const rr = ((t * 0.75) % 1 + k / 3) % 1;
    ctx.strokeStyle = "rgba(168, 85, 247, " + ((1 - rr) * 0.45 * progress).toFixed(3) + ")";
    ctx.lineWidth = Math.max(1, ph * 0.14 * (1 - rr));
    ctx.beginPath();
    ctx.arc(cx, cy, ph * (0.4 + rr * 3.4), 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}
  function gambarTepiSoul(x, y, w, h, t, aksen) {
  const blok = Math.max(8, Math.round(h * 0.8));
  const tebal = Math.max(3, h * 0.16);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.shadowColor = aksen;
  ctx.shadowBlur = 15;
  ctx.strokeStyle = aksen;
  ctx.lineWidth = tebal;
  ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
  ctx.shadowBlur = 0;
  ctx.lineWidth = Math.max(1.5, h * 0.06);
  ctx.strokeRect(x + 4 + tebal, y + 4 + tebal, w - 8 - tebal * 2, h - 8 - tebal * 2);
  ctx.lineWidth = tebal * 1.15;
  ctx.strokeStyle = aksen;
  ctx.beginPath();
  ctx.moveTo(x, y + blok);
  ctx.lineTo(x, y);
  ctx.lineTo(x + blok, y);
  ctx.moveTo(x + w - blok, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + blok);
  ctx.moveTo(x + w, y + h - blok);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w - blok, y + h);
  ctx.moveTo(x + blok, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + h - blok);
  ctx.stroke();
  const kel = 2 * (w + h);
  for (let i = 0; i < 6; i++) {
    const fr = (t * (0.7 + 0.3 * (i % 2)) + i * 0.19) % 1;
    const jarak = fr * kel;
    let pxp, pyp;
    if (jarak < w) { pxp = x + jarak; pyp = y; }
    else if (jarak < w + h) { pxp = x + w; pyp = y + jarak - w; }
    else if (jarak < 2 * w + h) { pxp = x + w - (jarak - w - h); pyp = y + h; }
    else { pxp = x; pyp = y + h - (jarak - 2 * w - h); }
    ctx.globalAlpha = Math.max(0.15, (1 - fr) * 0.85);
    ctx.fillStyle = aksen;
    ctx.fillRect(pxp - 2, pyp - 2, 4, 4);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function gambarBurstSoul(jenis, cx, cy, h, tNow, start) {
  if (start === null) return;
  const age = tNow - start;
  if (age <= 0 || age > 0.95) return;
  const q = 1 - age / 0.95;
  const w1 = jenis === "api" ? "255, 190, 80" : (jenis === "void" ? "196, 181, 253" : "226, 242, 254");
  const w2 = jenis === "api" ? "255, 80, 20" : (jenis === "void" ? "124, 58, 237" : "56, 189, 248");
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  const R1 = h * (2.2 + age * 16);
  ctx.strokeStyle = "rgba(" + w1 + ", " + (0.5 * q).toFixed(3) + ")";
  ctx.lineWidth = Math.max(1, h * 0.55 * q);
  ctx.beginPath();
  ctx.arc(cx, cy, R1, 0, Math.PI * 2);
  ctx.stroke();

  const R2 = h * (0.8 + age * 21);
  if (R2 > h * 1.5) {
    ctx.strokeStyle = "rgba(" + w2 + ", " + (0.4 * q).toFixed(3) + ")";
    ctx.lineWidth = Math.max(1, h * 0.35 * q);
    ctx.beginPath();
    ctx.arc(cx, cy, R2, 0, Math.PI * 2);
    ctx.stroke();
  }

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

  ctx.fillStyle = "rgba(255, 255, 255, " + (0.55 * q).toFixed(3) + ")";
  ctx.beginPath();
  ctx.arc(cx, cy, h * 0.9, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function gambarPanahEsSatuan(tipX, cy, h, alfa, sgr) {
  const m = sgr;
  const w2 = h * 0.6 * m, L = h * 3.4 * m, tj = h * 0.95 * m, hn = h * 0.45 * m;
  ctx.save();
  ctx.globalAlpha = alfa;
  ctx.globalCompositeOperation = "lighter";

  const gA = ctx.createLinearGradient(tipX - L, 0, tipX, 0);
  gA.addColorStop(0, "rgba(56, 189, 248, 0)");
  gA.addColorStop(0.7, "rgba(56, 189, 248, 0.3)");
  gA.addColorStop(1, "rgba(224, 242, 254, 0.55)");
  ctx.fillStyle = gA;
  ctx.beginPath();
  ctx.ellipse(tipX - L * 0.42, cy, L * 0.72, w2 * 1.7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(tipX, cy);
  ctx.lineTo(tipX - tj, cy - w2);
  ctx.lineTo(tipX - tj * 0.7, cy);
  ctx.lineTo(tipX - tj, cy + w2);
  ctx.fill();

  ctx.fillStyle = "rgba(224, 242, 254, 0.95)";
  ctx.beginPath();
  ctx.moveTo(tipX, cy);
  ctx.lineTo(tipX - tj, cy - w2 * 0.5);
  ctx.lineTo(tipX - tj * 0.74, cy);
  ctx.lineTo(tipX - tj, cy + w2 * 0.5);
  ctx.fill();

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

  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.fillRect(tipX - L * 0.8, cy - hn * 0.22, L * 0.5, hn * 0.44);

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

function gambarPanahEsSoul(x0, wBar, cy, h, tNow, sweep, start) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const umur = start !== null ? tNow - start : 9999;
  if (sweep < 1) {
    const tipX = x0 + wBar * sweep;

    gambarPanahEsSatuan(tipX - h * 4.1, cy, h, 0.28, 0.85);
    gambarPanahEsSatuan(tipX - h * 7.2, cy, h, 0.1, 0.7);

    gambarPanahEsSatuan(tipX, cy, h, 1, 1);

    const sh1 = 0.6 + 0.4 * Math.sin(tNow * 25);
    ctx.fillStyle = "rgba(240, 253, 255, " + (0.75 * sh1).toFixed(3) + ")";
    ctx.beginPath();
    ctx.arc(tipX + h * 0.15, cy, h * (0.3 + 0.12 * sh1), 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 6; i++) {
      const fr = (i * 0.17 + tNow * 1.3) % 1;
      const fx = tipX - h * (0.5 + fr * 5);
      const fy = cy + Math.sin(fr * Math.PI * 2 + i) * h * 1.6 - h * 0.5;
      ctx.fillStyle = i % 2 === 0 ? "rgba(224, 242, 254, " + ((1 - fr) * 0.8).toFixed(3) + ")"
        : "rgba(125, 211, 252, " + ((1 - fr) * 0.6).toFixed(3) + ")";
      ctx.fillRect(fx, fy, h * 0.14, h * 0.14);
    }
  }

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

function gambarNyalaSoul(jenis, x, y, w, h, tNow) {
  const kunci = jenis === "api" ? "255, 200, 80" : (jenis === "void" ? "139, 92, 246" : "186, 230, 253");
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  ctx.setLineDash([w * 0.22, w * 0.16]);
  ctx.lineDashOffset = -tNow * w * 0.8;
  ctx.strokeStyle = "rgba(" + kunci + ", 0.75)";
  ctx.lineWidth = Math.max(1, h * 0.05);
  ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
  ctx.setLineDash([]);

  for (let i = 0; i < 12; i++) {
    const ph = (tNow * 0.9 + i * 0.61) % 1;
    const xi = x + w * 0.12 + w * 0.76 * ((i * 97) % 100) / 100 + Math.sin(tNow * 2 + i * 1.7) * 3;
    const a = Math.sin(ph * Math.PI);
    const yi = jenis === "es"
      ? y - 36 + ph * (h + 36)
      : y + h - 5 - ph * (h + 48);
    const colr = jenis === "api"
      ? (i % 3 === 0 ? "255, 248, 214" : (i % 3 === 1 ? "255, 184, 51" : "255, 77, 23"))
      : (jenis === "void"
        ? (i % 3 === 0 ? "216, 180, 254" : (i % 3 === 1 ? "168, 85, 247" : "124, 58, 237"))
        : (i % 3 === 0 ? "255, 255, 255" : (i % 3 === 1 ? "224, 242, 254" : "125, 211, 252")));
    ctx.fillStyle = "rgba(" + colr + ", " + (0.85 * a).toFixed(3) + ")";
    ctx.fillRect(xi - 1.2, yi - 1.2, 2.4, 2.4);
  }

  const sw = (tNow * 0.55) % 1.4;
  if (sw < 0.6) {
    const t2 = sw / 0.6;
    const sx0 = x - w * 0.5 + t2 * (w * 1.5);
    ctx.fillStyle = "rgba(255, 255, 255, " + (0.16 * Math.sin(t2 * Math.PI)).toFixed(3) + ")";
    ctx.fillRect(sx0, y + 1.5, w * 0.5, Math.max(2, h * 0.12));
  }

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

// ===== efek bar skill TERKUNCI di HUD mode 3-skill =====
// Gembok di sisi kiri, rantai segar berkilau melintasi bar dengan goyangan
// halus, garis-garis diagonal samar, dan denyut lembut (skill belum terbuka).
function gambarGembok(ctx, x, y, sk, tNow) {
  const denyut = 0.55 + 0.45 * Math.abs(Math.sin(tNow * 2.2));
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sk, sk);
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(212,219,230," + (0.7 + 0.3 * denyut) + ")";
  ctx.lineWidth = 0.24;
  ctx.beginPath();
  ctx.arc(0.15, -0.12, 0.42, Math.PI * 1.05, Math.PI * 1.95);
  ctx.stroke();
  const bw = 1.1, bh = 0.9, c = 0.16;
  ctx.fillStyle = "rgba(155,166,186," + (0.85 + 0.15 * denyut) + ")";
  ctx.beginPath();
  ctx.moveTo(-bw / 2 + c, -bh / 2 + 0.18);
  ctx.lineTo(bw / 2 - c, -bh / 2 + 0.18);
  ctx.quadraticCurveTo(bw / 2, -bh / 2 + 0.18, bw / 2, -bh / 2 + 0.18 + c);
  ctx.lineTo(bw / 2, bh / 2 - 0.12 - c);
  ctx.quadraticCurveTo(bw / 2, bh / 2 - 0.12, bw / 2 - c, bh / 2 - 0.12);
  ctx.lineTo(-bw / 2 + c, bh / 2 - 0.12);
  ctx.quadraticCurveTo(-bw / 2, bh / 2 - 0.12, -bw / 2, bh / 2 - 0.12 - c);
  ctx.lineTo(-bw / 2, -bh / 2 + 0.18 + c);
  ctx.quadraticCurveTo(-bw / 2, -bh / 2 + 0.18, -bw / 2 + c, -bh / 2 + 0.18);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(13,18,26,.95)";
  ctx.beginPath();
  ctx.arc(0.02, -0.02, 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-0.055, 0.02, 0.15, 0.24);
  ctx.restore();
}

function gambarRantai(ctx, x, y, w, warna, tNow) {
  const n = Math.max(10, Math.round(w / 16));
  const paso = w / n;
  const r = Math.max(2, paso * 0.32);
  const bob = Math.max(0.6, r * 0.4);
  ctx.lineCap = "round";
  for (let i = 0; i <= n; i++) {
    const cx = x + i * paso;
    const cy = y + Math.sin(tNow * 2.4 + i * 0.85) * bob * 0.4;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((i % 2 === 0 ? 1 : -1) * 0.5);
    ctx.strokeStyle = "rgba(0,0,0,.45)";
    ctx.lineWidth = r * 1.05;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.15, r * 0.68, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = warna;
    ctx.lineWidth = r * 0.8;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.15, r * 0.68, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.22)";
    ctx.lineWidth = r * 0.3;
    ctx.beginPath();
    ctx.ellipse(r * 0.18, -r * 0.16, r * 0.8, r * 0.45, 0, 3.4, 4.8);
    ctx.stroke();
    ctx.restore();
  }
}

function gambarBarTerkunci(ctx, x, y, w, h, tNow) {
  const g = h / 20;
  ctx.save();
  ctx.fillStyle = "rgba(10,14,20,.94)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(138,147,165,.10)";
  ctx.lineWidth = Math.max(1, g);
  for (let xx = x - h; xx < x + w; xx += h * 0.55) {
    ctx.beginPath();
    ctx.moveTo(xx, y + h);
    ctx.lineTo(xx + h, y);
    ctx.stroke();
  }
  gambarGembok(ctx, x + h * 1.0, y + h * 0.48, h * 0.42, tNow);
  gambarRantai(ctx, x + h * 1.75, y + h * 0.5, w - h * 1.75 - 3, "rgba(138,147,165,.8)", tNow);
  ctx.restore();
}

function drawHUD() {
  const sx = W / 1280;
  const sy = H / 960;
  const s = Math.min(sx, sy) * 1.35;
  const m = Math.round(20 * s);
  const fs = (px) => Math.round(px * s);

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

  ctx.save();
  ctx.font = "bold " + fs(20) + "px Zen Dots";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const hpEdge = hpFillX + hpFillW * (player.hp / player.maxHp);
  ctx.fillStyle = "#fff";
  ctx.fillText(Math.round(player.hp) + "/" + player.maxHp, hpX + hpBarW / 2, hpY + hpBarH / 2);
  ctx.restore();

  ctx.font = fs(28) + "px Zen Dots";
  ctx.fillStyle = "#fff";
  ctx.fillText("HP", hpX + hpBarW + Math.round(12 * s), hpY + hpBarH * 0.85);

  const infoW = Math.round(340 * s);
  const infoPad = Math.round(5 * s);
  const infoBaris = 3;
  const infoH = Math.round(64 * s);
  const infoLineH = Math.round((infoH - infoPad * 2) / infoBaris);
  const infoX = W - infoW - m, infoY = m;

  ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
  ctx.fillRect(infoX, infoY, infoW, infoH);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  ctx.lineWidth = Math.max(1, Math.round(2 * s));
  ctx.strokeRect(infoX + Math.round(1 * s), infoY + Math.round(1 * s), infoW - Math.round(2 * s), infoH - Math.round(2 * s));

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const infoYbaris = (baris) => infoY + infoPad + infoLineH * baris + Math.round(infoLineH / 2);
  const sisa = Math.max(0, LEVELS[level].jumlah - (levelSpawn - enemies.length));
  if (karakter) {
    ctx.font = "bold " + fs(17) + "px Zen Dots";
    ctx.fillStyle = "#ffd23f";
    ctx.fillText(karakter.nama.toUpperCase(), infoX + infoPad, infoYbaris(0));
  }
  ctx.font = fs(15) + "px Zen Dots";
  ctx.fillStyle = "#ffd23f";
  ctx.fillText("WAVES " + (level - waveMulaiLevel() + 1) + "/" + totalWaveLevel(), infoX + infoPad, infoYbaris(1));
  ctx.textAlign = "right";
  ctx.fillStyle = "#fff";
  ctx.fillText("MUSUH " + sisa, infoX + infoW - infoPad, infoYbaris(1));
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffd23f";
  ctx.fillText("KOIN " + koin, infoX + infoPad, infoYbaris(2));
  ctx.textBaseline = "alphabetic";

  // nama skill = slot yang SEDANG terpasang (bukan hardcode per karakter)
  let namaSkill = karakter && karakter.tipe === "dekat" ? "HEATWAVE" : "FROSTBITE";
  if (karakter) {
    const slotDipakai = typeof skillPakai === "function" ? skillPakai(karakter.kunci) : 2;
    const daftar = typeof daftarSkill === "function" ? daftarSkill(karakter.kunci) : [];
    const def = daftar[slotDipakai - 1];
    if (def && def.nama) namaSkill = def.nama;
  }
  const warnaSkill = karakter && karakter.kunci === "voiz"
    ? "#a78bfa"
    : (karakter && karakter.tipe === "jarak" ? "#7dd3fc" : "#ffd23f");
  const skY = hpY + hpBarH + Math.round(8 * s);
  const skBarW = hpBarW, skBarH = hpBarH;

  const mode3 = typeof pakaiModeTigaSkill === "function" && pakaiModeTigaSkill();
  if (mode3 && karakter) {
    // HUD mode 3 skill: tiga bar kecil (keybind 1/2/3), semua berbagi CD global
    // tapi tiap bar memakai CD skillnya sendiri (cdSkill).
    // 1 = skill bawaan, 2 = slot 3, 3 = slot 4
    const daftar = daftarSkill(karakter.kunci);
    const slots = [2, 3, 4];
    const lbls = ["1", "2", "3"];
    const bb = Math.max(6, Math.round(hpBarH * 0.5));
    const step = bb + Math.max(4, Math.round(5 * s));
    let by = skY;
    ctx.font = "bold " + fs(17) + "px Zen Dots";
    ctx.textBaseline = "alphabetic";
    for (let i = 0; i < 3; i++) {
      const def = daftar[slots[i] - 1] || {};
      const terkunci = levelKarakter(karakter.kunci) < (typeof def.level === "number" ? def.level : 0);
      const mm = Math.max(3, Math.round(4 * s));
      const nm = (def.nama || "SKILL").slice(0, 12);
      ctx.textAlign = "left";
      if (terkunci) {
        // skill belum terbuka: bar digelapkan dan DIKUNCI OLEH GEMBOK + RANTAI
        gambarBarTerkunci(ctx, hpX, by, hpBarW, bb, performance.now() / 1000);
        ctx.fillStyle = "rgba(226,232,240,.95)";
        ctx.fillText(lbls[i], hpX + Math.max(3, Math.round(4 * s)), by + bb * 0.72);
        ctx.fillStyle = "rgba(148,163,184,.9)";
        ctx.fillText(nm, hpX + Math.max(20, Math.round(bb * 1.9)), by + bb * 0.72);
        ctx.textAlign = "right";
        ctx.fillStyle = "#8a93a5";
        ctx.fillText("LV " + def.level, hpX + hpBarW - mm, by + bb * 0.72);
        ctx.textAlign = "left";
        by += step;
        continue;
      }
      const cd = cdSkill(karakter.kunci, slots[i]);
      const ratio = cd > 0 ? Math.max(0, Math.min(1, 1 - player.specialCd / cd)) : 0;
      ctx.fillStyle = "rgba(0,0,0,.8)";
      ctx.fillRect(hpX, by, hpBarW, bb);
      ctx.fillStyle = warnaSkill;
      ctx.fillRect(hpX + Math.max(2, Math.round(2 * s)), by + Math.max(2, Math.round(2 * s)),
        (hpBarW - Math.max(4, Math.round(4 * s))) * ratio, bb - Math.max(4, Math.round(4 * s)));
      ctx.fillStyle = player.specialCd > 0 ? "rgba(255,255,255,.45)" : "#fff";
      ctx.fillText(lbls[i], hpX + mm, by + bb * 0.72);
      ctx.fillStyle = player.specialCd > 0 ? "rgba(255,255,255,.7)" : "#dbeafe";
      ctx.fillText(nm, hpX + Math.max(18, Math.round(20 * s)), by + bb * 0.72);
      if (player.specialCd > 0) {
        ctx.textAlign = "right";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = Math.max(1, Math.round(2 * s));
        ctx.strokeText(player.specialCd.toFixed(1), hpX + hpBarW - mm, by + bb * 0.72);
        ctx.fillStyle = "#fff";
        ctx.fillText(player.specialCd.toFixed(1), hpX + hpBarW - mm, by + bb * 0.72);
        ctx.textAlign = "left";
      }
      by += step;
    }
  } else {
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
  }

  if (deviceTerpilih === "mobile" && statusGame === "main" && player && player.kartu) {
    try {
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
    } catch (err) {}
  }

  const bwS = Math.round(W * 0.34);
  const bhS = Math.round(H * 0.045);
  const bxS = Math.round((W - bwS) / 2);
  const byS = H - Math.round(H * 0.09) - bhS;
  const tNow = performance.now() / 1000;
  const karakterVoiz = karakter && karakter.kunci === "voiz";
  const apiMenyala = !karakterVoiz && karakter && karakter.tipe === "dekat" && soul >= SOUL_MAX;
  const esMenyala = !karakterVoiz && karakter && karakter.tipe === "jarak" && soul >= SOUL_MAX;
  const voidMenyala = karakterVoiz && soul >= SOUL_MAX;

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

  let voidProgress = 1.0;
  if (voidMenyala) {
    if (soulVoidStart === null) {
      soulVoidStart = tNow;
      if (typeof spawnParticles === "function") {
        spawnParticles(bxS + bwS / 2, byS + bhS / 2, "#a855f7", 12);
        spawnParticles(bxS + bwS / 2, byS + bhS / 2, "#7c3aed", 20);
      }
      if (typeof addFlash === "function") {
        addFlash("rgba(124, 58, 237, 0.28)", 0.25, 0.35);
      }
    }
    voidProgress = Math.min(1.0, (tNow - soulVoidStart) / 0.75);
  } else {
    soulVoidStart = null;
  }

  const esSweep = soulFreezeStart !== null
    ? 1 - Math.pow(1 - Math.min(1, (tNow - soulFreezeStart) / 1.5), 3)
    : 1;

  ctx.fillStyle = "#000";
  ctx.fillRect(bxS, byS, bwS, bhS);
  if (voidMenyala) {
    soulAnim = null;
    gambarGlowBar(bxS, byS, bwS, bhS, tNow, "void", voidProgress);
    gambarVoidTepi(bxS, byS, bwS, bhS, tNow, voidProgress);
    gambarVoidSoul(bxS, byS, bwS, bhS, tNow, voidProgress);
    gambarBurstSoul("void", bxS + bwS / 2, byS + bhS / 2, bhS, tNow, soulVoidStart);
    gambarNyalaSoul("void", bxS, byS, bwS, bhS, tNow);
  } else if (apiMenyala) {
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

    gambarGlowBar(bxS, byS, bwS, bhS, tNow, "es", freezeProgress);
    blitSoulFrame(soulAnim.frames, tNow, bxS - soulAnim.left, byS - soulAnim.top, Math.min(1, freezeProgress * 1.4));
    gambarNyalaSoul("es", bxS, byS, bwS, bhS, tNow);

    gambarPanahEsSoul(bxS, bwS, byS + bhS / 2, bhS, tNow, esSweep, soulFreezeStart);
  } else {
    soulAnim = null;
    ctx.fillStyle = "#7cff5e";
    ctx.fillRect(bxS + 2, byS + 2, (bwS - 4) * Math.min(1, soul / SOUL_MAX), bhS - 4);
  }

  const soulFont = "bold " + fs(22) + "px Zen Dots";
  if (voidMenyala) {
    gambarTepiSoul(bxS, byS, bwS, bhS, tNow, "rgba(168, 85, 247, 0.95)");
    ctx.font = soulFont;
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(196, 181, 253, 0.9)";
    ctx.fillText("SOUL METER", bxS + bwS / 2, byS + bhS / 2 + fs(10));
    ctx.fillStyle = "#180526";
    ctx.fillText("SOUL METER", bxS + bwS / 2, byS + bhS / 2 + fs(8));
    ctx.textAlign = "left";
  } else if (apiMenyala) {
    gambarTepiSoul(bxS, byS, bwS, bhS, tNow, "rgba(255, 190, 80, 0.95)");
    ctx.font = soulFont;
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255, 235, 140, 0.85)";
    ctx.fillText("SOUL METER", bxS + bwS / 2, byS + bhS / 2 + fs(10));
    ctx.fillStyle = "#260601";
    ctx.fillText("SOUL METER", bxS + bwS / 2, byS + bhS / 2 + fs(8));
    ctx.textAlign = "left";
  } else if (esMenyala) {
    gambarTepiSoul(bxS, byS, bwS, bhS, tNow, "rgba(125, 211, 252, 0.95)");
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
    const ignT = apiMenyala ? soulIgniteStart : (esMenyala ? soulFreezeStart : (voidMenyala ? soulVoidStart : null));
    const umurText = ignT !== null ? tNow - ignT : 9999;
    const pop = umurText < 0.8 ? 1 + 0.32 * Math.pow(1 - umurText / 0.8, 2) : 1;
    ctx.save();
    ctx.translate(bxS + bwS / 2, byS + bhS + fs(24));
    ctx.scale(pop, pop);
    const pulse = 0.65 + 0.35 * Math.sin(tNow * 6);
    const gl = apiMenyala ? "255, 140, 63" : (esMenyala ? "125, 211, 252" : (voidMenyala ? "139, 92, 246" : "255, 210, 63"));
    if (voidMenyala) {
      ctx.fillStyle = "rgba(196, 181, 253, " + (pulse * voidProgress) + ")";
    } else if (apiMenyala) {
      ctx.fillStyle = "rgba(255, 215, 60, " + (pulse * burnProgress) + ")";
    } else if (esMenyala) {
      ctx.fillStyle = "rgba(186, 230, 253, " + (pulse * freezeProgress) + ")";
    } else {
      ctx.fillStyle = "#ffd23f";
    }
    ctx.fillText("ULTIMATE SIAP [R]", 0, 0);
    if (umurText < 0.8 && (apiMenyala || esMenyala || voidMenyala)) {
      ctx.shadowColor = "rgba(" + gl + ", 0.9)";
      ctx.shadowBlur = 18;
      ctx.fillStyle = "rgba(255, 255, 255, " + (0.6 * (1 - umurText / 0.8)).toFixed(3) + ")";
      ctx.fillText("ULTIMATE SIAP [R]", 0, 0);
      ctx.shadowBlur = 0;
    }
    ctx.restore();
    ctx.textAlign = "left";
  }

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

    const warnaDash = (karakter && karakter.warnaDash) ||
      (karakter && karakter.tipe === "dekat" ? "#ff4d4d" : "#7dd3fc");

    gambarSepatu(cx, cy, warnaDash, "#0c0f1e", "#ffffff");

    const nMax = Math.max(1, player.dashMax || 1);
    const rDot = Math.max(1, Math.round(7 * s));
    for (let i = 0; i < nMax; i++) {
      const sudut = -Math.PI / 2 + (i * Math.PI * 2) / nMax;

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

    if (player.dashCd > 0) {
      ctx.font = "bold " + fs(30) + "px Zen Dots";
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.fillText(player.dashCd.toFixed(1), cx, cy + Math.round(16 * s));
      ctx.textAlign = "left";
    }
  }
}
