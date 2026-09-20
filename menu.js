// ============================================================
// MENU - alur layar: Judul -> Pilih Karakter -> Game -> Game Over.
// Karakter terpilih dipakai sampai permainan berakhir (game over).
// ============================================================
const layarJudul = document.getElementById("layarJudul");
const layarPilih = document.getElementById("layarPilih");
const layarGameOver = document.getElementById("layarGameOver");
const layarMenang = document.getElementById("layarMenang");
const layarPause = document.getElementById("layarPause");
const tombolPause = document.getElementById("tombolPause");
const daftarKarakter = document.getElementById("daftarKarakter");
const skorAkhirEl = document.getElementById("skorAkhir");
const skorMenangEl = document.getElementById("skorMenang");
const judulAkhirEl = document.getElementById("judulAkhir");
const menuStatus = document.getElementById("menuStatus");

// ---------- Layar awal: pilih perangkat ----------
// Browser memblokir audio sebelum interaksi pertama, jadi klik perangkat
// dipakai sekaligus untuk membuka AudioContext (musik lobby mulai).
const layarDevice = document.getElementById("layarDevice");
const layarPutar = document.getElementById("layarPutar");

// Mode HP: minta fullscreen + kunci orientasi LANDSCAPE (di browser yang
// mendukung). Gagal bukan masalah — layar "putar perangkat" yang jalan.
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
  layarDevice.classList.add("hidden");
  if (dev === "mobile") {
    kunciLandscapeMobile();
    cekOrientasi();
  }
}
layarDevice.querySelectorAll("[data-device]").forEach((b) =>
  b.addEventListener("click", () => pilihDevice(b.dataset.device)));

// Nota KARTUMU hanya tampil saat permainan benar-benar berjalan
// (statusGame === "main"); dikerjakan murah per frame di main.js loop.
let _statusNotaTerakhir = null;
function aturNotaKartu() {
  if (_statusNotaTerakhir === statusGame) return;
  _statusNotaTerakhir = statusGame;
  const nota = document.getElementById("notaKartu");
  if (nota) nota.classList.toggle("tampil", statusGame === "main");
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
  layarPilih.classList.add("hidden");
  layarGameOver.classList.add("hidden");
  layarPause.classList.add("hidden");
  layarMenang.classList.add("hidden");
}

// ---------- Layar Judul (tombol PLAY) ----------
function tampilkanJudul() {
  sembunyiSemua();
  statusGame = "title";
  karakter = null;
  score = 0;
  resetArena({ skorBaru: true });
  layarJudul.classList.remove("hidden");
  aturTombolPause();
  if (typeof setMusik === "function") setMusik("lobby");
}

// ---------- Layar Pilih Karakter ----------
function tampilkanPilih() {
  sembunyiSemua();
  statusGame = "select";
  // Audio mungkin masih tersuspensi kalau datang dari layar jeda.
  sinkronSfxTerjeda();
  menuStatus.textContent = "Pilih karakter dengan klik atau tekan 1/" + KARAKTER.length + ".";
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
  skorAkhirEl.textContent = "SKOR: " + score;
  layarGameOver.classList.remove("hidden");
  aturTombolPause();
  if (typeof setMusik === "function") setMusik("lobby");
}

// ---------- Layar Menang (selesai semua level) ----------
function tampilkanMenang() {
  sembunyiSemua();
  statusGame = "over";
  skorMenangEl.textContent = "SKOR: " + score;
  layarMenang.classList.remove("hidden");
  aturTombolPause();
  if (typeof setMusik === "function") setMusik("lobby");
}

// ---------- Jeda (bekukan semua data: skor, HP, posisi) ----------
function tampilkanPause() {
  if (statusGame !== "main") return;
  statusGame = "pause";
  sinkronSfxTerjeda();
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
  resetArena({ skorBaru: true });
  statusGame = "main";
  sinkronSfxTerjeda();
  sembunyiSemua();
  aturTombolPause();
  if (typeof pasangIkonSentuh === "function") pasangIkonSentuh();
  if (typeof setMusik === "function") setMusik("game");
}

// ---------- Game over: ulang dengan karakter SAMA ----------
function ulangDenganKarakter() {
  resetArena({ skorBaru: true });
  statusGame = "main";
  sinkronSfxTerjeda();
  sembunyiSemua();
  aturTombolPause();
  if (typeof pasangIkonSentuh === "function") pasangIkonSentuh();
  if (typeof setMusik === "function") setMusik("game");
}

// ---------- Event tombol ----------
function pasangTombol() {
  document.getElementById("tombolPlay").addEventListener("click", tampilkanPilih);
  document.getElementById("tombolUlang").addEventListener("click", ulangDenganKarakter);
  // "Ganti karakter" langsung ke layar pemilihan karakter.
  document.getElementById("tombolMenu").addEventListener("click", tampilkanPilih);
  tombolPause.addEventListener("click", tampilkanPause);
  document.getElementById("tombolLanjut").addEventListener("click", lanjutDariPause);
  document.getElementById("tombolMenuPause").addEventListener("click", tampilkanPilih);
  document.getElementById("tombolUlangMenang").addEventListener("click", tampilkanPilih);
  document.getElementById("tombolMenuMenang").addEventListener("click", tampilkanJudul);

  // Bunyi klik di semua tombol UI (event bubbling juga menjangkau kartu karakter).
  document.querySelectorAll(".tombol-play, .tombol-hijau, .tombol-abu, .tombol-pause")
    .forEach((el) => el.addEventListener("click", sfxKlik));
  // Kartu karakter dibuat dinamis, bunyi klik lewat container via bubbling.
  daftarKarakter.addEventListener("click", sfxKlik);
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
      // Perkecil â†’ smoothing agar kartu tidak tampak pecah.
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

    daftarKarakter.appendChild(card);
  });
}