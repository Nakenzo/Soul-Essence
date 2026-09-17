// Membuat tekstur PNG pixel art untuk game Pixel Strike.
// Jalankan: node buat-asset.js
// Struktur folder assets/:
//   characters/  ← gambar dasar karakter (kenzro.png, rin.png) — 64×64
//   weapons/     ← gambar senjata (dikelola manual, TIDAK dibuat di sini)
//   enemies/     ← gambar dasar musuh (musuh.png, cepet.png, tank.png)
//   animasi/     ← frame animasi per entity:
//     <kunci>/<kunci>-idle-<i>.png   frame idle (12 karakter / 2 musuh)
//     <kunci>/<kunci>-walk-<i>.png   frame jalan (12 karakter / 2 musuh)
// Karakter PNG 64x64 tapi di layar 32px (config skala 0.5).
// NAMA FILE memakai prefix <kunci> (kenzro, rin, musuh, cepet, tank) sehingga
// unik global — meski folder di-flatten/tercampur, tidak pernah ketimpa antar
// karakter/musuh. Contoh: assets/animasi/kenzro/kenzro-walk-0.png.
// Versi buatan sendiri: ganti/isi PNG dengan nama persis sama (ukurannya
// menyesuaikan file lama) lalu reload game — tidak perlu ubah kode.
// Ganti palet/sprite lalu jalankan ulang untuk membuat ulang PNG.

const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

