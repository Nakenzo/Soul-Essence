// Field "animasi" = daftar clip yang BENAR-BENAR ada di assets/animasi/<kunci>/.
// Format file: <kunci>-<nama>-<index>.png, index mulai dari 0.
// Clip yang tidak terdaftar di sini tidak akan di-request sama sekali, jadi
// tidak ada 404 kalau file-nya belum dibuat.
// Contoh menambah clip: taruh 4 file "kenzro-attack-0..3.png", lalu tambahkan
//   { nama: "attack", jumlah: 4 }
// draw.js otomatis memakainya (dan jatuh ke frame idle kalau belum ada).
const KARAKTER = [
  {
    kunci: "kenzro",
    animasi: [
      { nama: "idle", jumlah: 12 },
      { nama: "walk", jumlah: 12 }
    ],
    nama: "Kenzro",
    deskripsi: "Pemanah - jarak jauh",
    element: "Es",
    atributElement: 120,
    gambar: "assets/characters/kenzro.png",
    senjata: "panah",
    senjataGambar: "assets/weapons/panah.png",
    skala: 1,
    senjataSkala: 1,
    hp: 100,
    kecepatan: 360,
    attackRate: 0.25,
    damage: 25,
    reach: 0,
    halfArc: 0,
    rot: Math.PI - Math.PI / 18 - Math.PI / 12 - Math.PI / 12,
    warnaDash: "#7dd3fc",
    specialCd: 9,
    buffDurasi: 5,
    bekuDurasi: 1,
    specialRadius: 340,
    specialDmg: 100,
    tipe: "jarak",
    skill: [
      {},  // slot 1 - default
      {},  // slot 2 - default
      { nama: "FROZFALL" }  // slot 3 - Frozfall
    ]
  },
  {
    kunci: "rin",
    animasi: [
      { nama: "idle", jumlah: 12 },
      { nama: "walk", jumlah: 12 }
    ],
    nama: "Vender",
    deskripsi: "Pendekar - jarak dekat",
    element: "Api",
    atributElement: 100,
    gambar: "assets/characters/rin.png",
    senjata: "pedang",
    senjataGambar: "assets/weapons/pedang.png",
    skala: 1,
    senjataSkala: 1,
    hp: 120,
    kecepatan: 400,
    attackRate: 0.35,
    damage: 50,
    reach: 90,
    halfArc: 1.05,
    swingDuration: 0.28,
    rot: Math.PI / 2 - Math.PI / 18,
    warnaDash: "#ff4d4d",
    specialCd: 9,
    specialRadius: 400,
    specialDmg: 60,
    tipe: "dekat",
    skill: [
      {},  // slot 1 - default
      {},  // slot 2 - default
      { nama: "INFERNO" }  // slot 3 - Inferno
    ]
  }
];

// 4 slot artefak per karakter, pola slot Genshin.
//  "stat" pada slot = stat utama WAJIB (mahkota selalu HP, armor selalu
//  damage). Slot dengan "stat: null" = fleksibel, ikut stat utama set yang
//  dipasang (legging & boots). Satu set tidak harus 4 slot sama; bonus set
//  baru aktif minimal 2 slot dari set yang sama (2A+2B, 4A, dst).
const ARTEFAK_SLOT = [
  { kunci: "crown", nama: "CROWN", stat: { hp: 0.011 }, warna: "#c4b5fd" },
  { kunci: "armor", nama: "ARMOR", stat: { damage: 0.009 }, warna: "#f9a8d4" },
  { kunci: "legging", nama: "LEGGINGS", stat: null, warna: "#86efac" },
  { kunci: "boots", nama: "BOOTS", stat: null, warna: "#fcd34d" }
];

