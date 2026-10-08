// =============================================================================
// Tahap 2: akun opsional + sinkron progres ke server (Supabase).
//
// Semua kode di file ini NON-AKTIF sampai AKUN_KONFIG diisi (aktif: true).
// Kalau belum aktif: tidak ada request jaringan, tidak ada CDN yang dimuat,
// game tetap 100% lokal seperti sekarang.
// =============================================================================

let akunPustakaDimuat = false;
let akunPustakaJanji = null;
let akunKlien = null;
let akunUid = null;
let akunEmail = null;   // email di Supabase Auth = Gmail (identitas server)
let akunNama = null;    // username, dipakai untuk masuk ke game
let akunGmail = null;   // Gmail milik pemain, tujuan cadangan data
let akunProfilTunda = null; // { nama, gmail } saat daftar menunggu konfirmasi email
let akunSiapJanji = null;

// Status: "tamu" | "sinkron" | "menunggu" | "offline" | "gagal"
let akunStatus = "tamu";
let akunPesan = "";
let akunJadwal = null;
let akunUnggahTertunda = false;
let akunTahanJadwal = false;

// Jarak waktu (detik) yang dianggap "sama" supaya tidak bolak-balik menimpa.
const AKUN_TOLERANSI_DETIK = 5;

// -----------------------------------------------------------------------------
// Config + pemuatan pustaka
// -----------------------------------------------------------------------------

function akunAktif() {
  try {
    const k = typeof AKUN_KONFIG !== "undefined" ? AKUN_KONFIG : null;
    return !!(k && k.aktif && k.url && k.anonKey);
  } catch (err) {
    return false;
  }
}

function akunMuatPustaka() {
  if (typeof supabase !== "undefined") {
    akunPustakaDimuat = true;
    return Promise.resolve(true);
  }
  if (akunPustakaJanji) return akunPustakaJanji;
  if (!akunAktif()) return Promise.resolve(false);
  const k = AKUN_KONFIG;
  akunPustakaJanji = new Promise((selesai) => {
    try {
      const s = document.createElement("script");
      s.src = k.cdnSupabase;
      s.async = true;
      s.onload = () => {
        akunPustakaDimuat = true;
        selesai(true);
      };
      s.onerror = () => {
        akunPustakaJanji = null;
        selesai(false);
      };
      document.head.appendChild(s);
    } catch (err) {
      akunPustakaJanji = null;
      selesai(false);
    }
  });
  return akunPustakaJanji;
}

// Dipanggil sekali saat start. Aman dipanggil berkali-kali.
function akunSiapkan() {
  if (!akunAktif()) {
    akunStatus = "tamu";
    return Promise.resolve(false);
  }
  if (akunSiapJanji) return akunSiapJanji;
  akunSiapJanji = new Promise((selesai) => {
    akunMuatPustaka().then((ok) => {
      if (!ok || typeof supabase === "undefined") {
        akunStatus = "offline";
        akunPesan = "Gagal memuat pustaka akun (offline?)";
        selesai(false);
        return;
      }
      try {
        akunKlien = supabase.createClient(AKUN_KONFIG.url, AKUN_KONFIG.anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false
          }
        });
        akunKlien.auth.onAuthStateChange((_acara, sesi) => {
          if (sesi && sesi.user) {
            akunUid = sesi.user.id;
            akunEmail = sesi.user.email || null;
            if (akunStatus === "tamu" || akunStatus === "offline") {
              akunStatus = "sinkron";
              akunPesan = "";
            }
            akunMuatProfil();
            akunSegeraSinkron();
          } else {
            akunUid = null;
            akunEmail = null;
            akunNama = null;
            akunGmail = null;
            if (akunStatus !== "menunggu") {
              akunStatus = "tamu";
              akunPesan = "";
            }
            akunBatalkanJadwal();
            if (typeof akunPerbaruiUI === "function") akunPerbaruiUI();
          }
        });
        selesai(true);
      } catch (err) {
        akunStatus = "offline";
        akunPesan = "Config akun tidak bisa dipakai";
        selesai(false);
      }
    });
  });
  return akunSiapJanji;
}

