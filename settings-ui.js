// =============================================================================
// UI layar SETTINGS: slider suara, saklar gameplay, dan daftar ikatan tombol.
//
// Volume TIDAK punya penyimpanan sendiri di sini; slider ini membaca dan
// menulis nilai yang sudah dikelola audio.js (_volUmum/_volSfx/_volMusik),
// jadi mengubah slider di layar Pause dan di layar Settings saling sinkron.
//
// Grup KONTROL hanya ditampilkan di perangkat non-sentuh (PC). Di HP/tablet
// gameplay-nya pakai joystick + tombol layar, jadi keybind tidak relevan.
// =============================================================================

function pesanPengaturan(teks, warna) {
  const el = document.getElementById("setPesan");
  if (!el) return;
  el.textContent = teks || "";
  el.className = "set-pesan" + (warna ? " " + warna : "");
}

// --------------------------------------------------------------- slider suara

function pasangSliderSetting(slId, nilId, ambil, setel) {
  const sl = document.getElementById(slId);
  if (!sl) return;
  const n = document.getElementById(nilId);
  const nilaiKePersen = () => Math.round(Math.max(0, Math.min(1, Number(ambil()) || 0)) * 100);
  sl.value = String(nilaiKePersen());
  if (n) n.textContent = String(nilaiKePersen());
  sl.addEventListener("input", () => {
    const v = Number(sl.value);
    setel(v / 100);
    if (n) n.textContent = sl.value;
  });
  sl.daftarSegarkan = () => {
    sl.value = String(nilaiKePersen());
    if (n) n.textContent = String(nilaiKePersen());
  };
}

function segarkanSliderSetting() {
  document.querySelectorAll(".set-slider").forEach((sl) => {
    if (typeof sl.daftarSegarkan === "function") sl.daftarSegarkan();
  });
}

// ------------------------------------------------------------------ saklar

function pasangSaklarSetting(tombolId, namaPreferensi) {
  const btn = document.getElementById(tombolId);
  if (!btn) return;
  btn.addEventListener("click", () => {
    const baru = !pengaturanAmbil(namaPreferensi);
    pengaturanUbah(namaPreferensi, baru);
    if (namaPreferensi === "layarPenuh") terapkanLayarPenuh();
    segarkanPengaturanUI();
    pesanPengaturan(namaPreferensi === "goyangKamera"
      ? (baru ? "Goyang kamera aktif." : "Goyang kamera dimatikan.")
      : (baru ? "Masuk layar penuh." : "Keluar layar penuh."), "ok");
  });
}

function segarkanSaklarSetting() {
  for (const pasangan of [
    ["setTambahGoyang", "goyangKamera"],
    ["setTambahPenuh", "layarPenuh"]
  ]) {
    const btn = document.getElementById(pasangan[0]);
    if (!btn) continue;
    const nyala = !!pengaturanAmbil(pasangan[1]);
    btn.setAttribute("aria-checked", nyala ? "true" : "false");
  }
}

// ------------------------------------------------------------- ikatan tombol

// PC = ada keyboard. Deteksi pragmatic: perangkat yang dipilih bukan "mobile".
function pakaiKeyboard() {
  return !(typeof deviceTerpilih === "string" && deviceTerpilih === "mobile");
}

function buatBarisIkatan(baris) {
  const wrap = document.createElement("div");
  wrap.className = "set-ikatan-baris";

  const nama = document.createElement("div");
  nama.className = "set-ikatan-nama";
  const teks = document.createElement("span");
  teks.className = "set-ikatan-nama-teks";
  teks.textContent = baris.label;
  const ket = document.createElement("span");
  ket.className = "set-ikatan-ket";
  ket.textContent = baris.ket;
  nama.appendChild(teks);
  nama.appendChild(ket);

  const tombol = document.createElement("button");
  tombol.type = "button";
  tombol.className = "set-ikatan-tombol";
  tombol.textContent = ikatanNamaTampil(pengaturanIkatan(baris.aksi));
  tombol.setAttribute("data-aksi", baris.aksi);
  tombol.addEventListener("click", () => mulaiTangkapIkatan(baris.aksi));

  wrap.appendChild(nama);
  wrap.appendChild(tombol);
  return wrap;
}

function pasangDaftarIkatan() {
  const wadah = document.getElementById("setDaftarIkatan");
  if (!wadah || typeof DAFTAR_AKSI === "undefined") return;
  wadah.innerHTML = "";
  for (const baris of DAFTAR_AKSI) {
    wadah.appendChild(buatBarisIkatan(baris));
  }
}

// Isi layar Settings bergantung perangkat: KONTROL (ikatan tombol keyboard)
// hanya untuk PC. Ini harus dihitung ULANG tiap kali layar dibuka, karena
// deviceTerpilih baru pasti setelah pemain memilih di layar awal, sedangkan
// pasangPengaturanUI() jalan sekali saat boot (sering sebelum pilihan device).
// Akibatnya materi bisa terbalik: HP masih kebagian daftar keyboard, atau PC
// kebagian layar tanpa daftar keyboard.
function terapkanGrupPerangkat() {
  const grup = document.getElementById("setGrupKontrol");
  if (!grup) return;
  const keyboard = pakaiKeyboard();
  // Bangun daftarnya hanya kalau grup baru saja ditampilkan lagi, supaya baris
  // yang sedang dipantau tombolnya tidak ikut dibuang saat segarkan biasa.
  const perluPasang = keyboard && grup.hidden;
  grup.hidden = !keyboard;
  if (perluPasang) pasangDaftarIkatan();
}

