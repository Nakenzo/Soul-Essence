const layarJudul = document.getElementById("layarJudul");
const layarLevel = document.getElementById("layarLevel");
const layarPilih = document.getElementById("layarPilih");
const layarKarakter = document.getElementById("layarKarakter");
const layarGameOver = document.getElementById("layarGameOver");
const layarMenang = document.getElementById("layarMenang");
const layarPause = document.getElementById("layarPause");
const tombolPause = document.getElementById("tombolPause");
const daftarKarakter = document.getElementById("daftarKarakter");
const koinAkhirEl = document.getElementById("skorAkhir");
const koinMenangEl = document.getElementById("skorMenang");
const judulAkhirEl = document.getElementById("judulAkhir");

const layarDevice = document.getElementById("layarDevice");
const layarPutar = document.getElementById("layarPutar");

function kunciLandscapeMobile() {
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen()
      .then(() => {
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock("landscape").catch(() => {});
        }
      })
      .catch(() => {});
  }
}

function cekOrientasi() {
  if (deviceTerpilih !== "mobile") return;
  if (!layarPutar) return;
  const portrait = window.innerHeight > window.innerWidth;
  layarPutar.classList.toggle("tampil", portrait);
}

window.addEventListener("resize", cekOrientasi);
window.addEventListener("orientationchange", () => setTimeout(cekOrientasi, 200));

function pilihDevice(dev) {
  deviceTerpilih = dev;
  document.body.dataset.device = dev;
  try { localStorage.setItem("soul-essence-device", dev); } catch (err) {}
  bukaAudio();

  if (typeof latarSkala === "function" && latarSkala() !== latarSkalaTerpakai) latarCache = null;
  layarDevice.classList.add("hidden");

  if (statusGame === "title" && layarJudul && layarJudul.classList.contains("hidden")) {
    layarJudul.classList.remove("hidden");
  }
  if (dev === "mobile") {
    kunciLandscapeMobile();
    cekOrientasi();
  }
}
layarDevice.querySelectorAll("[data-device]").forEach((b) =>
  b.addEventListener("click", () => pilihDevice(b.dataset.device)));

let _statusNotaTerakhir = null;
function aturNotaKartu() {
  if (_statusNotaTerakhir === statusGame) return;
  _statusNotaTerakhir = statusGame;
  const nota = document.getElementById("notaKartu");
  if (!nota) return;
  const tampil = statusGame === "main" || statusGame === "upgrade" ||
    statusGame === "pause" || statusGame === "over";
  nota.classList.toggle("tampil", tampil);
}

function aturTombolPause() {
  if (statusGame === "main") {
    tombolPause.classList.remove("hidden");
  } else {
    tombolPause.classList.add("hidden");
  }
}

function sembunyiSemua() {
  layarJudul.classList.add("hidden");
  layarLevel.classList.add("hidden");
  layarPilih.classList.add("hidden");
  layarKarakter.classList.add("hidden");
  layarGameOver.classList.add("hidden");
  layarPause.classList.add("hidden");
  layarMenang.classList.add("hidden");
  if (typeof hentikanKonfeti === "function") hentikanKonfeti();

  if (!animMati && statusGame !== "main") {
    zoomKamera = 1;
    aturFilterMati(0);
  }
}

function tampilkanJudul() {

  statusGame = "title";
  karakter = null;
  koin = 0;
  try {
    sembunyiSemua();
  } catch (err) {
    errorBanner = err && err.message ? err.message : String(err);
  }
  layarJudul.classList.remove("hidden");
  try {
    resetArena({ koinBaru: true });
    segarkanSaldoJudul();
    aturTombolPause();
    if (typeof setMusik === "function") setMusik("lobby");
  } catch (err) {
    errorBanner = err && err.message ? err.message : String(err);
    if (err && err.stack) {
      const st = err.stack.split("\n");
      if (st[1]) errorBanner += " — " + st[1].trim();
    }
  }
}

function segarkanSaldoJudul() {
  const el = document.getElementById("saldoJudul");
  if (!el) return;
  const saldo = typeof progres === "object" && progres ? progres.koinSaldo : 0;
  el.textContent = saldo > 0 ? ("KOIN TERSIMPAN: " + saldo) : "";
}

