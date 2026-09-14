// ============================================================
// MAIN - fungsi utama: loop game, pemuatan tekstur, error handler.
// ============================================================

// ---------- Biner error ----------
window.addEventListener("error", (e) => {
  errorBanner = e.message || "Terjadi error";
  try {
    const el = document.getElementById("layarJudul");
    if (el && errorBanner) {
      const sub = el.querySelector(".sub-judul");
      if (sub) sub.textContent = "ERROR: " + errorBanner;
    }
  } catch (_) {}
});

// ---------- Loop ----------
function loop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// ---------- Mulai ----------
function mulai() {
  const listSrc = []
    .concat(
      KARAKTER.map((k) => ({ kunci: k.kunci, src: k.gambar })),
      KARAKTER.map((k) => ({ kunci: k.senjata, src: k.senjataGambar }))
    )
    .concat([{ kunci: "musuh", src: "assets/enemies/musuh.png" }]);

  // Texture yang gagal tidak menggagalkan semua — dipakai kotak pengganti.
  const muat = listSrc.map((item) =>
    muatGambar(item.src)
      .then((img) => {
        tekstur[item.kunci] = img;
      })
      .catch((err) => {
        tekstur[item.kunci] = null;
        console.warn(err.message);
      })
  );

  Promise.all(muat).then(() => {
    pasangTombol();
    buatBgPartikel();
    resetArena({ skorBaru: true });
    lastTime = performance.now();
    requestAnimationFrame(loop);
    tampilkanJudul();
  });
}

mulai();