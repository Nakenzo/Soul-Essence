// ============================================================
// SAVE - simpan progres pemain + lapisan anti-manipulasi.
//
// CATATAN KEAMANAN: kode berjalan sepenuhnya di browser pemain, jadi
// "keamanan" di sini adalah lapisan yang menyulitkan (bukan menghentikan)
// orang yang mencoba membobol/mengedit save secara manual:
//   1. Payload disandikan (XOR bergulir + base64) — tidak terbaca biasa.
//   2. Signature/hash diverifikasi saat dimuat — payload yang diedit manual
//      gagal validasi dan di-reset, sehingga cheat "edit angka" tak bertahan.
//   3. Salinan cadangan tersimpan terpisah — bila satu rusak, dipakai yang lain.
//   4. Nilai di-clamp ke rentang masuk akal (versi, indeks level).
// Untuk keamanan absolut butuh server backend (di luar scope proyek ini).
// ============================================================

const SAVE_KUNCI = "soul-essence-progress";
const SAVE_KUNCI_BAK = "soul-essence-progress-bak";
const SAVE_SALT = 0x9e3779b9;   // seed XOR (jangan diubah sembarangan)
const SAVE_SALT2 = 0x85ebca6b;  // seed checksum
const SAVE_VERSI = 2;   // naik dari 1 (skor -> koin); v1 tetap dimigrasikan

// ---------- Sandi kecil (XOR aliran simetris) ----------
// Enkode & dekode memakai urutan kunci yang SAMA: kunci maju lewat CHAR
// PLAIN, jadi proses bolak-balik selalu identik.
function _xorChr(k, c) {
  return (k * 31 + c) >>> 0;
}

// Enkode: JSON -> XOR bergulir + base64 (hanya Latin-1, aman untuk btoa).
function saveEnkode(obj) {
  const json = JSON.stringify(obj);
  let k = SAVE_SALT, bs = "";
  for (let i = 0; i < json.length; i++) {
    const c = json.charCodeAt(i);
    bs += String.fromCharCode(c ^ (k & 0xff));
    k = _xorChr(k, c);
  }
  try { return btoa(bs); } catch (err) { return ""; }
}

function saveDekode(str) {
  try {
    const bs = atob(str);
    let k = SAVE_SALT, json = "";
    for (let i = 0; i < bs.length; i++) {
      const c = bs.charCodeAt(i) ^ (k & 0xff);
      json += String.fromCharCode(c);
      k = _xorChr(k, c);
    }
    return JSON.parse(json);
  } catch (err) { return null; }
}

// Checksum cepat (FNV-1a) atas JSON + salt -> dipakai sebagai signature.
function saveChecksum(obj) {
  const json = JSON.stringify(obj);
  let h = 0x811c9dc5;
  for (let i = 0; i < json.length; i++) {
    h ^= json.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  h ^= SAVE_SALT2;
  h = (h * 0x01000193) >>> 0;
  return h.toString(36) + "|" + json.length.toString(36);
}

// ---------- Bentuk default progres ----------
function progresBaru() {
  return {
    v: SAVE_VERSI,
    selesai: [],          // array indeks level yang sudah ditamatkan
    koinTertinggi: 0,     // koin terbanyak yang pernah dikumpulkan
    t: Date.now()
  };
}

// Dapatkan data progres; otomatis pulih kalau file rusak / diutak-atik.
function bacaProgres() {
  let terbaik = null;
  // Coba salinan utama lalu cadangan; yang valid dipakai.
  for (const kunci of [SAVE_KUNCI, SAVE_KUNCI_BAK]) {
    try {
      const raw = localStorage.getItem(kunci);
      if (!raw) continue;
      const box = saveDekode(raw);
      if (!box || typeof box !== "object") continue;
      if (box.sig !== saveChecksum(box.d)) continue; // dimanipulasi
      const d = box.d;
      if (d && (d.v === SAVE_VERSI || d.v === 1)) { terbaik = d; break; }
    } catch (err) { continue; }
  }
  // Normalisasi & clamp terhadap nilai liar.
  if (!terbaik) terbaik = progresBaru();
  const n = progresBaru();
  n.selesai = Array.isArray(terbaik.selesai)
    ? terbaik.selesai.filter((x) => Number.isInteger(x) && x >= 0)
    : [];
  // Migrasi v1 (skorTertinggi) -> v2 (koinTertinggi).
  const koin = Number.isFinite(terbaik.koinTertinggi)
    ? terbaik.koinTertinggi
    : terbaik.skorTertinggi;
  n.koinTertinggi = Number.isFinite(koin) ? Math.max(0, Math.floor(koin)) : 0;
  return n;
}

function saveTulis() {
  const d = {
    v: SAVE_VERSI,
    selesai: progres.selesai,
    koinTertinggi: progres.koinTertinggi,
    t: Date.now()
  };
  const box = { d: d, sig: saveChecksum(d) };
  const teks = saveEnkode(box);
  try {
    localStorage.setItem(SAVE_KUNCI, teks);
    localStorage.setItem(SAVE_KUNCI_BAK, teks); // salinan cadangan
  } catch (err) { /* penuh/tidak diizinkan — lewati */ }
}

// Variabel progres global (diduplikasi ke dalam save file).
let progres = bacaProgres();

// ---------- API untuk game ----------
// Apakah level (indeks DAFTAR_LEVEL) boleh dimainkan?
function apakahLevelTerbuka(idx) {
  if (!Number.isInteger(idx) || idx < 0) return false;
  if (idx === 0) return true;                       // level 1 selalu terbuka
  return progres.selesai.includes(idx - 1);         // tuntaskan level sebelumnya
}

// Tandai level selesai + catat koin tertinggi.
function tandaiLevelSelesai(idx, koin) {
  if (!Number.isInteger(idx) || idx < 0) return;
  if (!progres.selesai.includes(idx)) progres.selesai.push(idx);
  if (koin > 0) progres.koinTertinggi = Math.max(progres.koinTertinggi, Math.floor(koin));
  saveTulis();
}

// Update koin tertinggi (dari game over/menang) tanpa mengubah level.
function catatKoinTertinggi(koin) {
  if (Number.isFinite(koin) && koin > progres.koinTertinggi) {
    progres.koinTertinggi = Math.floor(koin);
    saveTulis();
  }
}

// Reset progres (pakai di konsol kalau mau mulai bersih).
function resetProgres() {
  progres = progresBaru();
  saveTulis();
}