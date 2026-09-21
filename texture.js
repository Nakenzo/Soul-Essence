// ============================================================
// TEXTURE - sistem memuat & menggambar file PNG pixel art.
// Struktur folder:
//   assets/characters/  ← karakter pemain
//   assets/weapons/     ← senjata
//   assets/enemies/     ← musuh
// ============================================================
const tekstur = {};

function muatGambar(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gagal memuat: " + src));
    img.src = src;
  });
}

// Gambar pixel tajam (nearest-neighbor). Jika texture gagal,
// tampilkan kotak oranye pengganti agar game tetap bisa dimainkan.
function gambarPixel(img, px, py, skala) {
  if (!img || !img.width) {
    ctx.fillStyle = "#ff8844";
    ctx.fillRect(px - 16, py - 16, 32, 32);
    return;
  }
  const w = img.width * skala;
  const h = img.height * skala;
  // Perkecil (mis. PNG 64x64 dimuat di skala 0.5 -> 32px):
  // pakai smoothing agar tidak "pecah". Ukuran asli/naik tetap nearest agar tajam.
  ctx.imageSmoothingEnabled = w < img.width || h < img.height;
  if (ctx.imageSmoothingEnabled) ctx.imageSmoothingQuality = "medium";
  ctx.drawImage(img, px - w / 2, py - h / 2, w, h);
}

// Hitung ukuran render (lebar × tinggi) agar sprite PNG RESOLUSI APA PUN
// tampil dengan ukuran dunia yang sama, terkait hitbox, tanpa distorsi:
//  - lebar = targetLebar (dari hitbox), 
//  - tinggi = disesuaikan dengan rasio aspek ASLI gambar.
// Contoh: PNG 64x64 / 128x128 / 256x256 semua dirender 64×64 dunia.
//         PNG 40x64 (tinggi) dirender ~40×64 dunia (tetap proporsional).
function ukuranSprite(img, targetLebar) {
  const wPng = img && img.width > 0 ? img.width : 1;
  const hPng = img && img.height > 0 ? img.height : 1;
  const rasio = hPng / wPng; // tinggi per satuan lebar
  const lebar = targetLebar;
  const tinggi = Math.round(targetLebar * rasio);
  return { lebar, tinggi };
}