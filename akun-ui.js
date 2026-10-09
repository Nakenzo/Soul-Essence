// =============================================================================
// UI panel AKUN (bagian dari Tahap 2). Terpisah dari akun.js supaya logika
// sinkron tetap bisa diuji tanpa DOM.
//
// Bentuknya seperti Roblox:
//   - BUAT AKUN -> username + sandi + Gmail (Gmail = tujuan cadangan data)
//   - MASUK     -> username + sandi
// =============================================================================

const akunLayar = {
  el: null, zona: null, tamu: null, masuk: null, form: null,
  nama: null, sandi: null, gmail: null, barisGmail: null,
  kirim: null, batal: null, pesan: null, status: null, gmailTeks: null,
  buat: null, masukBtn: null, sync: null, keluar: null, keGmail: null,
  panduan: null, tanya: null
};
let akunMode = "tamu"; // "tamu" | "daftar" | "masuk"
let akunFormTerbuka = false;

function akunPasangUI() {
  akunLayar.el = document.getElementById("layarAkun");
  akunLayar.zona = document.getElementById("zonaAkun");
  akunLayar.tamu = document.getElementById("akunBarisTamu");
  akunLayar.masuk = document.getElementById("akunBarisMasuk");
  akunLayar.form = document.getElementById("akunForm");
  akunLayar.nama = document.getElementById("akunNama");
  akunLayar.sandi = document.getElementById("akunSandi");
  akunLayar.gmail = document.getElementById("akunGmail");
  akunLayar.barisGmail = document.getElementById("akunBarisGmail");
  akunLayar.kirim = document.getElementById("akunKirim");
  akunLayar.batal = document.getElementById("akunBatal");
  akunLayar.pesan = document.getElementById("akunPesan");
  akunLayar.status = document.getElementById("akunStatusTeks");
  akunLayar.gmailTeks = document.getElementById("akunGmailTeks");
  akunLayar.buat = document.getElementById("tombolBuatAkun");
  akunLayar.masukBtn = document.getElementById("tombolMasukAkun");
  akunLayar.sync = document.getElementById("tombolSyncSekarang");
  akunLayar.keluar = document.getElementById("tombolKeluarAkun");
  akunLayar.keGmail = document.getElementById("tombolKeGmail");
  akunLayar.panduan = document.getElementById("panduanAkun");
  akunLayar.tanya = document.getElementById("tombolPanduanAkun");
  if (!akunLayar.zona) return;
  if (!akunAktif()) {
    akunLayar.zona.hidden = true;
    return;
  }
  akunLayar.zona.hidden = false;
  if (akunLayar.buat) akunLayar.buat.addEventListener("click", () => akunBukaForm("daftar"));
  if (akunLayar.masukBtn) akunLayar.masukBtn.addEventListener("click", () => akunBukaForm("masuk"));
  if (akunLayar.batal) akunLayar.batal.addEventListener("click", akunTutupForm);
  if (akunLayar.kirim) akunLayar.kirim.addEventListener("click", akunKirimForm);
  if (akunLayar.nama) akunLayar.nama.addEventListener("keydown", akunTekanEnter);
  if (akunLayar.sandi) akunLayar.sandi.addEventListener("keydown", akunTekanEnter);
  if (akunLayar.gmail) akunLayar.gmail.addEventListener("keydown", akunTekanEnter);
  if (akunLayar.keGmail) akunLayar.keGmail.addEventListener("click", akunBukaGmail);
  if (akunLayar.tanya) akunLayar.tanya.addEventListener("click", akunBalikPanduan);
  if (akunLayar.sync) akunLayar.sync.addEventListener("click", () => {
    akunUnggahSekarang().then((h) => {
      if (h && h.ok) akunTambahPesan("Tersimpan ke server.", "ok");
      else if (h && h.alasan === "server-lebih-baru") akunTambahPesan("Server punya versi lebih baru, progress lokal diganti.", "ok");
      else akunTambahPesan("Gagal sync. Progress lokal tetap aman.", "gagal");
    });
  });
  if (akunLayar.keluar) akunLayar.keluar.addEventListener("click", () => {
    akunKeluar().then(() => akunTambahPesan("Keluar. Progres di server tetap ada.", "ok"));
  });
  akunTombolPanduan();
  akunPerbaruiUI();
}

