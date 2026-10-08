// tools/buat-kenzro.js — generator sprite + animasi Kenzro.
//
// Cara pakai:
//   node tools\buat-kenzro.js "C:\Users\MyBook Hype AMD\Downloads\tes"
//
// Gaya: terilhami_guardian-tales — proporsi chibi (±2,4 kepala), TAPIouri seperti
//       karakter action: mata anime besar (sclera + iris + kilau), rambut poitnted,
//       tubuh kecil ramping (pinggang jelas), lengan siku, senjata besar.
//       Шading lembut: 3 nada per material + rim tipis 1px.
// Semua bentuk digambar dari primitif, tidak butuh aset luar.
//
// Keluaran: kenzro-baru.png (idle-0), kenzro-baru-8x.png,
//            frames/kenzro-{idle,walk,attack}-N.png, banding.png, index.html.

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const W = 64;
const H = 64;

// ---------------------------------------------------------------- palet
const PAL = {
  hair: ["#2a1f38", "#3d2f52", "#57436b"],
  skin: ["#c98f68", "#e5ab84", "#f7cba6"],
  white: ["#dfe6f0", "#f2f6fb", "#ffffff"],
  iris: ["#2b7fb8", "#3fa8d8", "#7fd8ee"],
  cloak: ["#1b2b45", "#26405f", "#33577c"],
  leather: ["#4a3220", "#66452c", "#825c3c"],
  wood: ["#33210f", "#4d3316", "#6b4a26"],
  ice: ["#2b8fb4", "#58c2da", "#a8ecfb"]
};
const OUTLINE = "#171226";
// Sprite asli isi baris 0..59 → figuredibuat turun 4px supaya rata bawah sama.
const OFFSET_Y = 4;
const MAT = {
  hair: 0, skin: 1, white: 2, iris: 3, cloak: 4, leather: 5, wood: 6, ice: 7
};
const NAMA_MAT = Object.keys(MAT);

let mat = new Int8Array(W * H);
let aksen = new Int8Array(W * H);