function segarkanDaftarIkatan() {
  // Waktu menunggu tombol, baris yang sedang dipantai diberi kelas "menunggu"
  // (berkedip di CSS). Jadi ini jangan dibatalkan saat sedangTangkap().
  const aksiAktif = (typeof aksiTangkap === "function") ? aksiTangkap() : "";
  document.querySelectorAll(".set-ikatan-tombol").forEach((tombol) => {
    const aksi = tombol.getAttribute("data-aksi");
    if (!aksi) return;
    const aktif = !!aksiAktif && aksi === aksiAktif;
    tombol.classList.toggle("menunggu", aktif);
    tombol.textContent = ikatanNamaTampil(pengaturanIkatan(aksi));
  });
}

function mulaiTangkapIkatan(aksi) {
  if (typeof tangkapMulai !== "function") return;
  tangkapMulai(aksi);
  segarkanDaftarIkatan();
  pesanPengaturan("Tekan tombol baru untuk " + aksi.toUpperCase() + " (Esc untuk batal).");
}

function batalTangkapIkatan(pesan) {
  if (typeof sedangTangkap === "function" && !sedangTangkap()) return;
  if (typeof tangkapSelesai === "function") tangkapSelesai();
  segarkanDaftarIkatan();
  pesanPengaturan(pesan || "");
}

// Satu listener global: selama menunggu tombol, tombol berikutnya yang ditekan
// dipakai untuk mengubah ikatan.
window.addEventListener("keydown", (e) => {
  if (typeof sedangTangkap !== "function" || !sedangTangkap()) return;
  const aksi = typeof aksiTangkap === "function" ? aksiTangkap() : "";
  if (!aksi) { batalTangkapIkatan(); return; }

  const k = String(e.key || "").toLowerCase();

  // Modifier sendiri tidak bisa jadi ikatan (dicatat di ikatanTombolDilarang).
  // Diamkan saja supaya Shift/Ctrl yang ditekan duluan tidak merusak tangkapan.
  if (k === "escape") {
    e.preventDefault();
    // Harus stopImmediatePropagation: stopPropagation biasa TIDAK mematikan
    // listener lain di node yang sama (window), jadi input.js tetap menerima
    // Escape dan menutup layar Settings. Di sini Escape hanya membatalkan
    // tangkapan.
    e.stopImmediatePropagation();
    batalTangkapIkatan("Batal. Tombol lama tetap dipakai.");
    return;
  }
  if (k === "shift" || k === "control" || k === "alt" || k === "meta") return;

  e.preventDefault();
  e.stopImmediatePropagation();

  const hasil = ikatanSetel(aksi, k);
  if (hasil && hasil.ok) {
    // Berhasil: tutup mode tangkap lalu segarkan.
    if (typeof tangkapSelesai === "function") tangkapSelesai();
    segarkanPengaturanUI();
    pesanPengaturan(aksi.toUpperCase() + " -> " + hasil.pesan, "ok");
  } else {
    // Gagal (tombol terlarang/bentrok): TETAP menunggu supaya pemain bisa
    // langsung menekan tombol lain tanpa harus klik barisnya lagi.
    segarkanPengaturanUI();
    pesanPengaturan(hasil && hasil.pesan ? hasil.pesan : "Tombol itu tidak bisa dipakai.", "galat");
  }
}, true);

// ------------------------------------------------------------------- tamper

function pasangResetIkatan() {
  const btn = document.getElementById("setResetIkatan");
  if (!btn) return;
  btn.addEventListener("click", () => {
    batalTangkapIkatan();
    if (typeof ikatanReset === "function") ikatanReset();
    segarkanPengaturanUI();
    pesanPengaturan("Ikatan tombol dikembalikan ke bawaan.", "ok");
  });
}

// ------------------------------------------------------------------ pasang

function segarkanPengaturanUI() {
  // Sebelum guard preferensi: materi perangkat harus selalu benar walaupun
  // penyimpanan pengaturan belum siap.
  terapkanGrupPerangkat();
  if (typeof pengaturanAmbil !== "function") return;
  segarkanSliderSetting();
  segarkanSaklarSetting();
  segarkanDaftarIkatan();
}

function pasangPengaturanUI() {
  if (typeof pengaturanMuat === "function") pengaturanMuat();

  // Slider suara: nilai disimpan audio.js, jadi slider cuma jembatan.
  // Dipakai typeof supaya aman kalau audio.js belum termuat.
  if (typeof ambilVolumeUmum === "function" && typeof aturVolumeUmum === "function") {
    pasangSliderSetting("setSlUmum", "setNilUmum", ambilVolumeUmum, aturVolumeUmum);
  }
  if (typeof ambilVolumeSfx === "function" && typeof aturVolumeSfx === "function") {
    pasangSliderSetting("setSlSfx", "setNilSfx", ambilVolumeSfx, aturVolumeSfx);
  }
  if (typeof ambilVolumeMusik === "function" && typeof aturVolumeMusik === "function") {
    pasangSliderSetting("setSlMusik", "setNilMusik", ambilVolumeMusik, aturVolumeMusik);
  }

  if (typeof pengaturanUbah === "function") {
    pasangSaklarSetting("setTambahGoyang", "goyangKamera");
    pasangSaklarSetting("setTambahPenuh", "layarPenuh");
  }
  pasangResetIkatan();

  // Grup kontrol hanya untuk perangkat berkeyboard. Dipanggil lewat satu
  // fungsi yang sama dengan yang dipakai tiap kali layar dibuka.
  terapkanGrupPerangkat();

  // Kalau slug masuk layar Settings, jangan biarkan tangkapan tombol menggantung.
  if (typeof batalTangkapIkatan === "function") batalTangkapIkatan();
  segarkanPengaturanUI();
}