function akunTekanEnter(ev) {
  if (ev && ev.key === "Enter") akunKirimForm();
}

function akunBalikPanduan() {
  if (akunLayar.panduan) akunLayar.panduan.hidden = !akunLayar.panduan.hidden;
  akunTombolPanduan();
}

function akunTutupPanduan() {
  if (akunLayar.panduan) akunLayar.panduan.hidden = true;
  akunTombolPanduan();
}

// Tombol "?" ikut mencerminkan isi panduan: terbuka atau tertutup.
function akunTombolPanduan() {
  if (!akunLayar.tanya || !akunLayar.panduan) return;
  akunLayar.tanya.setAttribute("aria-expanded", akunLayar.panduan.hidden ? "false" : "true");
}

// Dipanggil dari menu.js saat panel Cadangan dibuka.
function akunPerbaruiUI() {
  // Cek mode admin (akun admin) tiap status akun berubah.
  if (typeof adminCekAkun === "function") { try { adminCekAkun(); } catch (err) {} }
  if (!akunLayar || !akunLayar.zona) return;
  if (!akunAktif()) {
    akunLayar.zona.hidden = true;
    return;
  }
  akunLayar.zona.hidden = false;
  const info = typeof akunInfo === "function" ? akunInfo() : { masuk: false, status: "tamu" };
  const sudahMasuk = !!info.masuk;
  if (akunLayar.tamu) akunLayar.tamu.hidden = sudahMasuk;
  if (akunLayar.masuk) akunLayar.masuk.hidden = !sudahMasuk;
  if (sudahMasuk && akunLayar.status) {
    const lencana = {
      sinkron: "Tersinkron",
      menunggu: "Menyimpan...",
      offline: "Offline",
      gagal: "Gagal",
      tamu: "Tersinkron"
    }[info.status] || "Tersinkron";
    akunLayar.status.textContent = (info.nama || info.email || "Pemain") + " - " + lencana;
  }
  if (akunLayar.gmailTeks) {
    akunLayar.gmailTeks.textContent = sudahMasuk && info.gmail ? "Gmail cadangan: " + info.gmail : "";
  }
  if (info.pesan && akunLayar.pesan) akunLayar.pesan.textContent = info.pesan;
  if (akunFormTerbuka && sudahMasuk) akunTutupForm();
}

function akunBukaForm(mode) {
  akunMode = mode === "daftar" ? "daftar" : "masuk";
  akunFormTerbuka = true;
  akunTutupPanduan(); // jangan tumpuk dengan panduan
  if (!akunLayar.form) return;
  const daftar = akunMode === "daftar";
  akunLayar.form.hidden = false;
  if (akunLayar.barisGmail) akunLayar.barisGmail.hidden = !daftar;
  if (akunLayar.nama) {
    akunLayar.nama.value = "";
    akunLayar.nama.autocomplete = "username";
  }
  if (akunLayar.sandi) {
    akunLayar.sandi.value = "";
    akunLayar.sandi.autocomplete = daftar ? "new-password" : "current-password";
  }
  if (akunLayar.gmail) akunLayar.gmail.value = "";
  if (akunLayar.kirim) akunLayar.kirim.textContent = daftar ? "BUAT AKUN" : "MASUK";
  if (akunLayar.pesan) {
    akunLayar.pesan.textContent = daftar
      ? "Username dipakai untuk masuk. Gmail dipakai untuk cadangan data."
      : "Isi username dan sandi.";
    akunLayar.pesan.classList.remove("cad-ok", "cad-gagal");
  }
  if (akunLayar.nama) try { akunLayar.nama.focus(); } catch (err) {}
}