function akunAktifDipakai() {
  return akunAktif() && !!akunKlien;
}

// -----------------------------------------------------------------------------
// Daftar / masuk / keluar
//
// Bentuknya seperti Roblox: pendaftaran minta USERNAME + SANDI + GMAIL,
// login cukup USERNAME + SANDI.
//
// Supabase Auth selalu memakai email, jadi di server email = Gmail pemain
// (Gmail itulah yang menampung cadangan progres). Username disimpan di tabel
// public.profiles dan dipakai sebagai kunci login -- untuk itu ada fungsi
// akun_email_dari_username() di sql/supabase.sql.
// -----------------------------------------------------------------------------

function akunValidasiEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || "").trim());
}

function akunValidasiNama(nama) {
  const n = String(nama || "").trim();
  if (n.length < 3 || n.length > 20) return "Username 3-20 karakter";
  if (!/^[A-Za-z0-9_.]+$/.test(n)) return "Username hanya boleh huruf, angka, _ atau .";
  return "";
}

function akunValidasiGmail(gmail) {
  const g = String(gmail || "").trim().toLowerCase();
  if (!akunValidasiEmail(g)) return "Gmail tidak valid";
  if (!/@(gmail|googlemail)\.com$/.test(g)) return "Harus Gmail, contoh: nama@gmail.com";
  return "";
}

function akunRpc(fungsi, argumen) {
  if (!akunAktifDipakai()) return Promise.reject({ pesan: "Fitur akun belum aktif" });
  return akunKlien.rpc(fungsi, argumen).then((r) => {
    if (r && r.error) throw r.error;
    return r ? r.data : null;
  });
}

function akunUsernameDipakai(nama) {
  return akunRpc("akun_username_terpakai", { p_username: String(nama || "").trim() })
    .then((d) => !!d);
}

// Balikkan { ok, email } atau { ok: false, pesan }.
function akunEmailDariUsername(nama) {
  return akunRpc("akun_email_dari_username", { p_username: String(nama || "").trim() })
    .then((d) => ({ ok: true, email: d || null }))
    .catch((err) => ({
      ok: false,
      pesan: akunPesanDariSupabase(err, "Server akun belum siap. Jalankan sql/supabase.sql dulu.")
    }));
}

function akunSimpanProfil(nama, gmail) {
  if (!akunAktifDipakai() || !akunUid) return Promise.resolve(false);
  const n = String(nama || "").trim();
  const g = String(gmail || "").trim().toLowerCase();
  if (!n) return Promise.resolve(false);
  return akunKlien
    .from("profiles")
    .upsert({ user_id: akunUid, username: n, gmail: g }, { onConflict: "user_id" })
    .then((r) => !(r && r.error))
    .catch(() => false);
}

function akunAmbilProfil() {
  if (!akunAktifDipakai() || !akunUid) return Promise.resolve(null);
  return akunKlien
    .from("profiles")
    .select("username, gmail")
    .eq("user_id", akunUid)
    .maybeSingle()
    .then((r) => (r && !r.error ? r.data || null : null))
    .catch(() => null);
}