// ---------- Encoder PNG minimal ----------
let crcTable = null;
function crc32(buf) {
  if (!crcTable) {
    crcTable = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function buatPng(lebar, tinggi, pixels) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(lebar, 0);
  ihdr.writeUInt32BE(tinggi, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(tinggi * (1 + lebar * 4));
  let pos = 0;
  for (let y = 0; y < tinggi; y++) {
    raw[pos++] = 0;
    for (let x = 0; x < lebar; x++) {
      const p = pixels[y * lebar + x];
      raw[pos++] = p[0];
      raw[pos++] = p[1];
      raw[pos++] = p[2];
      raw[pos++] = p[3];
    }
  }
  const idat = zlib.deflateSync(raw);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

function spriteKePixel(sprite, pal) {
  const tinggi = sprite.length;
  const lebar = sprite[0].length;
  const pixels = [];
  for (let y = 0; y < tinggi; y++) {
    for (let x = 0; x < lebar; x++) {
      pixels.push(pal[sprite[y][x]] || [0, 0, 0, 0]);
    }
  }
  return { lebar, tinggi, pixels };
}

function simpan(subfolder, namaFile, sprite, pal) {
  const { lebar, tinggi, pixels } = spriteKePixel(sprite, pal);
  const png = buatPng(lebar, tinggi, pixels);
  const dir = path.join(__dirname, "assets", subfolder);
  fs.mkdirSync(dir, { recursive: true });
  const tujuan = path.join(dir, namaFile);
  fs.writeFileSync(tujuan, png);
  console.log("Berhasil: " + subfolder + "/" + namaFile + " (" + lebar + "x" + tinggi + ")");
}

// Naikkan resolusi pixel art 2x (tiap pixel digandakan menjadi blok 2x2).
// Tampilan layar TIDAK berubah (skala di config/draw ikut disesuaikan),
// hanya file PNG yang lebih besar agar mudah ditambahkan detail.
function perbesar2(sprite) {
  const lebar = sprite[0].length;
  const tinggi = sprite.length;
  const hasil = [];
  for (let y = 0; y < tinggi; y++) {
    const barisAtas = [];
    const barisBawah = [];
    for (let x = 0; x < lebar; x++) {
      const v = sprite[y][x];
      for (let k = 0; k < 2; k++) {
        barisAtas.push(v);
        barisBawah.push(v);
      }
    }
    hasil.push(barisAtas, barisBawah);
  }
  return hasil;
}

// Naikkan 4x (perbesar 2× dua kali) — dipakai untuk karakter pemain
// agar hitbox di layar menjadi 64×64 px.
function perbesar4(sprite) {
  return perbesar2(perbesar2(sprite));
}

// ============================================================
// PALETTE
// ============================================================
// 0 = transparan
const KENZRO_PAL = {
  0: [0, 0, 0, 0],
  1: [58, 160, 255, 255],   // badan biru
  2: [232, 213, 176, 255],  // kulit
  3: [28, 43, 74, 255],     // helm
  4: [255, 210, 63, 255],   // sepatu kuning
  5: [245, 245, 245, 255]   // ornamen putih
};

const RIN_PAL = {
  0: [0, 0, 0, 0],
  1: [214, 69, 69, 255],    // badan merah
  2: [232, 213, 176, 255],  // kulit
  3: [42, 42, 42, 255],     // helm
  4: [240, 230, 140, 255],  // sepatu khaki
  5: [255, 210, 63, 255]    // ornamen emas
};

const MUSUH_PAL = {
  0: [0, 0, 0, 0],
  1: [255, 77, 77, 255],    // badan merah
  2: [255, 255, 255, 255]   // mata
};

// Musuh mini/Cepat: biru, ramping seperti proyektil.
const CEPET_PAL = {
  0: [0, 0, 0, 0],
  1: [58, 160, 255, 255],    // badan biru
  2: [255, 255, 255, 255],   // mata
  3: [143, 216, 255, 255]    // aksen biru terang (perut)
};

// Musuh Tank: ungu, besar & berzirah.
const TANK_PAL = {
  0: [0, 0, 0, 0],
  1: [138, 79, 214, 255],    // badan ungu
  2: [255, 210, 63, 255],    // mata kuning menyala
  3: [61, 29, 102, 255],     // armor ungu gelap
  4: [195, 155, 232, 255]    // sorot armor ungu terang
};

const PANAH_PAL = {
  0: [0, 0, 0, 0],
  1: [139, 90, 43, 255],    // kayu gelap (frame busur)
  2: [180, 120, 60, 255],   // kayu terang (aksen frame)
  3: [200, 200, 200, 255]   // tali busur (abu-abu)
};

const PEDANG_PAL = {
  0: [0, 0, 0, 0],
  1: [200, 30, 30, 255],    // bilah sabit (merah)
  2: [255, 90, 90, 255],    // sorot bilah (merah terang)
  3: [20, 20, 20, 255],     // gagang (hitam)
  4: [120, 12, 12, 255],    // tepi dalam bilah (merah gelap)
  5: [60, 10, 10, 255]      // aksen gelap
};

// ============================================================
// SPRITE RESOLUSI TINGGI (16 piksel lebar untuk karakter)
// ============================================================

// Karakter 16x16 (desain semula — kesatria)
const KENZRO_SPRITE = [
  [0, 0, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0, 0, 0],
  [0, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0, 0],
  [0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0],
  [0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0],
  [0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0],
  [0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0],
  [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
  [0, 0, 0, 1, 1, 5, 1, 1, 1, 1, 5, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 5, 1, 1, 1, 1, 5, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 1, 3, 3, 3, 3, 1, 1, 1, 0, 0, 0],
  [0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0],
  [0, 0, 0, 0, 4, 4, 4, 4, 4, 4, 4, 4, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];

const RIN_SPRITE = KENZRO_SPRITE;

const MUSUH_SPRITE = [
  [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 2, 2, 1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 0],
  [0, 1, 1, 2, 2, 1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0]
];

// Cepat: ramping & tajam seperti proyektil, ekor mengecil.
const CEPET_SPRITE = [
  [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 1, 1, 1, 0, 0, 0],
  [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 3, 1, 3, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 1, 1, 1, 1, 3, 3, 3, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];

// Tank: gempal, berzirah, mata menyala — jauh lebih tebal.
const TANK_SPRITE = [
  [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 2, 2, 1, 1, 2, 2, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 2, 2, 1, 1, 2, 2, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 4, 1, 1, 1, 4, 4, 4, 1, 1, 1, 4, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0]
];

// Senjata: Busur 10x16 — lengkungan frame + tali vertikal di kanan.
// Di draw.js sprite diputar +90 derajat (karakter.rot) sehingga tampil
// sebagai busur yang mengarah ke pointer.
const PANAH_SPRITE = [
  [0, 0, 0, 0, 2, 2, 0, 0, 0, 0],
  [0, 0, 0, 2, 1, 0, 0, 0, 0, 0],
  [0, 0, 2, 1, 0, 0, 0, 0, 0, 3],
  [0, 2, 1, 0, 0, 0, 0, 0, 0, 3],
  [2, 1, 0, 0, 0, 0, 0, 0, 0, 3],
  [2, 0, 0, 0, 0, 0, 0, 0, 0, 3],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 3],
  [1, 1, 0, 0, 0, 0, 0, 0, 0, 3],
  [1, 1, 0, 0, 0, 0, 0, 0, 0, 3],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 3],
  [2, 0, 0, 0, 0, 0, 0, 0, 0, 3],
  [2, 1, 0, 0, 0, 0, 0, 0, 0, 3],
  [0, 2, 1, 0, 0, 0, 0, 0, 0, 3],
  [0, 0, 2, 1, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 2, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 2, 2, 0, 0, 0, 0]
];

// Senjata: Sabit 20x6 — gagang hitam (3), bilah sabit merah (1)
// dengan tepi dalam merah gelap (4). Menghadap KANAN (+x).
const PEDANG_SPRITE = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 4, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  [0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 4, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0, 1, 4, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 4, 1, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0]
];

// ---------- Frame animasi ----------
// Animasi dibangun dari sprite dasar (tanpa menggambar manual):
//   * Frame DIP       : seluruh badan bergeser 1px ke bawah → napas/bob.
//   * Karakter jalan  : DIP + telapak kaki digeser kiri/kanan → langkah.
//   * Blob (musuh)    : idle & jalan sama (DIP) → efek memantul.
function copySprite(s) {
  return s.map((r) => r.slice());
}

function geserTegak(s, dy) {
  const L = s.length;
  const W = s[0].length;
  const hasil = [];
  for (let y = 0; y < L; y++) hasil.push(Array(W).fill(0));
  for (let y = 0; y < L; y++) {
    const ny = y + dy;
    if (ny >= 0 && ny < L) {
      for (let x = 0; x < W; x++) hasil[ny][x] = s[y][x];
    }
  }
  return hasil;
}

function geserMendatar(s, dx, dari, sampai) {
  const W = s[0].length;
  const hasil = s.map((r) => r.slice());
  for (let y = dari; y <= sampai; y++) {
    const lama = hasil[y].slice();
    for (let x = 0; x < W; x++) {
      const nx = x + dx;
      hasil[y][x] = nx >= 0 && nx < W ? lama[nx] : 0;
    }
  }
  return hasil;
}

function frameKarakter(s) {
  const dasar = copySprite(s);
  const dip = geserTegak(s, 1);
  // Posisi kaki: baris 13 (kaki) & 14 (sepatu) di dasar;
  // setelah DIP pindah ke 14–15.
  const kakiKiri  = geserMendatar(dasar, -1, 13, 14); // langkah kiri (tengah)
  const kakiKanan = geserMendatar(dasar, 1, 13, 14);  // langkah kanan (tengah)
  const tumpuKiri = geserMendatar(dip, -1, 14, 15);   // langkah kiri + bob turun
  const tumpuKanan = geserMendatar(dip, 1, 14, 15);   // langkah kanan + bob turun
  // Walk 12 frame: kiri (2) → tumpuan kiri (2) → berdiri (2) → kanan (2) →
// tumpuan kanan (2) → berdiri (2). Setiap pose di-hold 2 frame agar halus.
  // Idle 12 frame: napas halus (bobot naik-turun 0..2) berulang 3×.
  const idleBob = [0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 1];
  return {
    idle: idleBob.map((dy) => geserTegak(s, dy)),
    walk: [
      kakiKiri, kakiKiri, tumpuKiri, tumpuKiri,
      dasar, dasar,
      kakiKanan, kakiKanan, tumpuKanan, tumpuKanan,
      dasar, dasar
    ]
  };
}

function frameBlob(s) {
  const dasar = copySprite(s);
  const dip = geserTegak(s, 1);
  return { idle: [dasar, dip], walk: [dasar, dip] };
}

function simpanFrames(subfolder, nama, frames, pal, skala = 2) {
  const perbesar = skala === 4 ? perbesar4 : perbesar2;
  for (const state of Object.keys(frames)) {
    frames[state].forEach((spr, i) => {
      simpan(subfolder, nama + "-" + state + "-" + i + ".png", perbesar(spr), pal);
    });
  }
}

// ---------- Buat semua file ----------
// NOTE: panah.png & pedang.png TIDAK dibuat di sini — kedua senjata
// dikelola manual oleh pemilik proyek. Jangan dihasilkan/timpa oleh script ini!
// Karakter disimpan 64x64 (16x16 diperbesar 4x), tapi di layar ditampilkan
// 32px penampilan seperti semula (config skala 0.5).
simpan("characters", "kenzro.png", perbesar4(KENZRO_SPRITE), KENZRO_PAL);
  simpan("characters", "rin.png", perbesar4(RIN_SPRITE), RIN_PAL);
  // Musuh juga 64px native (16x16 -> 4x), canvas 1280x960 pixel-perfect.
  simpan("enemies", "musuh.png", perbesar4(MUSUH_SPRITE), MUSUH_PAL);
  simpan("enemies", "cepet.png", perbesar4(CEPET_SPRITE), CEPET_PAL);
  simpan("enemies", "tank.png", perbesar4(TANK_SPRITE), TANK_PAL);

// ---- Frame animasi (idle + jalan) ke assets/animasi/<nama>/ ----
// Karakter = skala 4 (64x64 PNG, idle 2 frame); musuh = skala 2 (32x?…).
simpanFrames("animasi/kenzro", "kenzro", frameKarakter(KENZRO_SPRITE), KENZRO_PAL, 4);
  simpanFrames("animasi/rin", "rin", frameKarakter(RIN_SPRITE), RIN_PAL, 4);
  simpanFrames("animasi/musuh", "musuh", frameBlob(MUSUH_SPRITE), MUSUH_PAL, 4);
  simpanFrames("animasi/cepet", "cepet", frameBlob(CEPET_SPRITE), CEPET_PAL, 4);
  simpanFrames("animasi/tank", "tank", frameBlob(TANK_SPRITE), TANK_PAL, 4);