function ikonTipeSVG(kar) {
  if (kar && kar.tipe === "jarak") {
    return '<svg class="ikon-stat" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19L19 5"/><path d="M9 5h10v10"/></svg>';
  }
  return '<svg class="ikon-stat" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#c8d6ea" stroke-width="2.2" stroke-linecap="round"><path d="M4.5 4.5L19.5 19.5"/><path d="M19.5 4.5L4.5 19.5"/><path d="M15.7 18.3l3-3"/><path d="M5.7 15.7l3 3"/></svg>';
}

function ikonElemenSVG(el) {
  const e = String(el || "").toLowerCase();
  if (e === "api") {
    return '<svg class="ikon-stat ikon-elemen" viewBox="0 0 24 24" width="46" height="46">' +
      '<defs><linearGradient id="gradApi" x1="0" y1="1" x2="0" y2="0">' +
      '<stop offset="0%" stop-color="#ff3d00"/><stop offset="55%" stop-color="#ff9100"/><stop offset="100%" stop-color="#ffee58"/>' +
      '</linearGradient></defs>' +
      '<path fill="url(#gradApi)" d="M13.5 1.5c.3 2.8 1.9 4.2 3.4 6.1 1.4 1.8 2.6 3.7 2.6 6.4 0 4.1-3.2 7.5-7.5 7.5S4.5 18.1 4.5 14c0-2.4 1-4.3 2.4-6.1.5 1.3 1.3 2.1 2.4 2.5-.4-3.1.5-6.3 1.8-8.4.3 1.9 1 3.1 2 3.9.6-1.5.6-3.1.4-4.4z"/>' +
      '<path fill="#ffd54f" opacity="0.9" d="M12.2 10.5c.6 1.5 2.4 2.6 2.4 5 0 1.9-1.3 3.4-3.1 3.4s-3.1-1.5-3.1-3.4c0-1.5.8-2.6 1.7-3.6.3.9.8 1.4 1.5 1.7-.2-1.2 0-2.3.6-3.1z"/>' +
      '</svg>';
  }
  if (e === "es") {
    return '<svg class="ikon-stat ikon-elemen" viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="#b3e5fc" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M12 2.5v19M3.8 7.2l16.4 9.6M20.2 7.2L3.8 16.8"/>' +
      '<path d="M9.9 4.6L12 5.8l2.1-1.2"/>' +
      '<path d="M9.9 19.4L12 18.2l2.1 1.2"/>' +
      '<path d="M17.4 6.5v2.4l2.1 1.2"/>' +
      '<path d="M6.6 6.5v2.4l-2.1 1.2"/>' +
      '<path d="M17.4 17.5v-2.4l2.1-1.2"/>' +
      '<path d="M6.6 17.5v-2.4l-2.1-1.2"/>' +
      '</svg>';
  }
  return "";
}

let karakterUpgrade = null;

function tampilkanKarakter() {
  sembunyiSemua();
  statusGame = "title";
  if (!karakterUpgrade) {

    karakterUpgrade = KARAKTER[0] ? KARAKTER[0].kunci : null;
  }
  layarKarakter.classList.remove("hidden");
  buatPilihanUpgrade();
  aturTombolPause();
  if (typeof setMusik === "function") setMusik("lobby");
}

function segarkanSaldoKarakter() {
  const el = document.getElementById("saldoKarakter");
  if (!el) return;
  const saldo = typeof progres === "object" && progres ? progres.koinSaldo : 0;
  el.textContent = "KOIN KAMU: " + saldo;
}

