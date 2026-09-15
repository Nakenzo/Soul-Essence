// ============================================================
// CONFIG - daftar karakter & senjata.
// Tambah karakter baru di sini.
// gambar: path PNG di assets/characters/
// senjataGambar: path PNG di assets/weapons/
// tipe: "jarak" (tembak/panah) atau "dekat" (pedang)
// ============================================================
const KARAKTER = [
  {
    kunci: "kenji",
    nama: "Kenzro",
    deskripsi: "Pemanah - jarak jauh",
    gambar: "assets/characters/kenji.png",
    senjata: "panah",
    senjataGambar: "assets/weapons/panah.png",
    skala: 1,
    // panah.png milik pemilik proyek, canvas 64x64 (isi 40x64).
    // Skala 0.5 agar di layar tetap 20x32 seperti sebelumnya.
    senjataSkala: 0.5,
    hp: 100,
    kecepatan: 180,
    attackRate: 0.18,
    damage: 25,
    reach: 0,
    halfArc: 0,
    // rot: offset rotasi sprite senjata (radian) agar ujungnya menunjuk pointer.
    rot: Math.PI - Math.PI / 18 - Math.PI / 12 - Math.PI / 12,
    // Jurus Kenzro: buff panah pembeku. Cooldown sengaja panjang.
    specialCd: 9,
    buffDurasi: 5,
    bekuDurasi: 1,
    specialRadius: 170,
    specialDmg: 100,
    tipe: "jarak"
  },
  {
    kunci: "rin",
    nama: "Vender",
    deskripsi: "Pendekar - jarak dekat",
    gambar: "assets/characters/rin.png",
    senjata: "pedang",
    senjataGambar: "assets/weapons/pedang.png",
    skala: 1,
    // sabit 80x24 milik pemilik proyek; skala 0.5 -> di layar 40x12.
    senjataSkala: 0.5,
    hp: 120,
    kecepatan: 200,
    attackRate: 0.35,
    damage: 50,
    reach: 45,
    halfArc: 1.05,
    swingDuration: 0.2,
    // Ujung sabit di PNG menghadap ke atas -> rot +90 deg agar
    // saat diputar menunjuk ke arah pointer. (-10 deg koreksi arah)
    rot: Math.PI / 2 - Math.PI / 18,
    // Jurus Vender: tebasan besar; cooldown sama panjang dengan Kenzro.
    specialCd: 9,
    specialRadius: 200,
    specialDmg: 60,
    tipe: "dekat"
  }
];