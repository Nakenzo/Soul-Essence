// ============================================================
// UPGRADES - kartu upgrade antar gelombang.
// Selesai 1 wave -> jeda -> tampil 3 kartu, pilih 1.
// Bonus "terukur" (10-15% per kartu) & dibatasi (cap) agar
// karakter tidak langsung kuat hanya dengan 1 kartu.
// Semua bonus hilang otomatis saat resetArena (game baru).
//
// Tiap kartu punya filter `cocok(karakter)` -> kartu yang tidak
// relevan untuk karakter itu tidak ikut diundi. Untuk karakter baru,
// cukup isi properti tipe/reach dll di config.js dan kartu sesuai
// tipe (dekat: reach/halfArc, jarak: bullet) otomatis tersaring.
//
// SETIAP KARTU MEMILIKI TIER: common / rare / epic / legend.
// common  = warna background kartu seperti sekarang (kertas krem).
// rare    = background kartu biru.
// epic    = background kartu ungu.
// legend  = background kartu kuning keemasan (paling langka).
// Logo/ikon kartu TIDAK ikut berubah warna (hanya background).
// Maksimal penumpukan sesuai tier:
//   common x3, rare x2, epic x1, legendary x1.
// Setelah maks stack tercapai, kartu itu tidak muncul lagi saat
// in-game sampai game selesai/restart (resetArena mengosongkan player.kartu).

// ===== KONFIGURASI TIER =====
// Tambah tier baru (mis. legendary) cukup daftarkan satu baris di sini --
// warna flat kartu (bg/garis/aksen, tanpa gradasi), maks stack, peluang
// muncul, dan warna "gem" untuk penanda tier di panel KARTUMU (sidebar).
//   bg.gelap/hover = warna dasar kartu | garis = bingkai | aksen = ornamen
//   gem = warna berlian penanda tier di panel samping
//   maks = max penumpukan (stack) | bobotKali = pengali peluang muncul
const TIER_DEF = {
  common: { maks: 3, bobotKali: 1.0, garis: "#59492f", aksen: "#9a7b3c", gem: "#f3e5c0",
    bg: { gelap: "#f3ecd9", hover: "#fbf7ea" } },
  rare: { maks: 2, bobotKali: 0.65, garis: "#1d4ed8", aksen: "#164ea0", gem: "#4aa8ff",
    bg: { gelap: "#93b8ee", hover: "#b7d4f6" } },
  epic: { maks: 1, bobotKali: 0.35, garis: "#6d28d9", aksen: "#f59e0b", gem: "#c084fc",
    bg: { gelap: "#c5adff", hover: "#dbc8ff" } },
  // Legend: palet KUNING, paling langka — bobotKali terkecil, maks 1.
  legend: { maks: 1, bobotKali: 0.18, garis: "#b8860b", aksen: "#fbbf24", gem: "#fde047",
    bg: { gelap: "#fde68a", hover: "#fef3c7" } }
};
const MAKS_STACK = Object.keys(TIER_DEF).reduce((a, t) => { a[t] = TIER_DEF[t].maks; return a; }, {});
// ============================================================

// Sinyal kemampuan umum sebagai pegangan penyaringan kartu.
// Dipakai di cucok kartu agar karakter baru mudah ikut tipe yang ada.
function cekTipe(k, tipe) { return k.tipe === tipe; }
function punyaTebasan(k) { return cekTipe(k, "dekat") || (k.reach || 0) > 0; }
function punyaPanah(k) { return cekTipe(k, "jarak"); }

