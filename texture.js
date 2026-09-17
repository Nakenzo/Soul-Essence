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