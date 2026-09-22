// ============================================================
// MENU - alur layar: Judul -> Pilih Karakter -> Game -> Game Over.
// Karakter terpilih dipakai sampai permainan berakhir (game over).
// ============================================================
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

// ---------- Layar awal: pilih perangkat ----------
// Browser memblokir audio sebelum interaksi pertama, jadi klik perangkat
// dipakai sekaligus untuk membuka AudioContext (musik lobby mulai).
const layarDevice = document.getElementById("layarDevice");
const layarPutar = document.getElementById("layarPutar");

// Mode HP: minta fullscreen + kunci orientasi LANDSCAPE (di browser yang
// mendukung). Gagal bukan masalah � layar "putar perangkat" yang jalan.
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

// Kalau HP diputar portrait, tampilkan ajakan kembali ke landscape.
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
  // Bg latar dibake sesuai skala perangkat ? bangun ulang bila skala berubah.
  if (typeof latarSkala === "function" && latarSkala() !== latarSkalaTerpakai) latarCache = null;
  layarDevice.classList.add("hidden");
  if (dev === "mobile") {
    kunciLandscapeMobile();
    cekOrientasi();
  }
}
layarDevice.querySelectorAll("[data-device]").forEach((b) =>
  b.addEventListener("click", () => pilihDevice(b.dataset.device)));

// Nota KARTUMU tampil saat permainan berjalan (main), pemilihan kartu
// upgrade, jeda, dan game over/menang � APA PUN di dalam permainan. Cuma
// layar pra-game (judul & pilih karakter) yang menyembunyikannya. Tujuannya:
// sidebar dipesan di susunan flex SEPANJANG sesi bermain, jadi kanvas tidak
// pernah bergeser saat pindah layar (mis. main ? pilih kartu).
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

// Tombol pause (II) hanya tampil saat permainan berjalan.
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
}

// ---------- Layar Judul (tombol PLAY) ----------
function tampilkanJudul() {
  sembunyiSemua();
  statusGame = "title";
  karakter = null;
  koin = 0;
  resetArena({ koinBaru: true });
  segarkanSaldoJudul();
  layarJudul.classList.remove("hidden");
  aturTombolPause();
  if (typeof setMusik === "function") setMusik("lobby");
}

// Tampilkan saldo koin di layar judul (rekomendasi pengeluaran: upgrade).
function segarkanSaldoJudul() {
  const el = document.getElementById("saldoJudul");
  if (!el) return;
  const saldo = typeof progres === "object" && progres ? progres.koinSaldo : 0;
  el.textContent = saldo > 0 ? ("KOIN TERSIMPAN: " + saldo) : "";
}

// ---------- Layar Upgrade Karakter ----------
// Karakter yang sedang diamati di layar upgrade.
let karakterUpgrade = null;

function tampilkanKarakter() {
  sembunyiSemua();
  statusGame = "title";
  if (!karakterUpgrade) {
    // Default karakter pertama.
    karakterUpgrade = KARAKTER[0] ? KARAKTER[0].kunci : null;
  }
  layarKarakter.classList.remove("hidden");
  buatPilihanUpgrade();
  aturTombolPause();
  if (typeof setMusik === "function") setMusik("lobby");
}