// Isi akunNama/akunGmail dari server. Kalau baris profil belum ada (akun lama
// atau daftar tadi tertunda), buat pakai data yang ada di perangkat ini.
function akunMuatProfil(namaCadangan) {
  if (!akunAktifDipakai() || !akunUid) {
    if (typeof akunPerbaruiUI === "function") akunPerbaruiUI();
    return Promise.resolve(null);
  }
  return akunAmbilProfil().then((p) => {
    if (p && p.username) {
      akunNama = p.username;
      akunGmail = p.gmail || akunEmail || null;
      if (typeof akunPerbaruiUI === "function") akunPerbaruiUI();
      return p;
    }
    const tunda = akunProfilTunda;
    akunProfilTunda = null;
    const sumber = (tunda && tunda.nama) || namaCadangan || akunNama || akunEmail || "pemain";
    const dasar = String(sumber)
      .split("@")[0]
      .replace(/[^A-Za-z0-9_.]/g, "")
      .slice(0, 20);
    const awal = dasar.length >= 3 ? dasar : (dasar + "pemain").slice(0, 20);
    const gmail = (tunda && tunda.gmail) || akunGmail || akunEmail || "";
    return akunSimpanProfil(awal, gmail).then((ok) => {
      if (ok) {
        akunNama = awal;
        akunGmail = gmail;
      } else {
        // Hampir pasti username sudah dipakai: coba sekali dengan sufiks angka.
        const alternatif = (awal + Math.floor(Math.random() * 90 + 10)).slice(0, 20);
        return akunSimpanProfil(alternatif, gmail).then((ok2) => {
          if (ok2) {
            akunNama = alternatif;
            akunGmail = gmail;
          }
          if (typeof akunPerbaruiUI === "function") akunPerbaruiUI();
          return ok2 ? { username: alternatif, gmail } : null;
        });
      }
      if (typeof akunPerbaruiUI === "function") akunPerbaruiUI();
      return { username: awal, gmail };
    });
  });
}

function akunBuat(nama, sandi, gmail) {
  if (!akunAktifDipakai()) return Promise.resolve({ ok: false, pesan: "Fitur akun belum aktif" });
  const n = String(nama || "").trim();
  const g = String(gmail || "").trim().toLowerCase();
  const p = String(sandi || "");
  const salahNama = akunValidasiNama(n);
  if (salahNama) return Promise.resolve({ ok: false, pesan: salahNama });
  const salahGmail = akunValidasiGmail(g);
  if (salahGmail) return Promise.resolve({ ok: false, pesan: salahGmail });
  if (p.length < 8) return Promise.resolve({ ok: false, pesan: "Sandi minimal 8 karakter" });

  akunStatus = "menunggu";
  if (typeof akunPerbaruiUI === "function") akunPerbaruiUI();

  return akunUsernameDipakai(n)
    .catch(() => false)
    .then((terpakai) => {
      if (terpakai) {
        akunStatus = "tamu";
        if (typeof akunPerbaruiUI === "function") akunPerbaruiUI();
        return { ok: false, pesan: "Username sudah dipakai" };
      }
      return akunKlien.auth.signUp({ email: g, password: p }).then((r) => {
        if (r && r.error) {
          akunStatus = "tamu";
          if (typeof akunPerbaruiUI === "function") akunPerbaruiUI();
          return { ok: false, pesan: akunPesanDariSupabase(r.error, "Gagal membuat akun") };
        }
        const sesi = r && r.data ? r.data.session : null;
        if (!sesi) {
          // Project mewajibkan konfirmasi email, jadi baris profil dibuat
          // nanti setelah pemain masuk.
          akunProfilTunda = { nama: n, gmail: g };
          akunStatus = "tamu";
          if (typeof akunPerbaruiUI === "function") akunPerbaruiUI();
          return {
            ok: false,
            pesan: "Akun dibuat. Cek Gmail " + g + ", klik link konfirmasinya, lalu masuk."
          };
        }
        akunUid = sesi.user.id;
        akunEmail = sesi.user.email || g;
        akunNama = n;
        akunGmail = g;
        return akunSimpanProfil(n, g).then((ok) => {
          if (!ok) {
            // Username keburu dipakai, atau tabel profiles belum dibuat.
            return akunUsernameDipakai(n)
              .catch(() => false)
              .then((masih) => akunKeluar().then(() => ({
                ok: false,
                pesan: masih
                  ? "Username sudah dipakai"
                  : "Server akun belum siap. Jalankan file sql/supabase.sql dulu."
              })));
          }
          akunStatus = "sinkron";
          akunPesan = "";
          if (typeof akunPerbaruiUI === "function") akunPerbaruiUI();
          return { ok: true, uid: akunUid, nama: akunNama, gmail: akunGmail };
        });
      });
    })
    .catch((err) => {
      akunStatus = "tamu";
      if (typeof akunPerbaruiUI === "function") akunPerbaruiUI();
      return { ok: false, pesan: akunPesanDariSupabase(err, "Gagal membuat akun") };
    });
}

