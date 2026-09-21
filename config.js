// ============================================================
// CONFIG - daftar karakter & senjata.
// Tambah karakter baru di sini.
// gambar: path PNG di assets/characters/
// senjataGambar: path PNG di assets/weapons/
// tipe: "jarak" (tembak/panah) atau "dekat" (pedang)
// ============================================================
const KARAKTER = [
  {
    kunci: "kenzro",
    nama: "Kenzro",
    deskripsi: "Pemanah - jarak jauh",
    element: "Es",
    gambar: "assets/characters/kenzro.png",
    senjata: "panah",
    senjataGambar: "assets/weapons/panah.png",
    // PNG 64x64 native 1:1 (canvas 1280x960 pixel-perfect).
    skala: 1,
    // panah.png milik pemilik proyek, canvas 64x64 (isi 40x64).
    // Skala 1 agar senjata tampil native mengikuti karakter 64x64.
    senjataSkala: 1,
    hp: 100,
    kecepatan: 360,
    attackRate: 0.25,
    damage: 25,
    reach: 0,
    halfArc: 0,
    // rot: offset rotasi sprite senjata (radian) agar ujungnya menunjuk pointer.
    rot: Math.PI - Math.PI / 18 - Math.PI / 12 - Math.PI / 12,
    // Warna aksen indikator DASH desktop mengikuti palet karakter (Kenzro: biru es).
    warnaDash: "#7dd3fc",
    // Jurus Kenzro: buff panah pembeku. Cooldown sengaja panjang.
    specialCd: 9,
    buffDurasi: 5,
    bekuDurasi: 1,
    specialRadius: 340,
    specialDmg: 100,
    tipe: "jarak"
  },
  {
    kunci: "rin",
    nama: "Vender",
    deskripsi: "Pendekar - jarak dekat",
    element: "Api",
    gambar: "assets/characters/rin.png",
    senjata: "pedang",
    senjataGambar: "assets/weapons/pedang.png",
    // PNG 64x64 native 1:1 (canvas 1280x960 pixel-perfect).
    skala: 1,
    // sabit 80x24 milik pemilik proyek; skala 1 -> native 80x24.
    senjataSkala: 1,
    hp: 120,
    kecepatan: 400,
    attackRate: 0.35,
    damage: 50,
    // World 2x: jangkauan tebasan ikut membesar (semula 45).
    reach: 90,
    halfArc: 1.05,
    // Dibesarkan agar animasi tebasan pas dengan durasi suara sabit (~0.28s).
    swingDuration: 0.28,
    // Ujung sabit di PNG menghadap ke atas -> rot +90 deg agar
    // saat diputar menunjuk ke arah pointer. (-10 deg koreksi arah)
    rot: Math.PI / 2 - Math.PI / 18,
    // Warna aksen indikator DASH desktop mengikuti palet karakter (Vender: merah).
    warnaDash: "#ff4d4d",
    // Jurus Vender: tebasan besar; cooldown sama panjang dengan Kenzro.
    specialCd: 9,
    specialRadius: 400,
    specialDmg: 60,
    tipe: "dekat"
  }
];