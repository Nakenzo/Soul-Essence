window.addEventListener("error", (e) => {
  errorBanner = e.message || "Terjadi error";
  if (typeof e === "object" && e && e.error && typeof e.error.stack === "string") {
    errorBanner += " — " + e.error.stack.split("\n")[1] || "";
  }
});

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

function loop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  try {
    update(dt);
    draw();
    aturNotaKartu();
  } catch (err) {

    errorBanner = err && err.message ? err.message : String(err);
    const st = err && err.stack ? err.stack.split("\n") : [];
    if (st[1]) errorBanner += " — " + st[1].trim();
  }
  requestAnimationFrame(loop);
}

function mulai() {
  const listSrc = []
    .concat(
      KARAKTER.map((k) => ({ kunci: k.kunci, src: k.gambar })),
      KARAKTER.map((k) => ({ kunci: k.senjata, src: k.senjataGambar }))
    )

    .concat(
      KARAKTER.flatMap((k) => {
        const daftar = [];
        for (let i = 0; i < 12; i++) {
          daftar.push({ kunci: k.kunci + "-idle-" + i, src: "assets/animasi/" + k.kunci + "/" + k.kunci + "-idle-" + i + ".png" });
        }
        for (let i = 0; i < 12; i++) {
          daftar.push({ kunci: k.kunci + "-walk-" + i, src: "assets/animasi/" + k.kunci + "/" + k.kunci + "-walk-" + i + ".png" });
        }

        for (let i = 0; i < 12; i++) {
          daftar.push({ kunci: k.kunci + "-walk-atas-" + i, src: "assets/animasi/" + k.kunci + "/" + k.kunci + "-walk-atas-" + i + ".png" });
        }
        for (let i = 0; i < 12; i++) {
          daftar.push({ kunci: k.kunci + "-walk-bawah-" + i, src: "assets/animasi/" + k.kunci + "/" + k.kunci + "-walk-bawah-" + i + ".png" });
        }

        for (let i = 0; i < 4; i++) {
          daftar.push({ kunci: k.kunci + "-attack-" + i, src: "assets/animasi/" + k.kunci + "/" + k.kunci + "-attack-" + i + ".png" });
        }

        for (let i = 0; i < 4; i++) {
          daftar.push({ kunci: k.kunci + "-mati-" + i, src: "assets/animasi/" + k.kunci + "/" + k.kunci + "-mati-" + i + ".png" });
        }
        return daftar;
      })
    )
    .concat([

      { kunci: "musuh", src: "assets/enemies/musuh.png" },
      { kunci: "cepet", src: "assets/enemies/cepet.png" },
      { kunci: "tank", src: "assets/enemies/tank.png" }
    ])
    .concat(

      ["musuh", "cepet", "tank"].flatMap((nama) => {
        return [{ kunci: nama + "-idle-0", src: "assets/animasi/" + nama + "/" + nama + "-idle-0.png" }];
      })
    );

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
    { kunci: "panah-raksasa", src: "assets/sfx/kenzro/panah-raksasa.mp3" }
  ];

  const musikList = [
    { kunci: "lobby", src: "assets/music/lobby.mp3" },
    { kunci: "game", src: "assets/music/game.mp3" }
  ];

  function bakeFrameMatiFallback(kunci, img) {
    if (!img || !img.width) return;
    const w = img.width, h = img.height;
    const poses = [
      { rot: 0.15, sy: 1.0,  dy: 0 },
      { rot: 0.45, sy: 0.96, dy: 4 },
      { rot: 0.85, sy: 0.88, dy: 10 },
      { rot: 1.25, sy: 0.78, dy: 16 }
    ];
    for (let i = 0; i < 4; i++) {
      const key = kunci + "-mati-" + i;
      const ada = tekstur[key];
      if (ada && ada.width) continue;
      const cs = document.createElement("canvas");
      const pad = Math.ceil(Math.max(w, h) * 0.35);
      cs.width = w + pad * 2;
      cs.height = h + pad * 2;
      const g = cs.getContext("2d");
      if (!g) continue;
      const pose = poses[i];
      g.translate(cs.width / 2, cs.height - pad - 4);
      g.rotate(pose.rot);
      g.scale(1, pose.sy);
      g.drawImage(img, -w / 2, -h + pose.dy);
      tekstur[key] = cs;
    }
  }

  Promise.all(muat)
    .then(() => Promise.all(sfxList.map((s) => muatSfxLokal(s.kunci, s.src, s.vol))))
    .then(() => Promise.all(musikList.map((m) => muatLaguLokal(m.kunci, m.src))))
    .then(() => {

      for (const k of KARAKTER) {
        const idle0 = tekstur[k.kunci + "-idle-0"] || tekstur[k.kunci];
        bakeFrameMatiFallback(k.kunci, idle0);
      }
      pasangTombol();
      buatBgPartikel();
      resetArena({ koinBaru: true });
      lastTime = performance.now();
      requestAnimationFrame(loop);
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
        if (!lastTime) lastTime = performance.now();
        pasangTombol();
        requestAnimationFrame(loop);
      } catch (e2) {}
      try { tampilkanJudul(); } catch (e3) {
        layarJudul.classList.remove("hidden");
      }
    });
}

mulai();