// Terima username ATAU Gmail (Gmail tetap bisa dipakai, mis. akun lama).
function akunMasuk(nama, sandi) {
  if (!akunAktifDipakai()) return Promise.resolve({ ok: false, pesan: "Fitur akun belum aktif" });
  const m = String(nama || "").trim();
  const p = String(sandi || "");
  if (!m) return Promise.resolve({ ok: false, pesan: "Username kosong" });
  if (!p) return Promise.resolve({ ok: false, pesan: "Sandi kosong" });

  akunStatus = "menunggu";
  if (typeof akunPerbaruiUI === "function") akunPerbaruiUI();

  const lewatGmail = akunValidasiEmail(m);
  const cari = lewatGmail
    ? Promise.resolve({ ok: true, email: m.toLowerCase() })
    : akunEmailDariUsername(m);

  return cari
    .then((h) => {
      if (!h.ok) {
        akunStatus = "tamu";
        if (typeof akunPerbaruiUI === "function") akunPerbaruiUI();
        return { ok: false, pesan: h.pesan };
      }
      if (!h.email) {
        akunStatus = "tamu";
        if (typeof akunPerbaruiUI === "function") akunPerbaruiUI();
        return { ok: false, pesan: "Username belum terdaftar" };
      }
      return akunKlien.auth
        .signInWithPassword({ email: h.email, password: p })
        .then((r) => {
          if (r && r.error) {
            akunStatus = "tamu";
            if (typeof akunPerbaruiUI === "function") akunPerbaruiUI();
            return { ok: false, pesan: akunPesanDariSupabase(r.error, "Username atau sandi salah") };
          }
          const sesi = r && r.data ? r.data.session : null;
          if (!sesi) {
            akunStatus = "tamu";
            if (typeof akunPerbaruiUI === "function") akunPerbaruiUI();
            return { ok: false, pesan: "Gagal masuk" };
          }
          akunUid = sesi.user.id;
          akunEmail = sesi.user.email || h.email;
          akunNama = lewatGmail ? null : m;
          akunGmail = lewatGmail ? m.toLowerCase() : null;
          akunStatus = "sinkron";
          akunPesan = "";
          return akunMuatProfil(lewatGmail ? null : m).then(() => {
            if (typeof akunPerbaruiUI === "function") akunPerbaruiUI();
            return { ok: true, uid: akunUid, nama: akunNama, gmail: akunGmail || akunEmail };
          });
        });
    })
    .catch((err) => {
      akunStatus = "tamu";
      if (typeof akunPerbaruiUI === "function") akunPerbaruiUI();
      return { ok: false, pesan: akunPesanDariSupabase(err, "Gagal masuk") };
    });
}

function akunKeluar() {
  akunBatalkanJadwal();
  if (!akunAktifDipakai()) return Promise.resolve({ ok: true });
  return akunKlien.auth
    .signOut()
    .then(() => {
      akunUid = null;
      akunEmail = null;
      akunNama = null;
      akunGmail = null;
      akunStatus = "tamu";
      akunPesan = "";
      if (typeof akunPerbaruiUI === "function") akunPerbaruiUI();
      return { ok: true };
    })
    .catch(() => {
      akunUid = null;
      akunEmail = null;
      akunNama = null;
      akunGmail = null;
      akunStatus = "tamu";
      if (typeof akunPerbaruiUI === "function") akunPerbaruiUI();
      return { ok: true };
    });
}