// Daftar kartu yang tersedia. bobot = makin besar makin sering muncul.
// multiplikatif ter-compound; kartu ber-additif true dijumlah bertahap.
const KARTU_UPGRADE = [
  {
    id: "laju", nama: "LARI CEPAT", ket: "+10% kecepatan gerak",
    bobot: 34, warna: "#60a5fa", ikon: "\u2699", tier: "common",
    mult: { speed: 1.10 }
  },
  {
    id: "rusak", nama: "DAMAGE", ket: "+15% damage serangan",
    bobot: 30, warna: "#f87171", ikon: "\u2694", tier: "common",
    mult: { damage: 1.15 }
  },
  {
    id: "tempo", nama: "SERANGAN CEPAT", ket: "-12% jeda serangan",
    bobot: 28, warna: "#34d399", ikon: "\u2734", tier: "rare",
    mult: { atk: 0.88 }
  },
  {
    id: "sehat", nama: "VITALITAS", ket: "+25 Max HP & sembuhkan 25",
    bobot: 22, warna: "#22d3ee", ikon: "\u2665", tier: "common",
    additif: true,
    mult: { hpA: 25 }
  },
  {
    id: "regenerasi", nama: "REGENERASI", ket: "+0.5 HP per detik",
    bobot: 16, warna: "#4ade80", ikon: "\u271A", tier: "common",
    additif: true,
    mult: { regen: 0.5 }
  },
  {
    id: "jurus", nama: "SKILL CEPAT", ket: "-15% cooldown skill (Q/K)",
    bobot: 14, warna: "#a78bfa", ikon: "\u2726", tier: "rare",
    mult: { special: 0.85 }
  },
  {
    id: "status", nama: "STATUS MENGUAT", ket: "+50% durasi beku & bakar",
    bobot: 13, warna: "#67e8f9", ikon: "\u2744", tier: "epic",
    mult: { status: 1.5 }
  },
  {
    id: "dash", nama: "DASH +1", ket: "+1 charge dash",
    bobot: 12, warna: "#94a3b8", ikon: "\u27A1", tier: "rare",
    additif: true,
    mult: { dash: 1 }
  },
  {
    id: "kritik", nama: "KRITIS", ket: "+12% peluang damage 2x",
    bobot: 12, warna: "#fbbf24", ikon: "\u2605", tier: "epic",
    additif: true,
    mult: { crit: 0.12 }
  },
  {
    id: "perisai", nama: "PERISAI", ket: "-12% damage yang diterima",
    bobot: 11, warna: "#fb7185", ikon: "\u25C8", tier: "rare",
    additif: true,
    mult: { armor: 0.12 }
  },
  {
    id: "jiwa", nama: "JIWA GANDA", ket: "Serapan jiwa 2x (ultimate lebih cepat)",
    bobot: 8, warna: "#facc15", ikon: "\u2620", tier: "epic",
    mult: { jiwa: 2 }
  },
  // Khusus TIPE DEKAT (tebasan): jangkauan & sudut ayunan.
  {
    id: "jangkau", nama: "JANGKAUAN", ket: "+12% jangkauan tebasan",
    bobot: 15, warna: "#fb923c", ikon: "\u2194", tier: "common",
    cocok: punyaTebasan,
    mult: { reach: 1.12 }
  },
  {
    id: "tebasan", nama: "TEBASAN LUAS", ket: "+14% sudut ayunan",
    bobot: 12, warna: "#f97316", ikon: "\u27B0", tier: "rare",
    cocok: punyaTebasan,
    mult: { halfA: 1.14 }
  },
  // Khusus TIPE JARAK (panah): kecepatan peluru.
  {
    id: "panah", nama: "PANAH KENCANG", ket: "+16% kecepatan panah",
    bobot: 15, warna: "#7dd3fc", ikon: "\u27B3", tier: "rare",
    cocok: punyaPanah,
    mult: { bSpeed: 1.16 }
  },
  // Kartu LEGEND: AUTO AIM. Bukan stat biasa — bendera (flag) yang mengubah
  // cara bidik: di HP tombol serang jadi tombol biasa (tanpa joystick bidik,
  // otomatis ke musuh terdekat), di desktop klik kiri = bidik otomatis ke
  // musuh terdekat. Bobot kecil sekali karena "legend".
  {
    id: "bidik", nama: "AUTO AIM", ket: "Serang otomatis mengarah ke musuh terdekat",
    bobot: 4, warna: "#fde047", ikon: "\u25CE", tier: "legend"
  }
];

// Tiga kartu yang sedang ditawarkan (id). Lokasi & ukuran kartu dibagi
// antara draw.js (render) dan input.js (klik) via rectKartuUpgrade.
let pilihanKartu = null;
let kartuMulaiPada = 0; // performance.now() saat kartu tampil (animasi masuk).
let kartuHover = -1;

// Batas atas (cap) agar stacking tidak membabi buta.
const CAP_KARTU = { speed: 1.7, damage: 2.2, atk: 0.45, reach: 1.6, halfA: 1.5, bSpeed: 1.6, special: 0.5, status: 2.0, hpA: 150, regen: 3, dash: 3, jiwa: 3, crit: 0.6, armor: 0.6 };

