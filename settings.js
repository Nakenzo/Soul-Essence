// =============================================================================
// Pengaturan in-game (layar SETTINGS).
//
// Dua kelompok:
//   - Preferensi umum (goyang kamera, layar penuh) -> toggle boolean.
//   - Ikatan tombol (hanya PC) -> satu tombol per aksi.
//
// Volume TIDAK disimpan di sini: audio.js sudah punya penyimpanan sendiri di
// "soul-essence-volume" (_volUmum/_volSfx/_volMusik). Slider di layar Settings
// cuma membaca/menulis nilai yang sudah ada itu.
//
// Semua akses ke localStorage dibungkus try/catch supaya game tetap jalan
// kalau storage diblokir (mode privat, iframe, dst).
// =============================================================================

const PENGATURAN_KUNCI = "soul-essence-settings";

// Tombol bawaan. Nilai disimpan sebagai e.key.toLowerCase() supaya cocok dengan
// indeks objek `keys` di input.js.
const IKATAN_BAWAAN = {
  maju: "w",
  mundur: "s",
  kiri: "a",
  kanan: "d",
  jurus: "k",
  ultimate: "r"
};

// Urutan tampilan di UI + label tombolnya.
const DAFTAR_AKSI = [
  { aksi: "maju", label: "MAJU", ket: "ArrowUp tetap aktif sebagai cadangan" },
  { aksi: "mundur", label: "MUNDUR", ket: "ArrowDown tetap aktif sebagai cadangan" },
  { aksi: "kiri", label: "KIRI", ket: "ArrowLeft tetap aktif sebagai cadangan" },
  { aksi: "kanan", label: "KANAN", ket: "ArrowRight tetap aktif sebagai cadangan" },
  { aksi: "jurus", label: "JURUS", ket: "Skill karakter (Q tetap aktif)" },
  { aksi: "ultimate", label: "ULTIMATE", ket: "Jurus ultimate" }
];

// Tombol cadangan yang menempel tetap pada satu aksi dan tidak boleh dipakai
// aksi lain: Q = skill (disebut di karakter.js dan upgrades.js, "Q/K").
const IKATAN_Q_SKILL = "q";

// Tombol yang tidak boleh dipakai: dipakai game's menu sendiri, atau system's
// own shortcuts (F11/F12, modifier).
function ikatanTombolDilarang(k) {
  const s = String(k || "").toLowerCase();
  if (!s) return true;
  if (/^[0-9]$/.test(s)) return true;            // pilih karakter / level / kartu upgrade
  if (s === IKATAN_Q_SKILL) return true;         // cadangan skill (Q/K)
  if (s === "escape" || s === "enter" || s === "tab") return true;
  if (s === " " || s === "shift" || s === "control" || s === "alt" || s === "meta") return true;
  if (/^f([1-9]|1[0-2])$/.test(s)) return true;   // F11 fullscreen, F12 devtools, dst
  return false;
}

// Tombol yang boleh jadi ikatan: panjang satu karakter (e.key) atau nama
// panah. String acak dari storage yang rusak ("12", "banana") tidak lolos.
function ikatanSah(k) {
  const s = String(k || "");
  if (!s || ikatanTombolDilarang(s)) return false;
  if (s.length === 1) return true;
  return !!IKATAN_NAMA_TAMPIL[s.toLowerCase()];
}

// Teks yang tampil di tombol: "w" -> "W", "arrowup" -> "↑", " " -> "SPASI".
const IKATAN_NAMA_TAMPIL = {
  arrowup: "↑", arrowdown: "↓", arrowleft: "←", arrowright: "→",
  " ": "SPASI", escape: "ESC", enter: "ENTER", tab: "TAB",
  shift: "SHIFT", control: "CTRL", alt: "ALT", meta: "CMD"
};

function ikatanNamaTampil(k) {
  const s = String(k || "");
  if (!s) return "-";
  const kecil = s.toLowerCase();
  if (IKATAN_NAMA_TAMPIL[kecil]) return IKATAN_NAMA_TAMPIL[kecil];
  if (s.length === 1) return s.toUpperCase();
  return s.toUpperCase();
}