function akunPesanDariSupabase(err, bawaan) {
  if (!err) return bawaan;
  const pesan = String(err.message || err);
  if (/invalid login credentials/i.test(pesan)) return "Username atau sandi salah";
  if (/already registered|already exists/i.test(pesan)) return "Gmail itu sudah terdaftar";
  if (/password should be at least/i.test(pesan)) return "Sandi minimal 8 karakter";
  if (/email not confirmed/i.test(pesan)) return "Konfirmasi email dulu di inbox Gmail";
  if (/rate limit|too many/i.test(pesan)) return "Terlalu sering coba. Tunggu sebentar.";
  if (/relation .* does not exist|could not find the function/i.test(pesan)) {
    return "Server akun belum siap. Jalankan file sql/supabase.sql dulu.";
  }
  if (/fetch|network|Failed to fetch/i.test(pesan)) return "Tidak ada koneksi";
  return bawaan;
}

function akunInfo() {
  return {
    aktif: akunAktif(),
    masuk: !!akunUid,
    uid: akunUid,
    nama: akunNama,
    gmail: akunGmail || akunEmail,
    email: akunEmail,
    status: akunStatus,
    pesan: akunPesan
  };
}

// -----------------------------------------------------------------------------
// Aturan main: gabung progres + putuskan sinkron (fungsi murni, mudah diuji)
// -----------------------------------------------------------------------------

function akunNomorAngka(n) {
  const v = Number(n);
  return Number.isFinite(v) && v > 0 ? v : 0;
}

