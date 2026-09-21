// ============================================================
// MAP ASSET — map digambar sebagai GAMBAR PNG (persis karakter).
// Kamu gambar sendiri di editor pixel (Aseprite/Photoshop/GIMP),
// simpan di assets/maps/<gambar>. Rasio harus 2560:1920 (4:3).
// ============================================================
// PANDUAN GAMBAR:
//  - PNG ukuran bebas, mis. 160x120 → tiap 1 piksel = 16 unit dunia
//    (atau 320x240 → tiap 1 piksel = 8 unit dunia).
//  - Piksel HITAM PEKAT (#000000) = PENGHALANG (dinding/batu/pohon):
//    pemain & musuh tidak bisa menembus & otomatis tersangkut TIDAK
//    akan terjadi (gerak per-sumbu = meluncur di sekelilingnya).
//  - Semua warna lain = bisa dilewati & dirender apa adanya (pixel art).
//  - Seluruh kanvas PNG harus terisi (tanpa area transparan biar rapi).
// ============================================================
const MAP_ASSET = {
  kunci: "padang",
  nama: "Padang Terbuka",
  gambar: "assets/maps/padang.png",
  warnaTanah: "#7ec850"   // alas di belakang PNG (tertutup bila PNG ada)
};

// Grid penghalang: 1 elemen per piksel PNG (true = hitam = tembok).
let petaImage = null;      // Image map yang dimuat
let petaSiap = false;      // true setelah PNG berhasil dimuat
let petaBlok = [];         // boolean[] ukuran petaKolom*petaBaris
let petaKolom = 0;         // lebar PNG (piksel)
let petaBaris = 0;         // tinggi PNG (piksel)
let petaGagal = false;     // true bila PNG tidak bisa dimuat sama sekali
let pesanPeta = "";        // pesan error yang tampil di layar (="" bila aman)
// Ukuran 1 piksel PNG dalam unit dunia (biar rasio 4:3, keduanya sama).
let petaSelX = WORLD_W;
let petaSelY = WORLD_H;

// Barrier tak terlihat di tepi map: pemain/musuh dibatasi agar tidak sampai
// ke area kosong di luar batas gambar PNG. Pemain berhenti sebelum kamera
// sempat memperlihatkan kekosongan di balik tepi map.
// Kiri/kanan lebih lebar karena kamera horizontal lebih rentan memperlihatkan
// area kosong (dunia 2560 unit lebar, kamera ~1280).
const BARRIER_KIRI = 270;
const BARRIER_KANAN = 260;
const BARRIER_ATAS = 160;
const BARRIER_BAWAH = 170;

// Memuat gambar map, lalu membangun grid penghalang dari pixel hitam.
// Setelah siap, tandai latarDirty (= di draw.js) supaya bake digambar ulang.
function muatPeta() {
  const img = new Image();
  img.onload = () => {
    petaKolom = img.naturalWidth;
    petaBaris = img.naturalHeight;
    petaSelX = WORLD_W / petaKolom;
    petaSelY = WORLD_H / petaBaris;
    // Gambar DISIMPAN dulu → langsung tampil walau pembacaan pixel gagal
    // (mis. URL file:// tercampur = canvas terkontaminasi). Dinding baru
    // aktif setelah petaSiap = true.
    petaImage = img;
    if (typeof latarDirty === "boolean") latarDirty = true;
    const tc = document.createElement("canvas");
    tc.width = petaKolom;
    tc.height = petaBaris;
    const tg = tc.getContext("2d");
    tg.drawImage(img, 0, 0);
    let d;
    try {
      d = tg.getImageData(0, 0, petaKolom, petaBaris).data;
    } catch (e) {
      // Canvas terkontaminasi (umumnya karena halaman dibuka lewat file://,
      // bukan http://localhost). Map tetap TAMPIL; grid penghalang nonaktif.
      petaSiap = false;
      console.warn("MAP: pixel tidak bisa dibaca (kemungkinan dibuka via file://)." +
        " Jalankan server lokal (python -m http.server) agar dinding hitam aktif.");
      return;
    }
    petaBlok = [];
    for (let y = 0; y < petaBaris; y++) {
      for (let x = 0; x < petaKolom; x++) {
        const i = (y * petaKolom + x) * 4;
        // DINDING = hitam MURNI #000000 saja. Piksel gelap/berbayang lain
        // (mis. bayangan rumput) TIDAK jadi penghalang lagi → musuh tidak
        // akan "nyangkut di tempat kosong".
        petaBlok.push(d[i + 3] === 255 && d[i] === 0 && d[i + 1] === 0 && d[i + 2] === 0);
      }
    }
    petaSiap = true;
  };
  img.onerror = () => {
    petaSiap = false;
    petaImage = null;
    petaGagal = true;
    console.warn("MAP GAGAL DIMUAT: " + MAP_ASSET.gambar +
      " tidak ditemukan. Pastikan file ada di assets/maps/.");
  };
  img.src = MAP_ASSET.gambar;
}

// Mulai memuat gambar map saat halaman dibuka.
muatPeta();

// Tile (x,y) padat? Selama map belum siap (masih memuat / PNG gagal dimuat),
// TIDAK ada dinding sama sekali — kalau tidak, player & musuh terkunci di
// tempat karena petaKolom=0 membuat seluruh dunia jadi "penghalang".
function tesBlokTile(x, y) {
  if (!petaSiap) return false;
  if (x < 0 || y < 0 || x >= petaKolom || y >= petaBaris) return true;
  // Barrier tepi: blokir area di sepanjang tepi map agar kamera tidak
  // sempat memperlihatkan kekosongan di luar batas gambar PNG.
  const wx = x * petaSelX, wy = y * petaSelY;
  if (wx < BARRIER_KIRI || wy < BARRIER_ATAS || wx > WORLD_W - BARRIER_KANAN || wy > WORLD_H - BARRIER_BAWAH) return true;
  return petaBlok[y * petaKolom + x];
}

// Cek TABRAKAN LINGKARAN (x,y,r) vs dinding PNG. Kadang "nyangkut" tidak
// mungkin terjadi: pemain & musuh memakai gerak per-sumbu dengan tes ini,
// sehingga mereka selalu MELUNCUR mengelilingi tembok.
function tesLingkaran(x, y, r) {
  const t0x = Math.floor((x - r) / petaSelX);
  const t1x = Math.floor((x + r) / petaSelX);
  const t0y = Math.floor((y - r) / petaSelY);
  const t1y = Math.floor((y + r) / petaSelY);
  for (let ty = t0y; ty <= t1y; ty++) {
    for (let tx = t0x; tx <= t1x; tx++) {
      if (tesBlokTile(tx, ty)) {
        const bx = tx * petaSelX, by = ty * petaSelY;
        const cx2 = Math.max(bx, Math.min(x, bx + petaSelX));
        const cy2 = Math.max(by, Math.min(y, by + petaSelY));
        const dx = cx2 - x, dy = cy2 - y;
        if (dx * dx + dy * dy < r * r) return true;
      }
    }
  }
  return false;
}