function buatPilihanUpgrade() {
  const daftar = document.getElementById("daftarUpgrade");
  if (!daftar) return;
  daftar.innerHTML = "";
  segarkanSaldoKarakter();

  KARAKTER.forEach((kar) => {
    const card = document.createElement("button");
    card.className = "kartu-up karakter-up";
    if (kar.kunci === karakterUpgrade) card.classList.add("terpilih");

    const img = typeof tekstur !== "undefined" ? tekstur[kar.kunci] : null;
    const cv = document.createElement("canvas");
    cv.width = 56;
    cv.height = 56;
    const cx = cv.getContext("2d");
    if (img && img.width) {
      const s = 56 / Math.max(img.width, img.height);
      cx.imageSmoothingEnabled = s < 1;
      cx.drawImage(img, (56 - img.width * s) / 2, (56 - img.height * s) / 2, img.width * s, img.height * s);
    } else {
      cx.fillStyle = "#ff8844";
      cx.fillRect(7, 7, 42, 42);
    }
    card.appendChild(cv);

    const nama = document.createElement("div");
    nama.className = "nama-karakter";
    const lvl = typeof levelKarakter === "function" ? levelKarakter(kar.kunci) : 0;
    nama.textContent = kar.nama + " LV" + lvl;
    card.appendChild(nama);

    card.addEventListener("click", () => {
      karakterUpgrade = kar.kunci;
      if (typeof sfxKlik === "function") sfxKlik();
      buatPilihanUpgrade();
    });
    card.addEventListener("pointerenter", () => sfxKlik && sfxKlik());
    daftar.appendChild(card);
  });

  const kar = KARAKTER.find((k) => k.kunci === karakterUpgrade) || KARAKTER[0];
  if (!kar) return;

  const lv = typeof levelKarakter === "function" ? levelKarakter(kar.kunci) : 0;
  const bon = typeof bonusStatKarakter === "function" ? bonusStatKarakter(kar.kunci) : { hp: 1, damage: 1, kecepatan: 1, lv: 0 };
  const hp = Math.round(kar.hp * bon.hp);
  const dmg = Math.round(kar.damage * bon.damage);
  const spd = Math.round(kar.kecepatan * bon.kecepatan);
  const max = KARAKTER_LEVEL_MAX;
  const biaya = typeof biayaNaikLevelKarakter === "function" ? biayaNaikLevelKarakter(lv) : Infinity;
  const cukup = typeof progres === "object" && progres && progres.koinSaldo >= biaya;
  const penuh = lv >= max;

  const statEl = document.getElementById("statKarakterIsi");
  if (statEl) {
    const tipe = kar.tipe === "jarak" ? "JARAK JAUH" : "JARAK DEKAT";
    const stats = [
      { lbl: "ATTACK", nilai: dmg },
      { lbl: "HP", nilai: hp },
      { lbl: "SPEED", nilai: spd },
      { lbl: "CRIT RATE", nilai: "5%" },
      { lbl: "CRIT DMG", nilai: "150%" },
      { lbl: "TYPE", nilai: tipe, ikon: ikonTipeSVG(kar) },
      { lbl: "ELEMENT", nilai: kar.element || "-", ikon: ikonElemenSVG(kar.element) }
    ];
    statEl.innerHTML = "";
    stats.forEach((s) => {
      const baris = document.createElement("div");
      baris.className = "stat-baris";
      const lbl = document.createElement("span");
      lbl.className = "stat-lbl";
      lbl.textContent = s.lbl;
      const val = document.createElement("span");
      val.className = "stat-val";
      if (s.ikon) {
        const wadah = document.createElement("span");
        wadah.className = "stat-val-ikon";
        wadah.appendChild(document.createTextNode(s.nilai + " "));
        wadah.innerHTML += s.ikon;
        val.appendChild(wadah);
      } else {
        val.textContent = s.nilai;
      }
      baris.appendChild(lbl);
      baris.appendChild(val);
      statEl.appendChild(baris);
    });
  }

  const skillEl = document.getElementById("daftarSkill");
  if (skillEl) {
    skillEl.innerHTML = "";

    const jarak = kar.tipe === "jarak";
    const namaSkillJurus = jarak ? "FROSTBITE" : "HEATWAVE";
    const namaSkill = [
      "BASE ATTACK",
      namaSkillJurus,
      "Skill 3",
      "Skill 4",
      "Skill 5"
    ];

    const aksen = kar.warnaDash || (jarak ? "#7dd3fc" : "#ff4d4d");
    const svg = (isi) =>
      '<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke-linecap="round" stroke-linejoin="round">' + isi + '</svg>';

    const ikonSkill = jarak ? [

      svg('<path d="M5 19L16 8" stroke="' + aksen + '" stroke-width="2.2"/>' +
        '<path d="M13 5l6 6" stroke="' + aksen + '" stroke-width="2.2"/>' +
        '<path d="M15 5h4v4" stroke="' + aksen + '" stroke-width="2.2"/>' +
        '<path d="M5 19l1.5-3.5L10 17z" fill="' + aksen + '"/>'),

      svg('<path d="M3 16a9 9 0 0 1 18 0" stroke="#b3e5fc" stroke-width="2.4"/>' +
        '<path d="M6 16a6 6 0 0 1 12 0" stroke="' + aksen + '" stroke-width="1.8"/>' +
        '<path d="M9 16a3 3 0 0 1 6 0" stroke="#e1f5fe" stroke-width="1.4"/>' +
        '<path d="M8 18v2.5M12 18.5v2.5M16 18v2.5" stroke="#b3e5fc" stroke-width="1.4"/>'),
      svg('<path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z" stroke="' + aksen + '" stroke-width="1.8"/>'),
      svg('<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" stroke="' + aksen + '" stroke-width="1.8"/>'),
      svg('<path d="M13 2L5 14h6l-1 8 8-12h-6z" stroke="' + aksen + '" stroke-width="1.8"/>')
    ] : [

      svg('<path d="M4 18C8 14 14 8 20 4" stroke="' + aksen + '" stroke-width="2.4"/>' +
        '<path d="M4 18l.5-3M4 18l3-.5" stroke="' + aksen + '" stroke-width="1.6"/>'),

      svg('<path d="M3 17a9 9 0 0 1 18 0" stroke="#ff3d00" stroke-width="2.6"/>' +
        '<path d="M6 17a6 6 0 0 1 12 0" stroke="#ff9100" stroke-width="1.8"/>' +
        '<path d="M9 17a3 3 0 0 1 6 0" stroke="#ffee58" stroke-width="1.4"/>'),
      svg('<path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z" stroke="' + aksen + '" stroke-width="1.8"/>'),
      svg('<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" stroke="' + aksen + '" stroke-width="1.8"/>'),
      svg('<path d="M13 2L5 14h6l-1 8 8-12h-6z" stroke="' + aksen + '" stroke-width="1.8"/>')
    ];

    const ikonTerkunci = svg('<rect x="5" y="10" width="14" height="10" rx="2" stroke="#8a93a5" stroke-width="1.8"/>' +
      '<path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="#8a93a5" stroke-width="1.8"/>' +
      '<circle cx="12" cy="15" r="1.4" fill="#8a93a5"/>');
    namaSkill.forEach((nm, i) => {
      const baris = document.createElement("div");
      baris.className = "kartu-note";
      if (i >= 2) baris.classList.add("skill-terkunci");
      const bulat = document.createElement("div");
      bulat.className = "kartu-note-bulat";
      bulat.style.background = i >= 2 ? "rgba(138,147,165,0.15)" : aksen + "2b";
      bulat.innerHTML = i >= 2 ? ikonTerkunci : ikonSkill[i];
      const teks = document.createElement("span");
      teks.className = "nama-karakter";
      teks.textContent = nm;
      baris.appendChild(bulat);
      baris.appendChild(teks);
      skillEl.appendChild(baris);
    });
  }

  const btn = document.getElementById("tombolNaikLevel");
  if (btn) {
    if (penuh) {
      btn.textContent = "LEVEL MAKS";
      btn.disabled = true;
    } else {
      btn.textContent = "NAIK LEVEL - " + biaya + " KOIN";
      btn.disabled = !cukup;
    }

    btn.classList.toggle("tombol-hijau", cukup && !penuh);
    btn.classList.toggle("tombol-abu", !cukup || penuh);
    btn.classList.toggle("terkunci", !cukup && !penuh);
    btn.onclick = () => {
      if (typeof naikkanLevelKarakter === "function" && naikkanLevelKarakter(kar.kunci)) {
        if (typeof sfxKlik === "function") sfxKlik();
        buatPilihanUpgrade();
      } else if (typeof sfxKlik === "function") sfxKlik();
    };
  }
  const lvlTampil = document.getElementById("levelKarakterTampil");
  if (lvlTampil) lvlTampil.textContent = "LV " + lv + "/" + max;
}

