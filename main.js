window.addEventListener("error", (e) => {
  errorBanner = e.message || "Terjadi error";
  if (typeof e === "object" && e && e.error && typeof e.error.stack === "string") {
    errorBanner += " — " + e.error.stack.split("\n")[1] || "";
  }
});

function catatError(err) {
  errorBanner = err && err.message ? err.message : String(err);
  const st = err && err.stack ? err.stack.split("\n") : [];
  if (st[1]) errorBanner += " — " + st[1].trim();
}

function updateCanvasVars() {
  const cvs = document.getElementById("game");
  if (!cvs) return;
  const rect = cvs.getBoundingClientRect();
  const cw = rect.width;
  const ch = rect.height;
  const r = document.documentElement;
  r.style.setProperty("--cw", cw + "px");
  r.style.setProperty("--ch", ch + "px");
  r.style.setProperty("--cs", (cw / 1707).toFixed(4));
  r.style.setProperty("--cf", (cw / 1707 * 16).toFixed(2) + "px");
}
updateCanvasVars();
window.addEventListener("resize", updateCanvasVars);

const _kontrolSentuh = document.getElementById("kontrolSentuh");
let _kontrolTampil = null;
function sinkronkanKontrolSentuh() {
  if (!_kontrolSentuh) return;
  const utuh = deviceTerpilih === "mobile" && (statusGame === "main" || statusGame === "pause");
  // Fase pilih kartu (upgrade): joystik & tombol aksi disembunyikan supaya
  // kartu bebas disentuh, tapi soul meter (#tombolUlt) TETAP tampil di HP.
  const kartu = deviceTerpilih === "mobile" && statusGame === "upgrade";
  const kunci = kartu ? "kartu" : (utuh ? "utuh" : "tidak");
  if (_kontrolTampil !== kunci) {
    _kontrolTampil = kunci;
    _kontrolSentuh.classList.toggle("tampil-permainan", utuh);
    _kontrolSentuh.classList.toggle("tampil-kartu", kartu);
    if (utuh && typeof pasangIkonSentuh === "function") {
      try { pasangIkonSentuh(); } catch (err) {}
    }
  }
}

function loop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  if (errorBanner) {
    if (++errorBannerUmur > 120) {
      errorBanner = null;
      errorBannerUmur = 0;
    }
  } else {
    errorBannerUmur = 0;
  }
  // Update/draw TIDAK boleh menghentikan sinkronisasi HUD/audio. Kalau
  // update atau draw error di satu frame, yang lain tetap berjalan:
  // controls (tombol & joystik HP) tidak akan pernah "nyangkut" hilang.
  try { update(dt); } catch (err) { catatError(err); }
  try { draw(); } catch (err) { catatError(err); }
  try { aturNotaKartu(); } catch (err) {}
  sinkronkanKontrolSentuh();
  if (typeof sinkronkanMusikGame === "function") sinkronkanMusikGame();
  if (typeof perbaruiCdSkillSentuh === "function") {
    try { perbaruiCdSkillSentuh(); } catch (err) {}
  }
  requestAnimationFrame(loop);
}

function daftarAsetKarakter() {
  const daftar = [];
  for (const k of KARAKTER) {
    daftar.push({ kunci: k.kunci, src: k.gambar });
    daftar.push({ kunci: k.senjata, src: k.senjataGambar });
    for (const clip of (k.animasi || [])) {
      for (let i = 0; i < clip.jumlah; i++) {
        daftar.push({
          kunci: k.kunci + "-" + clip.nama + "-" + i,
          src: "assets/animasi/" + k.kunci + "/" + k.kunci + "-" + clip.nama + "-" + i + ".png"
        });
      }
    }
  }
  return daftar;
}

function daftarAsetMusuh() {
  const daftar = [
    { kunci: "musuh", src: "assets/enemies/musuh.png" },
    { kunci: "cepet", src: "assets/enemies/cepet.png" },
    { kunci: "tank", src: "assets/enemies/tank.png" }
  ];
  for (const nama of ["musuh", "cepet", "tank"]) {
    daftar.push({
      kunci: nama + "-idle-0",
      src: "assets/animasi/" + nama + "/" + nama + "-idle-0.png"
    });
  }
  return daftar;
}

function mulai() {
  const listSrc = daftarAsetKarakter().concat(daftarAsetMusuh());

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
    { kunci: "menang", src: ["assets/sfx/menang.mp3", "assets/sfx/menang.wav"], vol: 0.9 },
    { kunci: "gameover", src: ["assets/sfx/gameover.mp3", "assets/sfx/gameover.wav"], vol: 0.9 },
    { kunci: "panah-raksasa", src: "assets/sfx/kenzro/panah-raksasa.mp3" },
    { kunci: "tembak-voiz", src: "assets/sfx/voiz/tembak-voiz.mp3", vol: 0.9 },
    { kunci: "jurus-umbra", src: "assets/sfx/voiz/jurus-umbra.mp3", vol: 0.9 },
    { kunci: "jurus-prism", src: "assets/sfx/voiz/jurus-prism.mp3", vol: 0.9 },
    { kunci: "prism-hop", src: "assets/sfx/voiz/prism-hop.mp3", vol: 0.7 },
    { kunci: "ultimate-voiz", src: "assets/sfx/voiz/ultimate-voiz.mp3", vol: 0.9 },
    { kunci: "dash-voiz", src: "assets/sfx/voiz/dash-voiz.mp3", vol: 0.9 }
  ];

  const musikList = [
    { kunci: "lobby", src: "assets/music/lobby.mp3" },
    { kunci: "game", src: "assets/music/game.mp3" }
  ];

  let loopDijadwalkan = false;
  const jalankanLoop = () => {
    if (loopDijadwalkan) return;
    loopDijadwalkan = true;
    if (!lastTime) lastTime = performance.now();
    requestAnimationFrame(loop);
  };

  Promise.all(muat)
    .then(() => Promise.all(sfxList.map((s) => muatSfxLokal(s.kunci, s.src, s.vol))))
    .then(() => Promise.all(musikList.map((m) => muatLaguLokal(m.kunci, m.src))))
    .then(() => {
      if (typeof pengaturanSiapkan === "function") {
        try { pengaturanSiapkan(); } catch (err) { }
      }
      pasangTombol();
      // Akun hanya disiapkan kalau config-nya sudah diisi; kalau tidak,
      // akunSiapkan() langsung selesai tanpa menyentuh jaringan.
      if (typeof akunSiapkan === "function") {
        try {
          akunSiapkan().catch(() => {});
        } catch (err) { }
      }
      buatBgPartikel();
      resetArena({ koinBaru: true });
      jalankanLoop();
      tampilkanJudul();
    })
    .catch((err) => {

      errorBanner = err && err.message ? err.message : String(err);
      if (err && err.stack) {
        const st = err.stack.split("\n");
        if (st[1]) errorBanner += " — " + st[1].trim();
      }
      try {
        if (!bgPartikels || !bgPartikels.length) buatBgPartikel();
        pasangTombol();
        jalankanLoop();
      } catch (e2) {}
      try { tampilkanJudul(); } catch (e3) {
        layarJudul.classList.remove("hidden");
      }
    });
}

mulai();