// 4 SET ARTEFAK. Setiap set punya identitas sendiri lewat stat utama
// slot fleksibel + bonus set bertingkat. Tambah set = 1 objek di sini +
// 1 ikon di ARTEFAK_IKON_SET (menu.js), tanpa ubah kode lain.
//
// SET BONUS BERTINGKAT (pola Genshin):
//   "bonus2" = aktif kalau minimal 2 slot dari set ini terisi.
//   "bonus4" = aktif kalau keempat slot dari set ini terisi.
// Ini yang membuka kombinasi 2A+2B, 2A+1B+1C, atau 4A.
// Bonus set memberi "atributElement" = Elemental Mastery (Genshin):
//   stat khusus yang menaikkan damage skill/ultimate, tidak ikut persen
//   (jumlahnya angka tetap: +60 / +120). Totalnya = base karakter +
//   bonus dari semua set aktif.
const ARTEFAK_SET = [
  {
    kunci: "es",
    nama: "PERISAI TUNDRA",
    warna: "#7dd3fc",
    stat: { hp: 0.011 },
    bonus2: { atributElement: 60 },
    bonus4: { atributElement: 120 },
    teks2: "+60 atribut element",
    teks4: "+120 atribut element"
  },
  {
    kunci: "bara",
    nama: "JANTUNG BARA",
    warna: "#ff8c3f",
    stat: { damage: 0.009 },
    bonus2: { atributElement: 60 },
    bonus4: { atributElement: 120 },
    teks2: "+60 atribut element",
    teks4: "+120 atribut element"
  },
  {
    kunci: "angin",
    nama: "LANGKAH ANGIN",
    warna: "#86efac",
    stat: { kecepatan: 0.008, damage: 0.004 },
    bonus2: { atributElement: 60 },
    bonus4: { atributElement: 120 },
    teks2: "+60 atribut element",
    teks4: "+120 atribut element"
  },
  {
    kunci: "gemuruh",
    nama: "GEMURUH PETIR",
    warna: "#c084fc",
    stat: { damage: 0.006, hp: 0.007 },
    bonus2: { atributElement: 60 },
    bonus4: { atributElement: 120 },
    teks2: "+60 atribut element",
    teks4: "+120 atribut element"
  }
];

// Level tertinggi global. Piece dibatasi lagi oleh cap rarity-nya
// (bintang 1-5 -> cap 4/8/12/16/20), persis cara Genshin.
const ARTEFAK_LEVEL_MAX = 20;

// RARITAS 1-5 bintang (pola Genshin):
//   cap     = level maksimal piece ini.
//   substat = jumlah substat SAAT PERTAMA drop.
//   kali    = pengali kekuatan stat utama & substat (rarer = lebih kuat).
//   warna   = warna bintang & garis kartu di UI (abu/ijo/biru/ungu/emas).
// Substat tambahan masih bisa didapat saat naik level (lihat
// ARTEFAK_SUBSTAT_NAIK_PADA), sampai ARTEFAK_SUBSTAT_MAKS.
const ARTEFAK_BINTANG = [
  { bintang: 1, cap: 4, substat: 1, kali: 1.00, warna: "#9ca3af" },
  { bintang: 2, cap: 8, substat: 1, kali: 1.15, warna: "#4ade80" },
  { bintang: 3, cap: 12, substat: 2, kali: 1.30, warna: "#60a5fa" },
  { bintang: 4, cap: 16, substat: 2, kali: 1.50, warna: "#c084fc" },
  { bintang: 5, cap: 20, substat: 3, kali: 1.75, warna: "#fbbf24" }
];

// SUBSTAT = bonus kecil tambahan. Saat artefak pertama drop, langsung
// diambil ARTEFAK_BINTANG[...].substat buah (stat berbeda-beda). Lalu
// setiap kali naik level ke nilai di ARTEFAK_SUBSTAT_NAIK_PADA, ada roll
// Genshin: 65% tambah substat baru (kalau masih < ARTEFAK_SUBSTAT_MAKS),
// sisanya naikkan salah satu substat yang sudah ada. Nilainya dikali
// pengali rarity (def.kali), jadi 5 bintang selalu lebih menggoda.
const ARTEFAK_SUBSTAT_POOL = [
  { stat: "hp", nilai: 0.03 },
  { stat: "hp", nilai: 0.05 },
  { stat: "damage", nilai: 0.02 },
  { stat: "damage", nilai: 0.04 },
  { stat: "kecepatan", nilai: 0.02 },
  { stat: "kecepatan", nilai: 0.035 }
];

const ARTEFAK_SUBSTAT_MAKS = 3;

const ARTEFAK_SUBSTAT_NAIK_PADA = [4, 8, 12, 16, 20];