function tampilkanLevel() {
  sembunyiSemua();
  statusGame = "level";
  layarLevel.classList.remove("hidden");
  buatPilihanLevel();
  aturTombolPause();
  if (typeof setMusik === "function") setMusik("lobby");
}

function tampilkanPilih() {
  sembunyiSemua();
  statusGame = "select";

  sinkronSfxTerjeda();
  layarPilih.classList.remove("hidden");
  buatPilihanKarakter();
  aturTombolPause();
  if (typeof setMusik === "function") setMusik("lobby");
}

function tampilkanGameOver() {
  sembunyiSemua();
  statusGame = "over";
  judulAkhirEl.textContent = "GAME OVER";
  koinAkhirEl.textContent = "KOIN: " + koin;
  if (typeof catatKoinTertinggi === "function") catatKoinTertinggi(koin);
  if (typeof tambahKoinSaldo === "function") tambahKoinSaldo(koin);
  layarGameOver.classList.remove("hidden");
  aturTombolPause();
  if (typeof setMusik === "function") setMusik("lobby");
}

function tampilkanMenang() {
  sembunyiSemua();
  statusGame = "over";
  koinMenangEl.textContent = "KOIN: " + koin;

  if (typeof tandaiLevelSelesai === "function") tandaiLevelSelesai(levelPilihan, koin);
  if (typeof tambahKoinSaldo === "function") tambahKoinSaldo(koin);
  const teksBaru = document.getElementById("teksLevelBaru");
  const tombolNext = document.getElementById("tombolLevelBerikut");
  const nextIdx = levelPilihan + 1;
  const adaLevelBaru = DAFTAR_LEVEL[nextIdx]
    && (typeof apakahLevelTerbuka !== "function" || apakahLevelTerbuka(nextIdx));
  if (teksBaru) {
    teksBaru.textContent = adaLevelBaru
      ? ("LEVEL BARU TERBUKA: " + (DAFTAR_LEVEL[nextIdx].nama || ("Level " + (nextIdx + 1))))
      : "";
  }

  if (tombolNext) tombolNext.classList.toggle("hidden", !adaLevelBaru);
  layarMenang.classList.remove("hidden");
  if (typeof mulaiKonfeti === "function") mulaiKonfeti(90, 3.5);
  aturTombolPause();
  if (typeof setMusik === "function") setMusik("lobby");
}