// ---------------------------------------------------------------- penyimpanan

function pengaturanBawaan() {
  return {
    goyangKamera: true,
    layarPenuh: false,
    ikatan: {
      maju: IKATAN_BAWAAN.maju,
      mundur: IKATAN_BAWAAN.mundur,
      kiri: IKATAN_BAWAAN.kiri,
      kanan: IKATAN_BAWAAN.kanan,
      jurus: IKATAN_BAWAAN.jurus,
      ultimate: IKATAN_BAWAAN.ultimate
    }
  };
}

// Pengaturan yang sudah dinormalisasi: tidak ada tombol terlarang, tidak ada
// tombol yang bentrok, semua tombol punya nilai. Nilai rusak dari storage
// diperbaiki diam-diam, bukan dipakai.
function pengaturanNormalkan(masuk) {
  const keluar = pengaturanBawaan();
  if (!masuk || typeof masuk !== "object") return keluar;

  if (typeof masuk.goyangKamera === "boolean") keluar.goyangKamera = masuk.goyangKamera;
  if (typeof masuk.layarPenuh === "boolean") keluar.layarPenuh = masuk.layarPenuh;

  const ikatanMasuk = masuk.ikatan;
  if (ikatanMasuk && typeof ikatanMasuk === "object") {
    const dipakai = {};
    for (const baris of DAFTAR_AKSI) {
      const k = String(ikatanMasuk[baris.aksi] || "").toLowerCase();
      if (!ikatanSah(k)) continue;   // rusak / terlarang / bentrok -> bawaan
      if (dipakai[k]) continue;
      keluar.ikatan[baris.aksi] = k;
      dipakai[k] = true;
    }
  }
  return keluar;
}

let pengaturanData = null;

function pengaturanMuat() {
  let mentah = null;
  try {
    mentah = JSON.parse(localStorage.getItem(PENGATURAN_KUNCI) || "null");
  } catch (err) { mentah = null; }
  pengaturanData = pengaturanNormalkan(mentah);
  return pengaturanData;
}

function pengaturanSimpan() {
  if (!pengaturanData) pengaturanData = pengaturanBawaan();
  try {
    localStorage.setItem(PENGATURAN_KUNCI, JSON.stringify(pengaturanData));
  } catch (err) { }
  return pengaturanData;
}

function pengaturanAmbil(nama) {
  if (!pengaturanData) pengaturanMuat();
  return pengaturanData ? pengaturanData[nama] : pengaturanBawaan()[nama];
}

function pengaturanUbah(nama, nilai) {
  if (!pengaturanData) pengaturanMuat();
  if (!pengaturanData || !(nama in pengaturanData)) return false;
  pengaturanData[nama] = nilai;
  pengaturanSimpan();
  return true;
}

// ------------------------------------------------------------------- ikatan

function pengaturanIkatan(aksi) {
  if (!pengaturanData) pengaturanMuat();
  const k = pengaturanData && pengaturanData.ikatan ? pengaturanData.ikatan[aksi] : "";
  return k || IKATAN_BAWAAN[aksi] || "";
}

// Aksi lain yang sudah memakai tombol ini ("" kalau belum dipakai).
function ikatanPemakai(kunci, kecualiAksi) {
  const k = String(kunci || "").toLowerCase();
  if (!k) return "";
  if (!pengaturanData) pengaturanMuat();
  const tabel = pengaturanData && pengaturanData.ikatan ? pengaturanData.ikatan : IKATAN_BAWAAN;
  for (const aksi of Object.keys(tabel)) {
    if (aksi === kecualiAksi) continue;
    if (tabel[aksi] === k) return aksi;
  }
  return "";
}