function kosongkan() {
  mat.fill(-1);
  aksen.fill(-1);
}
const px = (x, y, m, a = -1) => {
  x = Math.round(x);
  y = Math.round(y) + OFFSET_Y;
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  mat[y * W + x] = m;
  aksen[y * W + x] = a;
};
function kotak(x, y, w, h, m, a = -1) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, m, a);
}
function titik(x, y, m, t = 1, a = -1) {
  const o = Math.floor(t / 2);
  for (let j = 0; j < t; j++) for (let i = 0; i < t; i++) px(x + i - o, y + j - o, m, a);
}
function ellips(cx, cy, rx, ry, m, a = -1) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) px(x, y, m, a);
    }
  }
}
function garis(x0, y0, x1, y1, m, t = 1, a = -1) {
  let x = Math.round(x0);
  let y = Math.round(y0);
  const ex = Math.round(x1);
  const ey = Math.round(y1);
  const dx = Math.abs(ex - x);
  const dy = Math.abs(ey - y);
  const sx = x < ex ? 1 : -1;
  const sy = y < ey ? 1 : -1;
  let err = dx - dy;
  for (let guard = 0; guard < 4000; guard++) {
    titik(x, y, m, t, a);
    if (x === ex && y === ey) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
}
function busur(cx, cy, r, a0, a1, putar, m, t = 2, a = -1) {
  const cs = Math.cos(putar);
  const sn = Math.sin(putar);
  for (let i = 0; i <= 600; i++) {
    const ang = a0 + (a1 - a0) * (i / 600);
    const ex = Math.cos(ang) * r;
    const ey = Math.sin(ang) * r;
    px(cx + ex * cs - ey * sn, cy + ex * sn + ey * cs, m, a);
  }
  return [
    [cx + Math.cos(a0) * r * cs - Math.sin(a0) * r * sn, cy + Math.cos(a0) * r * sn + Math.sin(a0) * r * cs],
    [cx + Math.cos(a1) * r * cs - Math.sin(a1) * r * sn, cy + Math.cos(a1) * r * sn + Math.sin(a1) * r * cs]
  ];
}

const RAMBUT = MAT.hair;
const KULIT = MAT.skin;
const PUTIH = MAT.white;
const IRIS = MAT.iris;
const CLOAK = MAT.cloak;
const BAYA = MAT.leather;
const KAYU = MAT.wood;
const ES = MAT.ice;

// Mata anime: sclera + iris + pupil + kilau + eyelid atas.
function mata(cx, cy) {
  kotak(cx - 2, cy - 2, 5, 5, PUTIH, 2);
  px(cx - 2, cy - 2, KULIT, 0);
  px(cx + 2, cy - 2, KULIT, 0);
  px(cx - 2, cy + 2, KULIT, 0);
  px(cx + 2, cy + 2, KULIT, 0);
  kotak(cx - 1, cy - 1, 3, 3, IRIS, 1);
  px(cx, cy, RAMBUT, 0);
  px(cx - 1, cy - 2, PUTIH, 2);
  px(cx + 1, cy + 1, IRIS, 2);
  for (let x = -2; x <= 2; x++) px(cx + x, cy - 3, RAMBUT, 0);
  px(cx - 2, cy - 2, RAMBUT, 0);
  px(cx + 2, cy - 2, RAMBUT, 0);
}

// ---------------------------------------------------------------- satu frame
// pose: bob/kepala, kakiA/kakiB {dx,dy}, tarik 0..1, dorong 0..1, putar, hem, kilat.
function gambarFrame(pose) {
  kosongkan();
  const b = pose.bob || 0;
  const h = pose.kepala || 0;
  const tarik = pose.tarik || 0;
  const dorong = pose.dorong || 0;
  const putar = pose.putar || 0;
  const hem = pose.hem || 0;

  // 1. Cape di belakang
  for (let y = 0; y < 22; y++) {
    const yy = 25 + y + b;
    const melebar = Math.min(4, Math.floor(y / 5));
    const goyang = Math.round((y / 21) * hem);
    for (let x = 24 - melebar + goyang; x <= 38 + melebar - goyang; x++) px(x, yy, CLOAK);
  }
  for (let x = 19; x <= 43; x++) {
    const tinggi = 45 + ((x * 7) % 3);
    px(x, tinggi + b, CLOAK);
    if ((x + ((x * 5) % 2)) % 2 === 0) px(x, tinggi + 1 + b, CLOAK);
  }

  // 2. Tabung panah + bulu di belakang kepala
  garis(24, 22 + b, 27, 35 + b, BAYA, 3);
  for (let i = 0; i < 2; i++) {
    const x = 22 + i * 3;
    garis(x, 21 + b, x - 2, 11 + b, KAYU, 1, 1);
    px(x - 2, 10 + b, ES, 2);
    px(x - 3, 11 + b, ES, 1);
  }

  // 3. Kaki pendek + sepatu
  const kA = pose.kakiA || { dx: 0, dy: 0 };
  const kB = pose.kakiB || { dx: 0, dy: 0 };
  kotak(26 + kA.dx, 38 + b + kA.dy, 4, 12 - kA.dy, BAYA, 0);
  kotak(33 + kB.dx, 38 + b + kB.dy, 4, 12 - kB.dy, BAYA, 0);
  kotak(24 + kA.dx, 48 + b + kA.dy, 7, 7, BAYA, 1);
  kotak(32 + kB.dx, 48 + b + kB.dy, 7, 7, BAYA, 1);
  px(24 + kA.dx, 53 + b + kA.dy, CLOAK, 2);
  px(32 + kB.dx, 53 + b + kB.dy, CLOAK, 2);

  // 4. Tubuh kecil ramping: bahu → pinggang → skirt-tunic
  for (let x = 24; x <= 38; x++) px(x, 26 + b, CLOAK);
  for (let x = 25; x <= 37; x++) px(x, 27 + b, CLOAK);
  for (let y = 0; y < 6; y++) {
    const w = 11 - y;
    const x0 = 31 - Math.floor(w / 2);
    for (let x = 0; x < w; x++) px(x0 + x, 28 + y + b, CLOAK);
  }
  for (let x = 28; x <= 34; x++) px(x, 34 + b, BAYA, 1);
  for (let x = 26; x <= 36; x++) px(x, 35 + b, BAYA, 1);
  px(31, 35 + b, ES, 2);
  for (let y = 0; y < 4; y++) {
    const w = 11 + y;
    const x0 = 31 - Math.floor(w / 2);
    for (let x = 0; x < w; x++) px(x0 + x, 36 + y + b, CLOAK);
  }

  // 5. Lengan dengan siku
  garis(25, 28 + b, 21, 33 + b, CLOAK, 3);
  garis(21, 33 + b, 20, 38 + b, CLOAK, 3);
  ellips(20, 39 + b, 2, 2, KULIT, 1);

  const tanganX = 43 - Math.round(tarik * 6) + Math.round(dorong * 5);
  const tanganY = 38 + b;
  garis(37, 28 + b, 41, 33 + b, CLOAK, 3);
  garis(41, 33 + b, tanganX, tanganY, CLOAK, 3);
  ellips(tanganX, tanganY, 2, 2, KULIT, 1);

  // 6. Busur besar + senar
  const cxB = 47;
  const cyB = 34 + b;
  const [atas, bawah] = busur(cxB, cyB, 16, -1.35, 1.35, putar, KAYU, 3, 1);
  px(atas[0], atas[1], ES, 2);
  px(bawah[0], bawah[1], ES, 2);
  garis(atas[0], atas[1], tanganX, tanganY, PUTIH, 1, 2);
  garis(tanganX, tanganY, bawah[0], bawah[1], PUTIH, 1, 2);

  // 7. Panah es
  const ujung = 63 - Math.round(tarik * 8) - Math.round(dorong * 2);
  const pangkal = tanganX + 2;
  garis(pangkal, tanganY, ujung, tanganY, KAYU, 1, 2);
  garis(ujung - 3, tanganY - 2, ujung, tanganY, ES, 1, 2);
  garis(ujung - 3, tanganY + 2, ujung, tanganY, ES, 1, 2);
  garis(pangkal - 4, tanganY - 2, pangkal - 1, tanganY - 2, ES, 1, 1);
  garis(pangkal - 4, tanganY + 2, pangkal - 1, tanganY + 2, ES, 1, 1);

  // 8. Kepala: rambut → wajah → fringe →(headband) → mata
  const hy = 4 + b + h;
  ellips(31, hy + 6, 11, 7, RAMBUT);
  for (let x = 21; x <= 41; x++) px(x, hy + 10, RAMBUT);
  ellips(31, hy + 14, 7, 6, KULIT, 1);
  px(23, hy + 13, KULIT, 0);
  px(39, hy + 13, KULIT, 0);
  // fringe: ujung bergerigi di dahi
  const fringe = [0, 1, 2, 1, 0, 2, 3, 2, 1, 0, 1, 2, 1, 0, 1, 0, 0];
  for (let i = 0; i < fringe.length; i++) px(23 + i, hy + 10 + fringe[i], RAMBUT);
  // headband es
  for (let x = 22; x <= 40; x++) px(x, hy + 8, ES, 2);
  px(38, hy + 9, ES, 2);
  // rambut samping
  px(22, hy + 12, RAMBUT);
  px(22, hy + 14, RAMBUT);
  px(22, hy + 16, RAMBUT);
  px(40, hy + 12, RAMBUT);
  px(40, hy + 14, RAMBUT);
  // kilau rambut
  px(26, hy + 6, RAMBUT, 2);
  px(27, hy + 6, RAMBUT, 2);
  px(28, hy + 7, RAMBUT, 2);
  // mata + alis + mulut
  mata(28, hy + 16);
  mata(35, hy + 16);
  px(26, hy + 12, RAMBUT, 0);
  px(33, hy + 12, RAMBUT, 0);
  px(30, hy + 20, RAMBUT, 0);
  px(31, hy + 20, RAMBUT, 0);
  px(32, hy + 20, RAMBUT, 0);
  // leher
  px(29, hy + 20, KULIT, 0);
  px(32, hy + 20, KULIT, 0);

  // 9. Kilat release
  if (pose.kilat) {
    px(61, 30, ES, 2);
    px(59, 33, ES, 1);
    px(62, 36, ES, 2);
    px(58, 38, ES, 1);
  }
}

// ---------------------------------------------------------------- shading lembut
function nadaKePixel() {
  const dist = new Int16Array(W * H);
  const Antre = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (mat[i] < 0) continue;
      const tepi = x === 0 || y === 0 || x === W - 1 || y === H - 1 ||
        mat[i - 1] < 0 || mat[i + 1] < 0 || mat[i - W] < 0 || mat[i + W] < 0;
      if (tepi) { dist[i] = 1; Antre.push(i); }
    }
  }
  for (let k = 0; k < Antre.length; k++) {
    const i = Antre[k];
    const x = i % W;
    const y = (i / W) | 0;
    const d = dist[i];
    const dorong = (nx, ny) => {
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) return;
      const j = ny * W + nx;
      if (mat[j] < 0 || dist[j] !== 0) return;
      dist[j] = d + 1;
      Antre.push(j);
    };
    dorong(x + 1, y); dorong(x - 1, y); dorong(x, y + 1); dorong(x, y - 1);
  }

  const nada = new Int8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (mat[i] < 0) continue;
      if (aksen[i] >= 0) { nada[i] = Math.min(aksen[i], 2); continue; }
      const d = dist[i];
      if (d <= 1) { nada[i] = 1; continue; }
      const gx = dist[y * W + Math.min(W - 1, x + 1)] - dist[y * W + Math.max(0, x - 1)];
      const gy = dist[Math.min(H - 1, y + 1) * W + x] - dist[Math.max(0, y - 1) * W + x];
      let t = Math.round((d - 1) * 0.55 + (-gx - gy) * 0.3);
      if (t < 1) t = 1;
      if (t > 2) t = 2;
      nada[i] = t;
    }
  }
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      if (mat[i] < 0 || aksen[i] >= 0) continue;
      if (mat[i - W] < 0 || mat[i - 1] < 0) nada[i] = Math.min(2, nada[i] + 1);
    }
  }
  return nada;
}