// ---------- Layar upgrade karakter ----------
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

  // 1) Deretan kartu karakter (di atas) — geser horizontal bila banyak.
  KARAKTER.forEach((kar) => {
    const card = document.createElement("button");
    card.className = "kartu-up karakter-up";
    if (kar.kunci === karakterUpgrade) card.classList.add("terpilih");

    // Avatar kecil.
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

  // Karakter aktif.
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

  // 2) Balok stat besar di kanan: ATK, HP, SPEED, CRIT RATE, CRIT DMG, TYPE, ELEMENT.
  const statEl = document.getElementById("statKarakterIsi");
  if (statEl) {
    const tipe = kar.tipe === "jarak" ? "JARAK JAUH" : "JARAK DEKAT";
    const stats = [
      { lbl: "ATTACK", nilai: dmg },
      { lbl: "HP", nilai: hp },
      { lbl: "SPEED", nilai: spd },
      { lbl: "CRIT RATE", nilai: "5%" },
      { lbl: "CRIT DMG", nilai: "150%" },
      { lbl: "TYPE", nilai: tipe },
      { lbl: "ELEMENT", nilai: kar.element || "-" }
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
      val.textContent = s.nilai;
      baris.appendChild(lbl);
      baris.appendChild(val);
      statEl.appendChild(baris);
    });
  }

  // 3) Balok skill (kiri) — 5 skill (placeholder, detail dibahas nanti).
  const skillEl = document.getElementById("daftarSkill");
  if (skillEl) {
    skillEl.innerHTML = "";
    const namaSkill = [
      "Serangan Dasar",
      "Jurus Khas",
      "Skill 3",
      "Skill 4",
      "Skill 5"
    ];
    namaSkill.forEach((nm, i) => {
      const baris = document.createElement("div");
      baris.className = "kartu-note";
      const bulat = document.createElement("div");
      bulat.className = "kartu-note-bulat";
      bulat.style.background = "rgba(255,210,63,0.18)";
      bulat.textContent = i + 1;
      const teks = document.createElement("span");
      teks.className = "nama-karakter";
      teks.textContent = nm;
      baris.appendChild(bulat);
      baris.appendChild(teks);
      skillEl.appendChild(baris);
    });
  }

  // 4) Tombol upgrade + tampilan level karakter.
  const btn = document.getElementById("tombolNaikLevel");
  if (btn) {
    if (penuh) {
      btn.textContent = "LEVEL MAKS";
      btn.disabled = true;
    } else {
      btn.textContent = "NAIK LEVEL - " + biaya + " KOIN";
      btn.disabled = !cukup;
    }
    btn.classList.toggle("terkunci", !cukup && !penuh);
    btn.onclick = () => {
      if (typeof naikkanLevelKarakter === "function" && naikkanLevelKarakter(kar.kunci)) {
        if (typeof sfxKlik === "function") sfxKlik();
        buatPilihanUpgrade();  // segarkan layar
      } else if (typeof sfxKlik === "function") sfxKlik();
    };
  }
  const lvlTampil = document.getElementById("levelKarakterTampil");
  if (lvlTampil) lvlTampil.textContent = "LV " + lv + "/" + max;
}

// ---------- Layar Pilih Level ----------
function tampilkanLevel() {
  sembunyiSemua();
  statusGame = "level";
  layarLevel.classList.remove("hidden");
  buatPilihanLevel();
  aturTombolPause();
  if (typeof setMusik === "function") setMusik("lobby");
}

// ---------- Layar Pilih Karakter ----------
function tampilkanPilih() {
  sembunyiSemua();
  statusGame = "select";
  // Audio mungkin masih tersuspensi kalau datang dari layar jeda.
  sinkronSfxTerjeda();
  layarPilih.classList.remove("hidden");
  buatPilihanKarakter();
  aturTombolPause();
  if (typeof setMusik === "function") setMusik("lobby");
}

// ---------- Layar Game Over ----------
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

// ---------- Layar Menang (selesai semua level) ----------
function tampilkanMenang() {
  sembunyiSemua();
  statusGame = "over";
  koinMenangEl.textContent = "KOIN: " + koin;
  // Progres: level ini ditamatkan (membuka level berikutnya) + simpan koin.
  if (typeof tandaiLevelSelesai === "function") tandaiLevelSelesai(levelPilihan, koin);
  if (typeof tambahKoinSaldo === "function") tambahKoinSaldo(koin);
  const teksBaru = document.getElementById("teksLevelBaru");
  if (teksBaru) {
    const nextIdx = levelPilihan + 1;
    const adaLevelBaru = DAFTAR_LEVEL[nextIdx]
      && (typeof apakahLevelTerbuka !== "function" || apakahLevelTerbuka(nextIdx));
    teksBaru.textContent = adaLevelBaru
      ? ("LEVEL BARU TERBUKA: " + (DAFTAR_LEVEL[nextIdx].nama || ("Level " + (nextIdx + 1))))
      : "";
  }
  layarMenang.classList.remove("hidden");
  aturTombolPause();
  if (typeof setMusik === "function") setMusik("lobby");
}

// ---------- Jeda (bekukan semua data: skor, HP, posisi) ----------
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
  if (statusGame !== "main") return;
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

