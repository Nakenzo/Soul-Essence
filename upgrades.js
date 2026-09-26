const TIER_DEF = {
  common: { maks: 3, bobotKali: 1.0, garis: "#59492f", aksen: "#9a7b3c", gem: "#f3e5c0",
    bg: { gelap: "#f3ecd9", hover: "#fbf7ea" } },
  rare: { maks: 2, bobotKali: 0.65, garis: "#1d4ed8", aksen: "#164ea0", gem: "#4aa8ff",
    bg: { gelap: "#93b8ee", hover: "#b7d4f6" } },
  epic: { maks: 1, bobotKali: 0.35, garis: "#6d28d9", aksen: "#f59e0b", gem: "#c084fc",
    bg: { gelap: "#c5adff", hover: "#dbc8ff" } },

  legend: { maks: 1, bobotKali: 0.18, garis: "#b8860b", aksen: "#fbbf24", gem: "#fde047",
    bg: { gelap: "#fde68a", hover: "#fef3c7" } }
};
const MAKS_STACK = Object.keys(TIER_DEF).reduce((a, t) => { a[t] = TIER_DEF[t].maks; return a; }, {});

function cekTipe(k, tipe) { return k.tipe === tipe; }
function punyaTebasan(k) { return cekTipe(k, "dekat") || (k.reach || 0) > 0; }
function punyaPanah(k) { return cekTipe(k, "jarak"); }

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

  {
    id: "panah", nama: "PANAH KENCANG", ket: "+16% kecepatan panah",
    bobot: 15, warna: "#7dd3fc", ikon: "\u27B3", tier: "rare",
    cocok: punyaPanah,
    mult: { bSpeed: 1.16 }
  },

  {
    id: "bidik", nama: "AUTO AIM", ket: "Serang otomatis mengarah ke musuh terdekat",
    bobot: 4, warna: "#fde047", ikon: "\u25CE", tier: "legend"
  },

  {
    id: "darahKetiga", nama: "DARAH KETIGA", ket: "+15 HP setiap selesai wave",
    bobot: 14, warna: "#f472b6", ikon: "\u2665", tier: "epic"
  },

  {
    id: "freezeArea", nama: "FREEZE AREA", ket: "Musuh dekat 120px melambat 30%",
    bobot: 12, warna: "#7dd3fc", ikon: "\u2744", tier: "epic"
  },

  {
    id: "koinBonus", nama: "KOIN BONUS", ket: "+15% koin per kill",
    bobot: 15, warna: "#fbbf24", ikon: "\u25CE", tier: "rare",
    mult: { koin: 1.15 }
  },

  {
    id: "duriBalik", nama: "DURI BALIK", ket: "15% damage balik ke penyerang",
    bobot: 12, warna: "#fb7185", ikon: "\u21A9", tier: "rare",
    cocok: punyaTebasan
  },

  {
    id: "pencuriDarah", nama: "PENCURI DARAH", ket: "8% damage diserap jadi HP",
    bobot: 5, warna: "#ef4444", ikon: "\u2666", tier: "legend"
  },

  {
    id: "nyawaKedua", nama: "NYAWA KEDUA", ket: "Hidup sekali (30% HP), kartu hilang",
    bobot: 5, warna: "#fde047", ikon: "\u271A", tier: "legend"
  }
];

let pilihanKartu = null;
let kartuMulaiPada = 0;
let kartuHover = -1;

const CAP_KARTU = { speed: 1.7, damage: 2.2, atk: 0.45, reach: 1.6, halfA: 1.5, bSpeed: 1.6, special: 0.5, status: 2.0, hpA: 150, regen: 3, dash: 3, jiwa: 3, crit: 0.6, armor: 0.6, koin: 1.5 };

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

function hitungStatKartu() {
  const b = player.base, m = player.mult;
  const cap = (v, min, max) => Math.max(min, Math.min(max, v));
  player.speed = Math.round(b.speed * m.speed);
  player.damage = Math.round(b.damage * m.damage);
  player.attackRate = Math.max(0.06, b.attackRate * m.atk);

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

  player.crit = m.crit;
  player.armor = m.armor;
}

function mulaiKartuUpgrade() {
  statusGame = "upgrade";
  levelBanner = null;
  pilihanKartu = buatPilihanKartu(3);

  if (!pilihanKartu.length) {
    lanjutKartuKeLevel();
    return;
  }
  kartuMulaiPada = performance.now();
  kartuHover = -1;
  if (typeof sfxLevel === "function") sfxLevel();

  if (typeof sinkronSfxTerjeda === "function") sinkronSfxTerjeda();
}

function pilihKartuUpgrade(i) {
  if (!pilihanKartu || statusGame !== "upgrade") return;
  if (performance.now() - kartuMulaiPada < 250) return;
  const id = pilihanKartu[i];
  if (!id) return;
  const kart = KARTU_UPGRADE.find((k) => k.id === id);
  if (!kart) return;
  player.kartu[id] = (player.kartu[id] || 0) + 1;
  if (kart.additif) {

    for (const key in kart.mult) {
      const nx = player.mult[key] + kart.mult[key];
      player.mult[key] = CAP_KARTU[key] !== undefined ? Math.min(CAP_KARTU[key], nx) : nx;
    }
  } else {

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
  if (kart.mult && kart.mult.hpA) {
    player.hp = Math.min(player.maxHp, player.hp + kart.mult.hpA);
  }
  if (typeof spawnParticles === "function") spawnParticles(player.x, player.y - 40, kart.warna, 18);
  if (typeof sfxKlik === "function") sfxKlik();
  perbaruiNotaKartu();
  lanjutKartuKeLevel();
}

function lanjutKartuKeLevel() {
  statusGame = "main";
  pilihanKartu = null;
  level += 1;
  levelSpawn = 0;
  spawnTimer = 0.6;
  if (typeof sinkronSfxTerjeda === "function") sinkronSfxTerjeda();
  if (typeof tampilkanBannerLevel === "function") tampilkanBannerLevel(level);
}

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

function kartuIndexDariKlik(mx, my) {
  if (!pilihanKartu) return -1;
  for (let i = 0; i < pilihanKartu.length; i++) {
    const r = rectKartuUpgrade(i);
    if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) return i;
  }
  return -1;
}

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

    const jml = document.createElement("span");
    jml.className = "kartu-note-jml";
    jml.textContent = kartu[id];

    baris.title = k.nama;
    baris.appendChild(gem);
    bulat.appendChild(jml);
    baris.appendChild(bulat);
    isi.appendChild(baris);
  }
}