// ---------------------------------------------------------------- raster + PNG
function hexRGB(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}
const RGB = {};
for (const k in PAL) RGB[k] = PAL[k].map(hexRGB);
const rgbOutline = hexRGB(OUTLINE);

function raster() {
  const nada = nadaKePixel();
  const buf = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    if (mat[i] < 0) continue;
    const c = RGB[NAMA_MAT[mat[i]]][nada[i]];
    buf[i * 4] = c[0]; buf[i * 4 + 1] = c[1]; buf[i * 4 + 2] = c[2]; buf[i * 4 + 3] = 255;
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (mat[i] >= 0) continue;
      const dekat = (x > 0 && mat[i - 1] >= 0) || (x < W - 1 && mat[i + 1] >= 0) ||
        (y > 0 && mat[i - W] >= 0) || (y < H - 1 && mat[i + W] >= 0);
      if (!dekat) continue;
      buf[i * 4] = rgbOutline[0]; buf[i * 4 + 1] = rgbOutline[1]; buf[i * 4 + 2] = rgbOutline[2]; buf[i * 4 + 3] = 255;
    }
  }
  return buf;
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(tipe, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(tipe, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}
function zoom(src, k) {
  const out = Buffer.alloc(W * k * H * k * 4);
  for (let y = 0; y < H * k; y++) {
    for (let x = 0; x < W * k; x++) {
      const s = (((y / k) | 0) * W + ((x / k) | 0)) * 4;
      const d = (y * W * k + x) * 4;
      out[d] = src[s]; out[d + 1] = src[s + 1]; out[d + 2] = src[s + 2]; out[d + 3] = src[s + 3];
    }
  }
  return out;
}

// ---------------------------------------------------------------- daftar frame
const IDLE = [];
for (let i = 0; i < 12; i++) {
  const f = i % 6;
  IDLE.push({ bob: f === 0 || f === 5 ? -1 : 0, kepala: f <= 2 ? 0 : f <= 4 ? -1 : 0, hem: [0, 1, 1, 0, -1, -1][f] });
}
const WALK = [];
for (let i = 0; i < 12; i++) {
  const l = i % 4;
  const maju = l === 0 || l === 3;
  const bob = l === 1 || l === 2 ? -1 : 0;
  WALK.push({
    bob, kepala: bob,
    kakiA: maju ? { dx: 1, dy: -1 } : { dx: -1, dy: 0 },
    kakiB: maju ? { dx: -1, dy: 0 } : { dx: 1, dy: -1 },
    hem: maju ? 1 : -1
  });
}
const ATTACK = [
  { hem: 0 },
  { bob: -1, kepala: -1, tarik: 0.5, putar: 0.1, hem: 1 },
  { bob: -1, kepala: -1, tarik: 1, putar: 0.18, hem: 2 },
  { bob: 0, kepala: 0, dorong: 1, putar: -0.26, hem: -1, kilat: true }
];

// ---------------------------------------------------------------- ASCII dump
const GL = {
  hair: "012", skin: "abc", white: "XYZ", iris: "QWE",
  cloak: ".:-", leather: "123", wood: "vwx", ice: "QWE"
};
function dump() {
  const nada = nadaKePixel();
  const baris = [];
  for (let y = 0; y < H; y++) {
    let s = "";
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      s += mat[i] < 0 ? " " : GL[NAMA_MAT[mat[i]]][nada[i]];
    }
    baris.push(s);
  }
  return baris.join("\n");
}