// ---------- Mulai bermain (dari layar pilih) ----------
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

// ---------- Game over: ulang dengan karakter SAMA ----------
function ulangDenganKarakter() {
  resetArena({ koinBaru: true });
  statusGame = "main";
  sinkronSfxTerjeda();
  sembunyiSemua();
  aturTombolPause();
  if (typeof pasangIkonSentuh === "function") pasangIkonSentuh();
  if (typeof setMusik === "function") setMusik("game");
}

// ---------- Event tombol ----------
function pasangTombol() {
  document.getElementById("tombolPlay").addEventListener("click", tampilkanLevel);
  document.getElementById("tombolKarakter").addEventListener("click", tampilkanKarakter);
  document.getElementById("tombolKembaliKarakter").addEventListener("click", tampilkanJudul);
  document.getElementById("tombolKembaliJudul").addEventListener("click", tampilkanJudul);
  document.getElementById("tombolUlang").addEventListener("click", ulangDenganKarakter);
  // "Ganti karakter" langsung ke layar pemilihan karakter.
  document.getElementById("tombolMenu").addEventListener("click", tampilkanPilih);
  tombolPause.addEventListener("click", tampilkanPause);
  document.getElementById("tombolLanjut").addEventListener("click", lanjutDariPause);
  document.getElementById("tombolMenuPause").addEventListener("click", tampilkanPilih);
  document.getElementById("tombolUlangMenang").addEventListener("click", tampilkanLevel);
  document.getElementById("tombolMenuMenang").addEventListener("click", tampilkanJudul);

  // Bunyi klik di semua tombol UI (event bubbling juga menjangkau kartu karakter).
  document.querySelectorAll(".tombol-play, .tombol-hijau, .tombol-abu, .tombol-pause")
    .forEach((el) => el.addEventListener("click", sfxKlik));
  // Kartu karakter dibuat dinamis, bunyi klik lewat container via bubbling.
  daftarKarakter.addEventListener("click", sfxKlik);

  // Slider volume di menu PAUSE (ke fungsi aturVolume* dari audio.js).
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

// ---------- Kartu karakter (minimalis: kotak kecil) ----------
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
      // Perkecil → smoothing agar kartu tidak tampak pecah.
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

    // Hover: tampilkan info status karakter di bawah kartu; sembunyikan lagi
    // saat pointer keluar dari kartu.
    card.addEventListener("pointerenter", () => tampilInfoKarakter(kar));
    card.addEventListener("pointerleave", sembunyiInfoKarakter);

    daftarKarakter.appendChild(card);
  });
  // Kalau pointer keluar dari seluruh grid kartu, info ikut disembunyikan.
  daftarKarakter.addEventListener("pointerleave", sembunyiInfoKarakter);
}

// ---------- Kartu level (untuk menu pemilihan level) ----------
function buatPilihanLevel() {
  const daftar = document.getElementById("daftarLevel");
  if (!daftar) return;
  daftar.innerHTML = "";

  DAFTAR_LEVEL.forEach((lvl, idx) => {
    const card = document.createElement("button");
    card.className = "kartu-level";
    card.style.setProperty("--warna-level", lvl.warna || "#4ade80");

    // Level yang belum dibuka tampil terkunci dan tak bisa diklik.
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

// Info status karakter pada layar pilih: tampil saat kartu di-hover.
function tampilInfoKarakter(kar) {
  const info = document.getElementById("infoKarakter");
  if (!info) return;
  const tipe = kar.tipe === "jarak" ? "JARAK JAUH" : "JARAK DEKAT";
  info.innerHTML = "";
  const parts = [
    { lbl: "HP", nilai: kar.hp },
    { lbl: "TIPE", nilai: tipe },
    { lbl: "ELEMEN", nilai: kar.element || "-" }
  ];
  // Setiap stat ditulis berjejer KEBawah (satu baris per stat).
  parts.forEach((p) => {
    const baris = document.createElement("div");
    baris.className = "info-baris";
    const lbl = document.createElement("span");
    lbl.className = "info-lbl";
    lbl.textContent = p.lbl + ": ";
    const val = document.createElement("span");
    val.textContent = p.nilai;
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