// Gabung dua progres: level/bos union, angka & level karakter max (bukan jumlah,
// supaya tidak bisa diduplikasi dengan masuk-ulang), artefak max per kunci.
function gabungProgres(a, b) {
  const kiri = a && typeof a === "object" ? a : {};
  const kanan = b && typeof b === "object" ? b : {};

  const gabungAngka = (x, y) => {
    const set = new Set();
    for (const v of Array.isArray(x) ? x : []) {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) set.add(Math.floor(n));
    }
    for (const v of Array.isArray(y) ? y : []) {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) set.add(Math.floor(n));
    }
    return Array.from(set).sort((a2, b2) => a2 - b2);
  };

  // bosKalah berisi string kunci bos (mis. "bos-4"), bukan angka.
  const gabungKunci = (x, y) => {
    const set = new Set();
    for (const v of Array.isArray(x) ? x : []) {
      const s = String(v || "").trim();
      if (s && s.length <= 40) set.add(s);
    }
    for (const v of Array.isArray(y) ? y : []) {
      const s = String(v || "").trim();
      if (s && s.length <= 40) set.add(s);
    }
    return Array.from(set).slice(0, 50);
  };

  const gabungTinggiPerKunci = (x, y) => {
    const keluar = {};
    for (const sumber of [x, y]) {
      if (!sumber || typeof sumber !== "object") continue;
      for (const kunci of Object.keys(sumber)) {
        const nilai = akunNomorAngka(sumber[kunci]);
        if (nilai <= 0) continue;
        keluar[kunci] = Math.max(keluar[kunci] || 0, nilai);
      }
    }
    return keluar;
  };

  const artefakMilik = gabungTinggiPerKunci(kiri.artefakMilik, kanan.artefakMilik);
  const artefakBintang = gabungTinggiPerKunci(kiri.artefakBintang, kanan.artefakBintang);
  const levelKarakter = gabungTinggiPerKunci(kiri.levelKarakter, kanan.levelKarakter);

  // Substat artefak: ambil yang lebih tinggi per artefak per stat. Hanya stat
  // yang memang dikenal game (ARTEFAK_STAT_DAERAH) yang diteruskan; daftar
  // takenya diambil dari config kalau sudah termuat.
  const statDikenal = typeof ARTEFAK_STAT_DAERAH !== "undefined"
    ? ARTEFAK_STAT_DAERAH
    : ["hp", "damage", "kecepatan"];
  const artefakSubstat = {};
  const kumpulkan = (sumber) => {
    if (!sumber || typeof sumber !== "object") return;
    for (const artefak of Object.keys(sumber)) {
      const isi = sumber[artefak];
      if (!isi || typeof isi !== "object") continue;
      for (const stat of statDikenal) {
        const nilai = akunNomorAngka(isi[stat]);
        if (nilai <= 0) continue;
        if (!artefakSubstat[artefak]) artefakSubstat[artefak] = {};
        artefakSubstat[artefak][stat] = Math.max(artefakSubstat[artefak][stat] || 0, nilai);
      }
    }
  };
  kumpulkan(kiri.artefakSubstat);
  kumpulkan(kanan.artefakSubstat);

  // Artefak yang dipakai: { karakter: { slot: artefakId } }. Union per slot,
  // tapi hanya kalau artefak itu benar-benar dimiliki hasil gabungan.
  const artefakPakai = {};
  for (const sumber of [kiri, kanan]) {
    const pakai = sumber && sumber.artefakPakai;
    if (!pakai || typeof pakai !== "object") continue;
    for (const kar of Object.keys(pakai)) {
      const isi = pakai[kar];
      if (!isi || typeof isi !== "object") continue;
      if (!artefakPakai[kar]) artefakPakai[kar] = {};
      for (const slot of Object.keys(isi)) {
        const id = String(isi[slot] || "").trim();
        if (!id) continue;
        if (!artefakPakai[kar][slot]) artefakPakai[kar][slot] = id;
      }
    }
  }
  // Buang rujukan ke artefak yang tidak dimiliki (bisa terjadi kalau satu sisi
  // punya slot terisi tapi artefaknya tidak ada di sisi itu).
  for (const kar of Object.keys(artefakPakai)) {
    for (const slot of Object.keys(artefakPakai[kar])) {
      const id = artefakPakai[kar][slot];
      if (!artefakMilik[id]) delete artefakPakai[kar][slot];
    }
    if (Object.keys(artefakPakai[kar]).length === 0) delete artefakPakai[kar];
  }

  const skillPakai =
    (kiri.skillPakai && typeof kiri.skillPakai === "object" && kiri.skillPakai.kunci)
      ? kiri.skillPakai
      : (kanan.skillPakai && typeof kanan.skillPakai === "object" ? kanan.skillPakai : null);

  const hasil = {
    v: 3,
    t: Date.now(),
    koinTertinggi: Math.max(akunNomorAngka(kiri.koinTertinggi), akunNomorAngka(kanan.koinTertinggi)),
    koinSaldo: Math.max(akunNomorAngka(kiri.koinSaldo), akunNomorAngka(kanan.koinSaldo)),
    selesai: gabungAngka(kiri.selesai, kanan.selesai),
    bosKalah: gabungKunci(kiri.bosKalah, kanan.bosKalah),
    levelKarakter: levelKarakter,
    skillPakai: skillPakai,
    artefakMilik: artefakMilik,
    artefakBintang: artefakBintang,
    artefakSubstat: artefakSubstat,
    artefakPakai: artefakPakai
  };

  return typeof bersihkanProgres === "function" ? bersihkanProgres(hasil) : hasil;
}

// Pilih sisi yang menang berdasarkan timestamp. Default: lokal menang, karena
// itu yang sedang dimainkan; server baru dipakai kalau jelas lebih baru.
function putuskanSinkron(tLokal, tServer) {
  const l = Number(tLokal) || 0;
  const s = Number(tServer) || 0;
  if (s <= 0) return "unggah";
  if (l <= 0) return "unduh";
  if ((s - l) / 1000 > AKUN_TOLERANSI_DETIK) return "unduh";
  return "unggah";
}

// -----------------------------------------------------------------------------
// Baca / tulis baris save di server
// -----------------------------------------------------------------------------

