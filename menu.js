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
  pernahMain = false;
  score = 0;
  resetArena({ skorBaru: true });
  layarJudul.classList.remove("hidden");
  aturTombolPause();
}

// ---------- Layar Pilih Karakter ----------
function tampilkanPilih() {
  sembunyiSemua();
  statusGame = "select";
  menuStatus.textContent = "Pilih karakter dengan klik atau tekan 1/" + KARAKTER.length + ".";
  layarPilih.classList.remove("hidden");
  buatPilihanKarakter();
  aturTombolPause();
}

// ---------- Layar Game Over ----------
function tampilkanGameOver() {
  sembunyiSemua();
  statusGame = "over";
  judulAkhirEl.textContent = "GAME OVER";
  skorAkhirEl.textContent = "SKOR: " + score;
  layarGameOver.classList.remove("hidden");
  aturTombolPause();
}

// ---------- Layar Menang (selesai semua level) ----------
function tampilkanMenang() {
  sembunyiSemua();
  statusGame = "over";
  skorMenangEl.textContent = "SKOR: " + score;
  layarMenang.classList.remove("hidden");
  aturTombolPause();
}

// ---------- Jeda (bekukan semua data: skor, HP, posisi) ----------
function tampilkanPause() {
  if (statusGame !== "main") return;
  statusGame = "pause";
  layarPause.classList.remove("hidden");
  aturTombolPause();
}

function lanjutDariPause() {
  if (statusGame !== "pause") return;
  statusGame = "main";
  layarPause.classList.add("hidden");
  aturTombolPause();
}

// ---------- Mulai bermain (dari layar pilih) ----------
function mulaiGameBaru() {
  sfxResume();
  resetArena({ skorBaru: true });
  statusGame = "main";
  pernahMain = true;
  sembunyiSemua();
  aturTombolPause();
}

// ---------- Game over: ulang dengan karakter SAMA ----------
function ulangDenganKarakter() {
  resetArena({ skorBaru: true });
  statusGame = "main";
  sembunyiSemua();
  aturTombolPause();
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
    cv.width = 48;
    cv.height = 48;
    const c = cv.getContext("2d");
    if (img && img.width) {
      const s = 48 / Math.max(img.width, img.height);
      const w = img.width * s;
      const h = img.height * s;
      // Perkecil → smoothing agar kartu tidak tampak pecah.
      c.imageSmoothingEnabled = s < 1;
      c.drawImage(img, (48 - w) / 2, (48 - h) / 2, w, h);
    } else {
      c.fillStyle = "#ff8844";
      c.fillRect(6, 6, 36, 36);
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