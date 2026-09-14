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
    nama: "Kenji",
    deskripsi: "Pemanah - jarak jauh",
    gambar: "assets/characters/kenji.png",
    senjata: "panah",
    senjataGambar: "assets/weapons/panah.png",
    skala: 2,
    hp: 100,
    kecepatan: 180,
    attackRate: 0.18,
    damage: 25,
    reach: 0,
    halfArc: 0,
    // rot: offset rotasi sprite senjata (radian) agar ujungnya menunjuk pointer.
    rot: Math.PI,
    specialRadius: 170,
    specialDmg: 100,
    tipe: "jarak"
  },
  {
    kunci: "rin",
    nama: "Rin",
    deskripsi: "Pendekar - jarak dekat",
    gambar: "assets/characters/rin.png",
    senjata: "pedang",
    senjataGambar: "assets/weapons/pedang.png",
    skala: 2,
    hp: 120,
    kecepatan: 200,
    attackRate: 0.35,
    damage: 50,
    reach: 70,
    halfArc: 0.9,
    specialRadius: 200,
    specialDmg: 60,
    tipe: "dekat"
  }
];