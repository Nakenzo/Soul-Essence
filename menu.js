// ============================================================
// MENU - alur layar: Judul -> Pilih Karakter -> Game -> Game Over.
// Karakter terpilih dipakai sampai permainan berakhir (game over).
// ============================================================
const layarJudul = document.getElementById("layarJudul");
const layarPilih = document.getElementById("layarPilih");
const layarGameOver = document.getElementById("layarGameOver");
const layarPause = document.getElementById("layarPause");
const tombolPause = document.getElementById("tombolPause");
const daftarKarakter = document.getElementById("daftarKarakter");
const skorAkhirEl = document.getElementById("skorAkhir");
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
  skorAkhirEl.textContent = "SKOR: " + score;
  layarGameOver.classList.remove("hidden");
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
  document.getElementById("tombolMenu").addEventListener("click", tampilkanJudul);
  tombolPause.addEventListener("click", tampilkanPause);
  document.getElementById("tombolLanjut").addEventListener("click", lanjutDariPause);
  document.getElementById("tombolMenuPause").addEventListener("click", tampilkanJudul);
}

// ---------- Kartu karakter ----------
function buatPilihanKarakter() {
  daftarKarakter.innerHTML = "";

  KARAKTER.forEach((kar, idx) => {
    const img = tekstur[kar.kunci];
    const card = document.createElement("button");
    card.className = "kartu-karakter";

    const cv = document.createElement("canvas");
    cv.width = 96;
    cv.height = 96;
    const c = cv.getContext("2d");
    c.imageSmoothingEnabled = false;
    if (img && img.width) {
      const w = img.width * kar.skala * 1.5;
      const h = img.height * kar.skala * 1.5;
      c.drawImage(img, (96 - w) / 2, (96 - h) / 2, w, h);
    } else {
      c.fillStyle = "#ff8844";
      c.fillRect(24, 24, 48, 48);
    }
    card.appendChild(cv);

    const nama = document.createElement("div");
    nama.className = "nama-karakter";
    nama.textContent = (idx + 1) + ". " + kar.nama;
    const desk = document.createElement("div");
    desk.className = "desk-karakter";
    desk.textContent = kar.deskripsi;
    card.appendChild(nama);
    card.appendChild(desk);

    card.addEventListener("click", () => {
      karakter = kar;
      mulaiGameBaru();
    });

    daftarKarakter.appendChild(card);
  });
}