function segarkanUISuara() {
  const set = (slId, nilId, v) => {
    const sl = document.getElementById(slId);
    if (sl) sl.value = Math.round(v * 100);
    const n = document.getElementById(nilId);
    if (n) n.textContent = Math.round(v * 100);
  };
  set("slUmum", "nilUmum", typeof _volUmum === "number" ? _volUmum : 0.9);
  set("slSfx", "nilSfx", typeof _volSfx === "number" ? _volSfx : 1);
  set("slMusik", "nilMusik", typeof _volMusik === "number" ? _volMusik : 1);
}

function tampilkanPause() {
  if (statusGame !== "main" || animMati) return;
  statusGame = "pause";
  sinkronSfxTerjeda();
  segarkanUISuara();
  layarPause.classList.remove("hidden");
  aturTombolPause();
}

function lanjutDariPause() {
  if (statusGame !== "pause") return;
  statusGame = "main";
  sinkronSfxTerjeda();
  layarPause.classList.add("hidden");
  aturTombolPause();
}

function mulaiGameBaru() {
  sfxResume();
  resetArena({ koinBaru: true });
  statusGame = "main";
  sinkronSfxTerjeda();
  sembunyiSemua();
  aturTombolPause();
  if (typeof pasangIkonSentuh === "function") pasangIkonSentuh();
  if (typeof setMusik === "function") setMusik("game");
}

function ulangDenganKarakter() {
  resetArena({ koinBaru: true });
  statusGame = "main";
  sinkronSfxTerjeda();
  sembunyiSemua();
  aturTombolPause();
  if (typeof pasangIkonSentuh === "function") pasangIkonSentuh();
  if (typeof setMusik === "function") setMusik("game");
}

function pasangTombol() {
  document.getElementById("tombolPlay").addEventListener("click", tampilkanLevel);
  document.getElementById("tombolKarakter").addEventListener("click", tampilkanKarakter);
  document.getElementById("tombolKembaliKarakter").addEventListener("click", tampilkanJudul);
  document.getElementById("tombolKembaliJudul").addEventListener("click", tampilkanJudul);
  document.getElementById("tombolUlang").addEventListener("click", ulangDenganKarakter);

  document.getElementById("tombolMenu").addEventListener("click", tampilkanPilih);
  tombolPause.addEventListener("click", tampilkanPause);
  document.getElementById("tombolLanjut").addEventListener("click", lanjutDariPause);
  document.getElementById("tombolMenuPause").addEventListener("click", tampilkanPilih);
  document.getElementById("tombolJudulPause").addEventListener("click", tampilkanJudul);
  document.getElementById("tombolJudul").addEventListener("click", tampilkanJudul);
  document.getElementById("tombolLevelBerikut").addEventListener("click", () => {
    const nextIdx = levelPilihan + 1;
    if (!DAFTAR_LEVEL[nextIdx]) return;
    levelPilihan = nextIdx;
    tampilkanPilih();
  });
  document.getElementById("tombolUlangMenang").addEventListener("click", tampilkanLevel);
  document.getElementById("tombolMenuMenang").addEventListener("click", tampilkanJudul);

  document.querySelectorAll(".tombol-play, .tombol-hijau, .tombol-abu, .tombol-pause")
    .forEach((el) => el.addEventListener("click", sfxKlik));

  daftarKarakter.addEventListener("click", sfxKlik);

  const pasangSlider = (slId, nilId, fn) => {
    const sl = document.getElementById(slId);
    if (!sl) return;
    sl.addEventListener("input", () => {
      fn(sl.value / 100);
      const n = document.getElementById(nilId);
      if (n) n.textContent = sl.value;
    });
  };
  if (typeof aturVolumeUmum === "function") {
    pasangSlider("slUmum", "nilUmum", aturVolumeUmum);
    pasangSlider("slSfx", "nilSfx", aturVolumeSfx);
    pasangSlider("slMusik", "nilMusik", aturVolumeMusik);
  }
}