function akunAmbilServer() {
  const tabel = akunTabel();
  return akunKlien
    .from(tabel)
    .select("kode, versi, updated_at")
    .eq("user_id", akunUid)
    .maybeSingle()
    .then((r) => {
      if (r && r.error) throw r.error;
      return r && r.data ? r.data : null;
    });
}

function akunTulisServer(kode, versi) {
  const tabel = akunTabel();
  return akunKlien
    .from(tabel)
    .upsert({
      user_id: akunUid,
      kode: kode,
      versi: typeof versi === "number" ? versi : 3,
      updated_at: new Date().toISOString()
    })
    .then((r) => {
      if (r && r.error) throw r.error;
      return r && r.data ? r.data : null;
    });
}

function akunTabel() {
  const k = typeof AKUN_KONFIG !== "undefined" ? AKUN_KONFIG : null;
  return (k && k.namaTabel) || "saves";
}

// Tekan lokal ke server dengan proteksi bentrok: baca updated_at dulu, lalu
// tulis hanya kalau baris itu masih milik snapshot kita.
function akunUnggahSekarang() {
  if (!akunUid || !akunAktifDipakai()) return Promise.resolve({ ok: false, alasan: "tamu" });
  if (typeof saveKode !== "function") return Promise.resolve({ ok: false, alasan: "nokal" });
  const kode = saveKode();
  if (!kode) return Promise.resolve({ ok: false, alasan: "kosong" });
  const tLokal = (typeof progres === "object" && progres && Number(progres.t)) || Date.now();
  akunStatus = "menunggu";
  if (typeof akunPerbaruiUI === "function") akunPerbaruiUI();
  return akunAmbilServer()
    .then((baris) => {
      const tServer = baris && baris.updated_at ? Date.parse(baris.updated_at) : 0;
      if (baris && tServer > tLokal + AKUN_TOLERANSI_DETIK * 1000) {
        // Server lebih baru: jangan ditimpa, ambil sisi server.
        return { ok: false, alasan: "server-lebih-baru", baris: baris };
      }
      return akunTulisServer(kode, 3).then(() => ({ ok: true, baris: baris }));
    })
    .then((hasil) => {
      if (hasil && hasil.baris && hasil.alasan === "server-lebih-baru") {
        return akunTarik({ sejarah: false }).then(() => ({ ok: false, alasan: "server-lebih-baru" }));
      }
      akunStatus = "sinkron";
      akunPesan = "";
      if (typeof akunPerbaruiUI === "function") akunPerbaruiUI();
      return hasil;
    })
    .catch((err) => {
      akunStatus = "offline";
      akunPesan = "Gagal menyimpan ke server (progres lokal tetap aman)";
      if (typeof akunPerbaruiUI === "function") akunPerbaruiUI();
      return { ok: false, alasan: "jaringan", pesan: akunPesanDariSupabase(err, akunPesan) };
    });
}

// Tarik baris server ke lokal (dipakai saat login & saat server lebih baru).
// Versi server lama disimpan ke riwayat otomatis sebelum ditimpa.
function akunTarik(opsi) {
  const denganSejarah = !opsi || opsi.sejarah !== false;
  if (!akunUid || !akunAktifDipakai()) return Promise.resolve({ ok: false });
  if (typeof bersihkanProgres !== "function" || typeof saveKodeValid !== "function") {
    return Promise.resolve({ ok: false });
  }
  return akunAmbilServer().then((baris) => {
    if (!baris) return { ok: false, alasan: "kosong" };
    // saveKodeValid() mengembalikan objek progres itu sendiri.
    const serverProgres = bersihkanProgres(saveKodeValid(baris.kode));
    if (!serverProgres) return { ok: false, alasan: "kode-rusak" };
    if (denganSejarah && typeof saveRotasiOtomatis === "function") {
      try {
        saveRotasiOtomatis(saveKode());
      } catch (err) {}
    }
    if (typeof saveGantiProgres === "function") {
      saveGantiProgres(serverProgres);
    } else if (typeof progres !== "undefined") {
      progres = bersihkanProgres(serverProgres);
    }
    akunStatus = "sinkron";
    if (typeof akunPerbaruiUI === "function") akunPerbaruiUI();
    return { ok: true, progres: serverProgres };
  });
}

