// ============================================================
// MAIN - fungsi utama: loop game, pemuatan tekstur, error handler.
// ============================================================

// ---------- Biner error ----------
window.addEventListener("error", (e) => {
  errorBanner = e.message || "Terjadi error";
  if (typeof e === "object" && e && e.error && typeof e.error.stack === "string") {
    errorBanner += " — " + e.error.stack.split("\n")[1] || "";
  }
});

// ---------- CSS Variables berdasarkan ukuran canvas aktual ----------
function updateCanvasVars() {
  const cvs = document.getElementById("game");
  if (!cvs) return;
  const rect = cvs.getBoundingClientRect();
  const cw = rect.width;
  const ch = rect.height;
  const r = document.documentElement;
  r.style.setProperty("--cw", cw + "px");
  r.style.setProperty("--ch", ch + "px");
  r.style.setProperty("--cs", (cw / 1280).toFixed(4));
  r.style.setProperty("--cf", (cw / 1280 * 16).toFixed(2) + "px");
}
updateCanvasVars();
window.addEventListener("resize", updateCanvasVars);

// ---------- Loop ----------
function loop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  try {
    update(dt);
    draw();
    aturNotaKartu();
  } catch (err) {
    // Jangan biarkan satu error mematikan loop — tampilkan di banner.
    errorBanner = err && err.message ? err.message : String(err);
    const st = err && err.stack ? err.stack.split("\n") : [];
    if (st[1]) errorBanner += " — " + st[1].trim();
  }
  requestAnimationFrame(loop);
}

// ---------- Mulai ----------
function mulai() {
  const listSrc = []
    .concat(
      KARAKTER.map((k) => ({ kunci: k.kunci, src: k.gambar })),
      KARAKTER.map((k) => ({ kunci: k.senjata, src: k.senjataGambar }))
    )
    // Frame animasi karakter (idle: 12, jalan: 12) di assets/animasi/<kunci>/.
// Nama file ber-prefix kunci → unik antar karakter/musuh.
    .concat(
      KARAKTER.flatMap((k) => {
        const daftar = [];
        for (let i = 0; i < 12; i++) {
          daftar.push({ kunci: k.kunci + "-idle-" + i, src: "assets/animasi/" + k.kunci + "/" + k.kunci + "-idle-" + i + ".png" });
        }
        for (let i = 0; i < 12; i++) {
          daftar.push({ kunci: k.kunci + "-walk-" + i, src: "assets/animasi/" + k.kunci + "/" + k.kunci + "-walk-" + i + ".png" });
        }
        // Frame animasi serangan dasar (4 frame).
        for (let i = 0; i < 4; i++) {
          daftar.push({ kunci: k.kunci + "-attack-" + i, src: "assets/animasi/" + k.kunci + "/" + k.kunci + "-attack-" + i + ".png" });
        }
        return daftar;
      })
    )
    .concat([
      // PNG statis musuh: fallback death-pixel bila frame idle-0 belum siap.
      { kunci: "musuh", src: "assets/enemies/musuh.png" },
      { kunci: "cepet", src: "assets/enemies/cepet.png" },
      { kunci: "tank", src: "assets/enemies/tank.png" }
    ])
    .concat(
      // Musuh digambar prosedural (slime/monster), hanya perlu idle-0 sebagai
      // tekstur death-pixel saat musuh mati.
      ["musuh", "cepet", "tank"].flatMap((nama) => {
        return [{ kunci: nama + "-idle-0", src: "assets/animasi/" + nama + "/" + nama + "-idle-0.png" }];
      })
    );

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
    { kunci: "panah", src: "assets/sfx/kenzro/panah.wav", vol: 0.9 },
    { kunci: "beku", src: "assets/sfx/kenzro/beku.mp3", vol: 0.7 },
    { kunci: "dash", src: "assets/sfx/common/dash.wav" },
    { kunci: "panah-raksasa", src: "assets/sfx/kenzro/panah-raksasa.mp3" } // fallback sintesis jika file tidak ada
  ];

  // Lagu latar (BGM): lobby (menu) & game (saat bermain). File opsional;
  // kalau tidak ada, dipakai musik prosedural Web Audio sebagai fallback.
  const musikList = [
    { kunci: "lobby", src: "assets/music/lobby.mp3" },
    { kunci: "game", src: "assets/music/game.mp3" }
  ];

  Promise.all(muat)
    .then(() => Promise.all(sfxList.map((s) => muatSfxLokal(s.kunci, s.src, s.vol))))
    .then(() => Promise.all(musikList.map((m) => muatLaguLokal(m.kunci, m.src))))
    .then(() => {
      pasangTombol();
      buatBgPartikel();
      resetArena({ koinBaru: true });
      lastTime = performance.now();
      requestAnimationFrame(loop);
      tampilkanJudul();
    });
}

mulai();