function buatPilihanKarakter() {
  daftarKarakter.innerHTML = "";

  KARAKTER.forEach((kar, idx) => {
    const img = tekstur[kar.kunci];
    const card = document.createElement("button");
    card.className = "kartu-karakter";

    const cv = document.createElement("canvas");
    cv.width = 56;
    cv.height = 56;
    const c = cv.getContext("2d");
    if (img && img.width) {
      const s = 56 / Math.max(img.width, img.height);
      const w = img.width * s;
      const h = img.height * s;

      c.imageSmoothingEnabled = s < 1;
      c.drawImage(img, (56 - w) / 2, (56 - h) / 2, w, h);
    } else {
      c.fillStyle = "#ff8844";
      c.fillRect(7, 7, 42, 42);
    }
    card.appendChild(cv);

    const nama = document.createElement("div");
    nama.className = "nama-karakter";
    nama.textContent = (idx + 1) + ". " + kar.nama;
    card.appendChild(nama);

    card.addEventListener("click", () => {
      karakter = kar;
      mulaiGameBaru();
    });

    card.addEventListener("pointerenter", () => tampilInfoKarakter(kar));
    card.addEventListener("pointerleave", sembunyiInfoKarakter);

    daftarKarakter.appendChild(card);
  });

  daftarKarakter.addEventListener("pointerleave", sembunyiInfoKarakter);
}

function buatPilihanLevel() {
  const daftar = document.getElementById("daftarLevel");
  if (!daftar) return;
  daftar.innerHTML = "";

  DAFTAR_LEVEL.forEach((lvl, idx) => {
    const card = document.createElement("button");
    card.className = "kartu-level";
    card.style.setProperty("--warna-level", lvl.warna || "#4ade80");

    const terbuka = typeof apakahLevelTerbuka === "function"
      ? apakahLevelTerbuka(idx)
      : idx === 0;
    if (!terbuka) card.classList.add("terkunci");

    const nama = document.createElement("div");
    nama.className = "judul-level";
    nama.textContent = terbuka
      ? (lvl.nama || ("Level " + (idx + 1)))
      : "???";
    if (!terbuka) nama.textContent += " ??";

    const tempat = document.createElement("div");
    tempat.className = "nama-level";
    tempat.textContent = terbuka ? (lvl.judul || "") : "Tamatkan level sebelumnya";

    card.appendChild(nama);
    card.appendChild(tempat);

    card.addEventListener("click", () => {
      if (!terbuka) {
        if (typeof sfxKlik === "function") sfxKlik();
        return;
      }
      levelPilihan = idx;
      tampilkanPilih();
    });
    card.addEventListener("pointerenter", () => sfxKlik && sfxKlik());
    daftar.appendChild(card);
  });
}

function tampilInfoKarakter(kar) {
  const info = document.getElementById("infoKarakter");
  if (!info) return;
  info.innerHTML = "";
  const parts = [
    { lbl: "HP", nilai: kar.hp },

    { lbl: "TIPE", ikon: ikonTipeSVG(kar) },
    { lbl: "ELEMEN", ikon: ikonElemenSVG(kar.element) }
  ];

  parts.forEach((p) => {
    const baris = document.createElement("div");
    baris.className = "info-baris";
    const lbl = document.createElement("span");
    lbl.className = "info-lbl";
    lbl.textContent = p.lbl + ": ";
    const val = document.createElement("span");
    val.className = "info-val";
    if (p.ikon) {
      val.innerHTML = p.ikon;
    } else {
      val.textContent = p.nilai;
    }
    baris.appendChild(lbl);
    baris.appendChild(val);
    info.appendChild(baris);
  });
  info.classList.remove("hidden");
}

function sembunyiInfoKarakter() {
  const info = document.getElementById("infoKarakter");
  if (info) info.classList.add("hidden");
}
