// Membuat tekstur PNG pixel art untuk game Pixel Strike.
// Jalankan: node buat-asset.js
// Struktur folder assets/:
//   characters/  ← gambar karakter pemain
//   weapons/     ← gambar senjata
//   enemies/     ← gambar musuh
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

// ============================================================
// PALETTE
// ============================================================
// 0 = transparan
const KENJI_PAL = {
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

// Karakter 16x16
const KENJI_SPRITE = [
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

const RIN_SPRITE = KENJI_SPRITE;

// Musuh 16x9
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

// ---------- Buat semua file ----------
// NOTE: panah.png & pedang.png TIDAK dibuat di sini — kedua senjata
// dikelola manual oleh pemilik proyek. Jangan dihasilkan/timpa oleh script ini!
simpan("characters", "kenji.png", perbesar2(KENJI_SPRITE), KENJI_PAL);
simpan("characters", "rin.png", perbesar2(RIN_SPRITE), RIN_PAL);
simpan("enemies", "musuh.png", perbesar2(MUSUH_SPRITE), MUSUH_PAL);