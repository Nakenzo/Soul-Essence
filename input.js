// ============================================================
// INPUT - keyboard & mouse.
// 1/2 : pilih karakter (hanya di layar pilih)
// R   : ulang dengan karakter yang sama
// ============================================================
const keys = {};
let mouse = { x: W / 2, y: H / 2, down: false };

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  keys[k] = true;

  if (k === "k" || k === "q") {
    castSpecial();
  }

  if (e.key === "Escape") {
    if (statusGame === "main") {
      tampilkanPause();
    } else if (statusGame === "pause") {
      lanjutDariPause();
    } else if (statusGame === "select") {
      tampilkanJudul();
    }
    e.preventDefault();
  }

  if (k === "r") {
    // Di dalam game: R = tebus ultimate. R di layar game over tetap ulang.
    if (statusGame === "over") {
      ulangDenganKarakter();
    } else if (statusGame === "main" && karakter) {
      rilisUltimate();
    }
  }

  KARAKTER.forEach((kar, idx) => {
    if (k === String(idx + 1) && statusGame === "select") {
      karakter = kar;
      mulaiGameBaru();
    }
  });
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - rect.left) * (W / rect.width);
  mouse.y = (e.clientY - rect.top) * (H / rect.height);
});

canvas.addEventListener("contextmenu", (e) => e.preventDefault());

canvas.addEventListener("mousedown", (e) => {
  // Klik kiri = serang. Klik kanan = dash saja (BUKAN serang),
  // agar suara basic attack tidak ikut keluar saat dash.
  if (e.button === 0) mouse.down = true;
  if (e.button === 2) dashLari();
});

window.addEventListener("mouseup", () => {
  mouse.down = false;
});