// Ambil n kartu unik, pilih oleh bobot. Kartu yang tak cocok karakter
// (mis. durasi beku untuk Vender) tidak dimasukkan ke dalam undian.
// Kartu yang sudah mencapai maks stack tier-nya tidak ditawarkan lagi
// (common x3, rare x2, epic x1). Peluang muncul dikalikan faktor tier
// (bobotKali) supaya rare lebih jarang daripada common dan epic paling jarang.
function buatPilihanKartu(n) {
  const pool = KARTU_UPGRADE.filter((k) => {
    const maks = (TIER_DEF[k.tier || "common"] || TIER_DEF.common).maks;
    return (
      (!k.cocok || k.cocok(karakter)) &&
      (!player || !player.kartu[k.id] || player.kartu[k.id] < maks)
    );
  });
  if (pool.length < n) return pool.map((k) => k.id);
  const hasil = [];
  const sisa = pool.slice();
  for (let i = 0; i < n; i++) {
    // Berat tiap kartu = bobot dasar x pengali tier.
    const berat = sisa.map((k) => {
      const t = TIER_DEF[k.tier || "common"] || TIER_DEF.common;
      return k.bobot * (t.bobotKali || 1);
    });
    const total = berat.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (let j = 0; j < sisa.length; j++) {
      r -= berat[j];
      if (r <= 0) { idx = j; break; }
    }
    hasil.push(sisa.splice(idx, 1)[0].id);
  }
  return hasil;
}

// Rekalkulasi stat player dari base (karakter) dikali pengali kartu + cap.
// Dipanggil saat resetArena dan setiap kartu dipilih.
function hitungStatKartu() {
  const b = player.base, m = player.mult;
  const cap = (v, min, max) => Math.max(min, Math.min(max, v));
  player.speed = Math.round(b.speed * m.speed);
  player.damage = Math.round(b.damage * m.damage);
  player.attackRate = Math.max(0.06, b.attackRate * m.atk);
  // Tipe dekat: jangkauan & sudut ayunan. Tipe jarak: kecepatan panah.
  player.reach = Math.round(b.reach * m.reach);
  player.halfArc = b.halfArc * m.halfA;
  player.swingDuration = b.swingDuration;
  player.bulletSpeed = Math.round(b.bulletSpeed * m.bSpeed);
  player.buffDurasi = b.buffDurasi;
  player.bekuDurasi = b.bekuDurasi * m.status;
  player.burnDurasi = b.burnDurasi * m.status;
  player.specialMax = Math.max(1, b.specialMax * m.special);
  player.maxHp = Math.round(b.maxHp + m.hpA);
  player.hp = Math.min(player.hp, player.maxHp);
  player.regen = m.regen;
  player.jiwaKali = m.jiwa;
  player.dashMax = b.dashMax + m.dash;
  if (player.dashStacks < player.dashMax) player.dashStacks = player.dashMax;
  // Kritis & perisai (kartu umum, berlaku semua karakter).
  player.crit = m.crit;
  player.armor = m.armor;
}

// Buka layar pilih kartu (dipanggil levelSelesai). Game membeku sejenak.
function mulaiKartuUpgrade() {
  statusGame = "upgrade";
  levelBanner = null; // hapus banner "WAVES N" agar tidak bertumpuk dengan kartu.
  pilihanKartu = buatPilihanKartu(3);
  // Semua kartu sudah 3x diambil -> lewati layar pilih, langsung lanjut wave.
  if (!pilihanKartu.length) {
    lanjutKartuKeLevel();
    return;
  }
  kartuMulaiPada = performance.now();
  kartuHover = -1;
  if (typeof sfxLevel === "function") sfxLevel();
  // Jeda SFX saat pemilihan kartu (dilanjutkan saat game berjalan lagi).
  if (typeof sinkronSfxTerjeda === "function") sinkronSfxTerjeda();
}