// Ganti tombol satu aksi. Balas { ok, pesan }.
function ikatanSetel(aksi, kunci) {
  const k = String(kunci || "").toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(IKATAN_BAWAAN, aksi)) {
    return { ok: false, pesan: "Aksi tidak dikenal." };
  }
  if (k === IKATAN_Q_SKILL) {
    return { ok: false, pesan: "Tombol Q tetap cadangan skill (Q/K)." };
  }
  if (!ikatanSah(k)) {
    return { ok: false, pesan: "Tombol itu dipakai menu game, tidak bisa dipakai." };
  }
  const milikLain = ikatanPemakai(k, aksi);
  if (milikLain) {
    return { ok: false, pesan: "Tombol itu sudah dipakai: " + ikatanNamaTampil(k) + "." };
  }
  if (!pengaturanData) pengaturanMuat();
  pengaturanData.ikatan[aksi] = k;
  pengaturanSimpan();
  return { ok: true, pesan: ikatanNamaTampil(k) };
}

function ikatanReset() {
  if (!pengaturanData) pengaturanMuat();
  pengaturanData.ikatan = pengaturanBawaan().ikatan;
  pengaturanSimpan();
  return pengaturanData.ikatan;
}

// -------------------------------------------------------------- mode tangkap

// Saat sedang menunggu tombol baru, input.js harus berhenti memproses semua
// tombol supaya "w" yang ditekan buat mengubah ikatan tidak sekaligus
// menggerakkan karakter.
let sedangTangkapIkatan = null;

function tangkapMulai(aksi) {
  sedangTangkapIkatan = aksi;
}

function tangkapSelesai() {
  sedangTangkapIkatan = null;
}

function sedangTangkap() {
  return !!sedangTangkapIkatan;
}

// Aksi yang sedang menunggu tombol ("" kalau tidak ada).
function aksiTangkap() {
  return sedangTangkapIkatan || "";
}

// --------------------------------------------------------------- layar penuh

// Fullscreen hanya bisa dipicu dari klik (kebijakan browser). Status dibaca dari
// document, bukan dari preferensi, supaya tetap akurat kalau user pakai F11 atau
// keluar lewat Esc.
function layarPenuhAktif() {
  try {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) return false;
  } catch (err) { }
  return true;
}

function layarPenuhMasuk() {
  const el = document.documentElement;
  try {
    if (!el.requestFullscreen && !el.webkitRequestFullscreen) return false;
  } catch (err) { return false; }
  try {
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    const hasil = req.call(el);
    if (hasil && typeof hasil.catch === "function") hasil.catch(() => { });
  } catch (err) { return false; }
  return true;
}

function layarPenuhKeluar() {
  try {
    if (document.exitFullscreen) {
      const hasil = document.exitFullscreen();
      if (hasil && typeof hasil.catch === "function") hasil.catch(() => { });
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  } catch (err) { }
}

// Terapkan preferensi: masuk fullscreen kalau diminta, keluar kalau tidak.
function terapkanLayarPenuh() {
  const mau = !!pengaturanAmbil("layarPenuh");
  if (mau && !layarPenuhAktif()) layarPenuhMasuk();
  else if (!mau && layarPenuhAktif()) layarPenuhKeluar();
}

// Boot: baca storage sekali, lalu sinkronkan preferensi fullscreen dengan
// kenyataan. Browser selalu keluar fullscreen saat reload, jadi kalau
// preferensinya masih true padahal layarnya sudah biasa, tombol di Settings
// akan terlihat menyala padahal tidak sesuai.
function pengaturanSiapkan() {
  pengaturanMuat();
  try {
    const nyata = layarPenuhAktif();
    if (pengaturanAmbil("layarPenuh") !== nyata) pengaturanUbah("layarPenuh", nyata);
  } catch (err) { }
  try {
    document.addEventListener("fullscreenchange", function () {
      // Status fullscreen bisa berubah dari luar (F11, Esc). Samakan preferensi
      // supaya tombol toggle di Settings tetap sesuai kenyataan.
      if (sedangTangkap()) return;
      const nyata = layarPenuhAktif();
      if (pengaturanAmbil("layarPenuh") !== nyata) pengaturanUbah("layarPenuh", nyata);
      if (typeof segarkanPengaturanUI === "function") segarkanPengaturanUI();
    });
  } catch (err) { }
}