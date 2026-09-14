// ============================================================
// INPUT - keyboard & mouse.
// 1/2 : pilih karakter (hanya di layar pilih)
// R   : ulang dengan karakter yang sama
// M   : kembali ke layar judul (skor hilang)
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
    if (statusGame === "main" && karakter) {
      ulangDenganKarakter();
    } else if (statusGame === "over") {
      ulangDenganKarakter();
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

canvas.addEventListener("mousedown", () => {
  mouse.down = true;
});

window.addEventListener("mouseup", () => {
  mouse.down = false;
});