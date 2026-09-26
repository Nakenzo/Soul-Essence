const tekstur = {};

function muatGambar(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gagal memuat: " + src));
    img.src = src;
  });
}

function gambarPixel(img, px, py, skala) {
  if (!img || !img.width) {
    ctx.fillStyle = "#ff8844";
    ctx.fillRect(px - 16, py - 16, 32, 32);
    return;
  }
  const w = img.width * skala;
  const h = img.height * skala;

  ctx.imageSmoothingEnabled = w < img.width || h < img.height;
  if (ctx.imageSmoothingEnabled) ctx.imageSmoothingQuality = "medium";
  ctx.drawImage(img, px - w / 2, py - h / 2, w, h);
}

function ukuranSprite(img, targetLebar) {
  const wPng = img && img.width > 0 ? img.width : 1;
  const hPng = img && img.height > 0 ? img.height : 1;
  const rasio = hPng / wPng;
  const lebar = targetLebar;
  const tinggi = Math.round(targetLebar * rasio);
  return { lebar, tinggi };
}
