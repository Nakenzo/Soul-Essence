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
    .concat([
      { kunci: "musuh", src: "assets/enemies/musuh.png" },
      { kunci: "cepet", src: "assets/enemies/cepet.png" },
      { kunci: "tank", src: "assets/enemies/tank.png" }
    ]);

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

  // Muat semua efek suara dari FILE lokal (baris ini TIDAK pernah error:
  // kalau file tidak ada, game pakai fallback sintesis prosedural).
  // Struktur folder: vender/ (suara Vender), kenzro/ (suara Kenzro),
  // common/ (dipakai dua karakter), map/ (monster, soul, damage).
  const sfxList = [
    { kunci: "sabet", src: "assets/sfx/vender/sword-slash-4.mp3", vol: 0.85 },
    { kunci: "jurus-vender", src: "assets/sfx/vender/jurus-vender.mp3", vol: 0.55 },
    { kunci: "jurus-vender-api", src: "assets/sfx/vender/jurus-vender-api.mp3", vol: 1.0 },
    { kunci: "jurus-kenzro", src: "assets/sfx/kenzro/jurus-kenzro.mp3" },
    { kunci: "panah-beku", src: "assets/sfx/kenzro/panah-beku.mp3" },
    { kunci: "ultimate-vender", src: "assets/sfx/vender/ultimate-vender.mp3", vol: 0.55 },
    { kunci: "ultimate-vender-api", src: "assets/sfx/vender/ultimate-vender-api.mp3", vol: 1.0 },
    { kunci: "ultimate-vender-api-b", src: "assets/sfx/vender/ultimate-vender-api.mp3", vol: 1.0 },
    { kunci: "ultimate-kenzro", src: "assets/sfx/kenzro/ultimate-kenzro.mp3" },
    { kunci: "dash", src: "assets/sfx/common/dash.wav" },
    { kunci: "panah-raksasa", src: "assets/sfx/kenzro/panah-raksasa.mp3" }
  ];

  Promise.all(muat)
    .then(() => Promise.all(sfxList.map((s) => muatSfxLokal(s.kunci, s.src, s.vol))))
    .then(() => {
      pasangTombol();
      buatBgPartikel();
      resetArena({ skorBaru: true });
      lastTime = performance.now();
      requestAnimationFrame(loop);
      tampilkanJudul();
    });
}

mulai();