// Pemain memilih kartu ke-i (0..2). Terapkan lalu lanjut ke wave berikutnya.
function pilihKartuUpgrade(i) {
  if (!pilihanKartu || statusGame !== "upgrade") return;
  if (performance.now() - kartuMulaiPada < 250) return; // "jeda sebentar".
  const id = pilihanKartu[i];
  if (!id) return;
  const kart = KARTU_UPGRADE.find((k) => k.id === id);
  if (!kart) return;
  player.kartu[id] = (player.kartu[id] || 0) + 1;
  if (kart.additif) {
    // Kartu penambah (HP max, regen, charge dash): nilai dijumlah bertahap.
    for (const key in kart.mult) {
      const nx = player.mult[key] + kart.mult[key];
      player.mult[key] = CAP_KARTU[key] !== undefined ? Math.min(CAP_KARTU[key], nx) : nx;
    }
  } else {
    // Kartu pengali (kecepatan, damage, dll): dikalikan, dengan cap.
    for (const key in kart.mult) {
      const cur = player.mult[key] + kart.mult[key] - 1;
      player.mult[key] = CAP_KARTU[key] !== undefined
        ? (key === "atk" || key === "special"
            ? Math.max(CAP_KARTU[key], cur)
            : Math.min(CAP_KARTU[key], cur))
        : cur;
    }
  }
  hitungStatKartu();
  if (kart.mult.hpA) {
    player.hp = Math.min(player.maxHp, player.hp + kart.mult.hpA);
  }
  if (typeof spawnParticles === "function") spawnParticles(player.x, player.y - 40, kart.warna, 18);
  if (typeof sfxKlik === "function") sfxKlik();
  perbaruiNotaKartu();
  lanjutKartuKeLevel();
}

// Setelah kartu dipilih: lanjut ke level berikutnya.
function lanjutKartuKeLevel() {
  statusGame = "main";
  pilihanKartu = null;
  level += 1;
  levelSpawn = 0;
  spawnTimer = 0.6;
  if (typeof sinkronSfxTerjeda === "function") sinkronSfxTerjeda();
  if (typeof tampilkanBannerLevel === "function") tampilkanBannerLevel(level);
}

// Geometri kartu ke-i (dibagi draw.js & input.js agar klik pas dengan gambar).
function rectKartuUpgrade(i) {
  const jml = 3;
  const gap = Math.round(W * 0.025);
  const cw = Math.round(Math.min(W * 0.21, 300));
  const ch = Math.round(cw * 1.25);
  const total = cw * jml + gap * (jml - 1);
  const x0 = Math.round((W - total) / 2);
  const y = Math.round(H * 0.42);
  return { x: Math.round(x0 + (cw + gap) * i), y: y, w: cw, h: ch };
}

// Kartu mana yang diklik (koordinat canvas). -1 = tidak ada.
function kartuIndexDariKlik(mx, my) {
  if (!pilihanKartu) return -1;
  for (let i = 0; i < pilihanKartu.length; i++) {
    const r = rectKartuUpgrade(i);
    if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) return i;
  }
  return -1;
}

// Panel di samping kiri *di luar area game*: daftar kartu/upgrade yang
// sudah diambil. Dibangun ulang dari player.kartu tiap kali berubah
// (dipanggil dari pilihKartuUpgrade dan resetArena).
function perbaruiNotaKartu() {
  const isi = document.getElementById("notaKartuIsi");
  if (!isi) return;
  isi.innerHTML = "";
  const kartu = player.kartu || {};
  const kosong = document.getElementById("notaKartuKosong");
  if (kosong) kosong.classList.toggle("hidden", Object.keys(kartu).length > 0);
  for (const id in kartu) {
    const k = KARTU_UPGRADE.find((c) => c.id === id);
    if (!k) continue;
    // Penanda tier di panel samping: berlian kecil berwarna tier + garis
    // kiri senada, di sebelah kiri logo (ikon) kartu.
    const tierDef = TIER_DEF[k.tier || "common"] || TIER_DEF.common;
    const warnaTier = tierDef.gem || "#f3e5c0";
    const baris = document.createElement("div");
    baris.className = "kartu-note";
    baris.style.borderLeft = "3px solid " + warnaTier;
    const gem = document.createElement("span");
    gem.className = "kartu-note-gem";
    gem.textContent = "\u25C6";
    gem.style.color = warnaTier;
    const bulat = document.createElement("span");
    bulat.className = "kartu-note-bulat";
    bulat.style.background = k.warna;
    bulat.textContent = k.ikon;
    // Lencana jumlah di pojok logo: menampilkan berapa kartu yang ditumpuk.
    const jml = document.createElement("span");
    jml.className = "kartu-note-jml";
    jml.textContent = kartu[id];
    // Nama tersimpan sebagai tooltip (hover/ketuk tahan) agar panel tetap ringkas.
    baris.title = k.nama;
    baris.appendChild(gem);
    bulat.appendChild(jml);
    baris.appendChild(bulat);
    isi.appendChild(baris);
  }
}