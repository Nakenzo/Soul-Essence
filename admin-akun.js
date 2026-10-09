// =============================================================================
// GATE ADMIN BERBASIS AKUN + PENGIKATAN PERANGKAT
// -----------------------------------------------------------------------------
// Mode admin HANYA aktif kalau pemain login dengan akun yang username-nya
// sama dengan ADMIN_KONFIG.username (admin-konfig.js). Tidak ada jalur lain:
// tidak ada sandi admin yang ditulis di kode.
//
// Begitu akun admin login:
//   1. Perangkat ini "diklaim" di tabel public.admin_device (Supabase).
//   2. Kalau akun admin sudah terikat ke perangkat LAIN, login ditolak dan
//      otomatis logout. Terikat hanya 1 perangkat sampai admin logout.
//   3. Skrip debug (wave select, panel artefak, pemilih kartu) dimuat.
//
// Kalau tabel admin_device belum dibuat (sql/supabase.sql belum dijalankan
// ulang), mode admin tetap jalan tapi pengikatan perangkat tidak aktif.
// =============================================================================

var ADMIN_BUKA = false;   // dibaca skrip debug untuk izin tampil
var adminMenyala = false; // skrip debug sudah dimuat
var adminIkatBerjalan = false;
var adminSkripDebug = ["test-wave-select.js", "admin-artefak.js", "admin-debug.js"];

function adminNamaCocok() {
  try {
    if (typeof akunInfo !== "function") return false;
    var info = akunInfo();
    var mau = (typeof ADMIN_KONFIG !== "undefined" && ADMIN_KONFIG.username) || "";
    if (!info || !info.masuk || !info.nama || !mau) return false;
    return String(info.nama).trim().toLowerCase() === String(mau).trim().toLowerCase();
  } catch (err) {
    return false;
  }
}

function adminDeviceId() {
  var kunci = "se_admin_device";
  var id = null;
  try { id = localStorage.getItem(kunci); } catch (err) { id = null; }
  if (!id) {
    id = "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    try { localStorage.setItem(kunci, id); } catch (err) {}
  }
  return id;
}

// Kunci perangkat untuk akun admin yang sedang login.
// Hasil: { ok:true } | { ok:false, alasan:"device-lain" } | { ok:true,
// alasan:"tanpa-tabel"/"jaringan" } (fail-open kalau DB belum siap).
function adminKlaimDevice() {
  if (typeof akunKlien === "undefined" || !akunKlien || typeof akunUid === "undefined" || !akunUid) {
    return Promise.resolve({ ok: false, alasan: "tamu" });
  }
  var dev = adminDeviceId();
  return akunKlien
    .from("admin_device")
    .select("device_id")
    .eq("user_id", akunUid)
    .maybeSingle()
    .then(function (r) {
      if (r && r.error) return { ok: true, alasan: "tanpa-tabel" };
      var baris = r && r.data;
      if (!baris) {
        return akunKlien
          .from("admin_device")
          .upsert(
            { user_id: akunUid, device_id: dev, updated_at: new Date().toISOString() },
            { onConflict: "user_id" }
          )
          .then(function (r2) {
            if (r2 && r2.error) return { ok: true, alasan: "tanpa-tabel" };
            return { ok: true };
          });
      }
      if (baris.device_id === dev) return { ok: true };
      return { ok: false, alasan: "device-lain" };
    })
    .catch(function () { return { ok: true, alasan: "jaringan" }; });
}

// Hapus pengikatan HANYA kalau baris itu milik perangkat ini. Dipanggil sebelum
// logout supaya admin bisa pindah perangkat. Perangkat lain yang ditolak tidak
// menghapus klaim perangkat yang sah.
function adminLepasDevice() {
  if (typeof akunKlien === "undefined" || !akunKlien || typeof akunUid === "undefined" || !akunUid) {
    return Promise.resolve();
  }
  if (!adminNamaCocok()) return Promise.resolve();
  var dev = adminDeviceId();
  return akunKlien
    .from("admin_device")
    .select("device_id")
    .eq("user_id", akunUid)
    .maybeSingle()
    .then(function (r) {
      var baris = r && !r.error ? r.data : null;
      if (baris && baris.device_id === dev) {
        return akunKlien.from("admin_device").delete().eq("user_id", akunUid);
      }
      return null;
    })
    .catch(function () {});
}

function adminMuatSkrip() {
  adminSkripDebug.forEach(function (src) {
    if (document.querySelector('script[data-admin-src="' + src + '"]')) return;
    var s = document.createElement("script");
    s.src = src;
    s.async = false;
    s.setAttribute("data-admin-src", src);
    s.onerror = function () {
      if (window.console) console.warn("[admin] gagal memuat " + src);
    };
    document.body.appendChild(s);
  });
}

function adminNyalakan(catatan) {
  if (adminMenyala) return;
  adminMenyala = true;
  ADMIN_BUKA = true;
  window.ADMIN_BUKA = true;
  adminMuatSkrip();
  adminPesan(catatan || "aktif");
  if (window.console) console.log("[admin] mode admin aktif");
}

function adminMatikan() {
  if (!adminMenyala) return;
  adminMenyala = false;
  ADMIN_BUKA = false;
  window.ADMIN_BUKA = false;
  adminBuangPanel();
  adminPesan("");
  if (window.console) console.log("[admin] mode admin nonaktif");
}

function adminBuangPanel() {
  ["panelDebugArtefak", "panelDebugKartu", "waveSelectPanel", "barDebugKartu"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el && el.parentNode) el.parentNode.removeChild(el);
  });
}

function adminPesan(teks) {
  var el = document.getElementById("adminIndikator");
  if (!el) {
    if (!teks) return;
    el = document.createElement("div");
    el.id = "adminIndikator";
    el.style.cssText =
      "position:fixed;left:8px;bottom:8px;z-index:99998;" +
      "background:rgba(6,8,16,0.92);color:#fbbf24;border:1px solid #7a5cff;" +
      "border-radius:8px;padding:4px 8px;font:12px system-ui,sans-serif;pointer-events:none;";
    document.body.appendChild(el);
  }
  if (!teks) { el.style.display = "none"; return; }
  el.style.display = "block";
  el.textContent = "ADMIN - " + teks;
}

// Dipanggil dari akunPerbaruiUI() setiap status akun berubah.
function adminCekAkun() {
  if (!adminNamaCocok()) {
    if (adminMenyala) adminMatikan();
    return;
  }
  if (adminMenyala || adminIkatBerjalan) return;
  adminIkatBerjalan = true;
  adminKlaimDevice().then(function (h) {
    adminIkatBerjalan = false;
    if (!adminNamaCocok()) return; // sudah logout saat menunggu
    if (h && h.ok === false && h.alasan === "device-lain") {
      var pesan = "Akun admin sudah terikat di perangkat lain. Logout dulu di perangkat itu.";
      if (typeof akunTambahPesan === "function") akunTambahPesan(pesan, "gagal");
      if (window.console) console.warn("[admin] " + pesan);
      if (typeof akunKeluar === "function") akunKeluar();
      return;
    }
    adminNyalakan(h && h.alasan === "tanpa-tabel" ? "aktif (DB perangkat belum siap)" : "aktif");
  });
}

// Lepas pengikatan perangkat sebelum signOut, supaya device bisa diganti.
(function () {
  if (typeof akunKeluar !== "function") return;
  var asli = akunKeluar;
  akunKeluar = function () {
    return adminLepasDevice().then(function () { return asli(); });
  };
})();

window.addEventListener("load", function () {
  if (typeof akunPerbaruiUI === "function") akunPerbaruiUI();
});