// Saat baru masuk / baru daftar: kalau server sudah punya isi, gabung dengan
// lokal. Kalau server kosong, unggah lokal (jalur "klaim" progres tamu).
// Didedupe supaya event sesi + UI tidak menjalankan sinkron dua kali bersamaan.
let akunSinkronBerjalan = null;
function akunSinkronAwal() {
  if (akunSinkronBerjalan) return akunSinkronBerjalan;
  akunSinkronBerjalan = akunSinkronJalan().then((hasil) => {
    akunSinkronBerjalan = null;
    return hasil;
  }, (err) => {
    akunSinkronBerjalan = null;
    throw err;
  });
  return akunSinkronBerjalan;
}

function akunSinkronJalan() {
  if (!akunUid || !akunAktifDipakai()) return Promise.resolve({ ok: false, alasan: "tamu" });
  const lokal = (typeof progres === "object" && progres) || (typeof bacaProgres === "function" ? bacaProgres() : null);
  return akunAmbilServer().then((baris) => {
    if (!baris) {
      // Server kosong: kirim progres lokal sebagai klaim.
      return akunUnggahSekarang().then(() => ({ ok: true, aksi: "klaim" }));
    }
    // saveKodeValid() mengembalikan objek progres itu sendiri (bukan dibungkus).
    const serverProgres = bersihkanProgres(saveKodeValid(baris.kode));
    if (!serverProgres) {
      // Kode server tidak bisa dibaca: perlakukan sebagai klaim, jangan gagal.
      return akunUnggahSekarang().then(() => ({ ok: true, aksi: "klaim" }));
    }
    const tLokal = Number(lokal && lokal.t) || 0;
    const tServer = baris.updated_at ? Date.parse(baris.updated_at) : 0;
    const sisi = putuskanSinkron(tLokal, tServer);
    if (sisi === "unduh") {
      return akunTarik().then(() => ({ ok: true, aksi: "unduh" }));
    }
    // Lokal lebih baru / sama: gabung dulu biar tidak ada yang hilang, lalu
    // unggah hasilnya.
    const gabung = gabungProgres(lokal, serverProgres);
    if (typeof saveGantiProgres === "function") {
      akunTahanJadwal = true;
      try {
        saveGantiProgres(gabung);
      } finally {
        akunTahanJadwal = false;
      }
    }
    return akunUnggahSekarang().then(() => ({ ok: true, aksi: "gabung-unggah" }));
  });
}

function akunSegeraSinkron() {
  if (!akunUid) return;
  akunSinkronAwal().catch(() => {});
}

// Dipanggil dari save.js setiap progres tersimpan: jeda dulu supaya tidak
// terlalu banyak request (koin bertambah tiap beberapa detik).
function akunJadwalUnggah() {
  if (!akunUid || akunTahanJadwal) return;
  if (!akunAktifDipakai()) return;
  if (typeof AKUN_KONFIG !== "undefined" && AKUN_KONFIG.jedaUnggahMs) {
    akunJadwalUnggah.tunda = AKUN_KONFIG.jedaUnggahMs;
  }
  if (akunJadwal) clearTimeout(akunJadwal);
  akunJadwal = setTimeout(() => {
    akunJadwal = null;
    akunUnggahSekarang();
  }, akunJadwalUnggah.tunda || 8000);
}

function akunBatalkanJadwal() {
  if (akunJadwal) {
    clearTimeout(akunJadwal);
    akunJadwal = null;
  }
  akunUnggahTertunda = false;
}