// ---------------------------------------------------------------- keluar
const dir = process.argv[2];
if (!dir) {
  console.error("Pakai: node tools\\buat-kenzro.js <folder-keluaran>");
  process.exit(1);
}
const dirFrames = path.join(dir, "frames");
fs.mkdirSync(dirFrames, { recursive: true });

function tulis(daftar, prefix) {
  return daftar.map((pose, i) => {
    gambarFrame(pose);
    fs.writeFileSync(path.join(dirFrames, prefix + "-" + i + ".png"), encodePNG(W, H, raster()));
    return prefix + "-" + i + ".png";
  });
}

const fIdle = tulis(IDLE, "kenzro-idle");
const fWalk = tulis(WALK, "kenzro-walk");
const fAttack = tulis(ATTACK, "kenzro-attack");

gambarFrame(IDLE[0]);
const hero = raster();
fs.writeFileSync(path.join(dir, "kenzro-baru.png"), encodePNG(W, H, hero));
fs.writeFileSync(path.join(dir, "kenzro-baru-8x.png"), encodePNG(W * 8, H * 8, zoom(hero, 8)));

const warna = new Set();
for (let i = 0; i < hero.length; i += 4) {
  if (hero[i + 3] > 0) warna.add((hero[i] << 16) | (hero[i + 1] << 8) | hero[i + 2]);
}
console.log("frame: idle " + fIdle.length + ", walk " + fWalk.length + ", attack " + fAttack.length);
console.log("warna unik (idle-0): " + warna.size);
console.log("ASCII idle-0:\n" + dump());