function akunTutupForm() {
  akunFormTerbuka = false;
  if (akunLayar.form) akunLayar.form.hidden = true;
}

function akunTambahPesan(pesan, jenis) {
  if (!akunLayar.pesan) return;
  akunLayar.pesan.textContent = pesan || "";
  akunLayar.pesan.classList.remove("cad-ok", "cad-gagal");
  if (jenis) akunLayar.pesan.classList.add(jenis === "ok" ? "cad-ok" : "cad-gagal");
}

function akunKirimForm() {
  if (!akunLayar.nama || !akunLayar.sandi) return;
  const daftar = akunMode === "daftar";
  const nama = akunLayar.nama.value;
  const sandi = akunLayar.sandi.value;
  const gmail = akunLayar.gmail ? akunLayar.gmail.value : "";
  if (akunLayar.kirim) akunLayar.kirim.disabled = true;
  akunTambahPesan("Tunggu sebentar...");
  const aksi = daftar ? akunBuat(nama, sandi, gmail) : akunMasuk(nama, sandi);
  aksi.then((h) => {
    if (akunLayar.kirim) akunLayar.kirim.disabled = false;
    if (!h || !h.ok) {
      const p = (h && h.pesan) || "Gagal";
      // Pendaftaran sukses tapi menunggu konfirmasi Gmail: tutup form supaya
      // pesannya kelihatan di panel utama.
      if (/^Akun dibuat/.test(p)) akunTutupForm();
      akunTambahPesan(p, /^Akun dibuat/.test(p) ? "ok" : "gagal");
      return;
    }
    akunTutupForm();
    akunTambahPesan(daftar
      ? "Akun dibuat. Progress di perangkat ini ikut tersimpan."
      : "Masuk. Menyesaikan progress...", "ok");
    if (typeof akunSinkronAwal === "function") {
      akunSinkronAwal().then((r) => {
        if (r && r.aksi === "unduh") akunTambahPesan("Progress dari server dipulihkan.", "ok");
        else if (r && r.aksi === "gabung-unggah") akunTambahPesan("Progress digabung dengan server.", "ok");
        else if (r && r.aksi === "klaim") akunTambahPesan("Progress perangkat ini tersimpan ke server.", "ok");
      });
    }
    akunPerbaruiUI();
  });
}

// Buka Gmail dengan kode save sudah terisi di badan email, jadi pemain tinggal
// kirim ke dirinya sendiri -- itu cadangan data lewat Gmail tanpa backend.
function akunBukaGmail() {
  const info = typeof akunInfo === "function" ? akunInfo() : {};
  let gmail = (info && info.masuk && info.gmail) || "";
  if (!gmail && akunLayar.gmail) gmail = String(akunLayar.gmail.value || "").trim();
  const kode = typeof saveKode === "function" ? saveKode() : "";
  if (!kode) {
    akunTambahPesan("Gagal membuat kode save.", "gagal");
    return;
  }
  const isi = "Cadangan progres game.\n\n" + kode + "\n\nSimpan email ini sebagai cadangan.";
  const url = "https://mail.google.com/mail/u/0/?view=cm&fs=1"
    + "&to=" + encodeURIComponent(gmail)
    + "&su=" + encodeURIComponent("Cadangan Progres Game")
    + "&body=" + encodeURIComponent(isi);
  let dibuka = false;
  try {
    dibuka = !!window.open(url, "_blank", "noopener");
  } catch (err) {
    dibuka = false;
  }
  if (dibuka) {
    akunTambahPesan(gmail
      ? "Membuka Gmail untuk " + gmail + ". Tinggal tekan Kirim."
      : "Membuka Gmail. Isi alamat sendiri dulu, kodenya sudah terisi.", "ok");
  } else {
    akunTambahPesan("Gagal membuka Gmail. Salin kodenya manual di atas.", "gagal");
  }
}
