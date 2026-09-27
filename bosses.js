// bosses.js — definisi data tiap bos (bersama mesin fase/serangannya).
// Bos muncul di level ke-3 tiap map. Tambah bos = tambah satu objek di BOSS_DEF
// lalu set `bos: "<kunci>"` pada baris gelombang bos di levels.js.
// Kolom angka (hp, serang, dmg, warnaBar) dibaca mesin; `renderer` memilih gambar.

const KOIN_BOS = 5000;

const BOSS_DEF = {
  "raja-slime": {
    kunci: "raja-slime",
    nama: "RAJA SLIME",
    renderer: "slime",

    r: 72,
    skala: 2.4,
    warna: "#14532d",
    kecepatan: 52.5,

    hp: 2800,
    hpPerLevel: 60,

    minionTotal: 3,
    jedaSerang: 1.2,

    transisi: { durasi: 1.8, damageKali: 1.5 },

    // Pola dasar. Nilai per-fase ada di `fase`.
    serangan: {
      slam: { telegraf: 0.70, combo: 1, jedaCombo: 0.45 },
      spora: { telegraf: 0.50 },
      tarik: { telegraf: 0.60, durasi: 1.0 },
      charge: { telegraf: 0.70, durasi: 0.55, speedKali: 6.2, repuh: 0.6, jalanHazard: true },
      barrage: { telegraf: 0.50, jedaTahap: 0.9 }
    },

    // `mulai` = ambang HP (fraKsi) tempat fase ini dimulai, dari atas ke bawah.
    fase: [
      {
        mulai: 1.00, gerak: 1.00,
        dmgKontak: 45, dmgSlam: 40, radiusSlam: 2.30,
        jedaSerangan: 2.6,
        serang: ["slam", "spora"],
        sporaJumlah: 8, sporaDmg: 10, sporaSpeed: 150,
        tarikGaya: 0,
        spawn: "jamur",
        warnaBar: "#4ade80"
      },
      {
        mulai: 0.65, gerak: 1.15,
        dmgKontak: 50, dmgSlam: 45, radiusSlam: 2.50,
        jedaSerangan: 2.1,
        serang: ["slam", "tarik", "charge"],
        sporaJumlah: 12, sporaDmg: 14, sporaSpeed: 165,
        tarikGaya: 220,
        spawn: "semak",
        warnaBar: "#facc15"
      },
      {
        mulai: 0.30, gerak: 1.30,
        dmgKontak: 55, dmgSlam: 50, radiusSlam: 2.70,
        jedaSerangan: 1.7,
        serang: ["slam", "spora", "tarik", "charge", "barrage"],
        sporaJumlah: 16, sporaDmg: 18, sporaSpeed: 180,
        tarikGaya: 280,
        spawn: "jamur",
        enrage: true,
        warnaBar: "#ef4444"
      }
    ]
  }
};

function definisiBos(kunci) {
  return Object.prototype.hasOwnProperty.call(BOSS_DEF, kunci) ? BOSS_DEF[kunci] : null;
}

// HP bos mengikuti level karakter pemain: 2800 + 60 per level.
function hpBos(def) {
  const lv = karakter && typeof levelKarakter === "function" ? levelKarakter(karakter.kunci) : 0;
  return Math.max(200, Math.round(def.hp + (def.hpPerLevel || 0) * lv));
}

// Fase aktif = fase terakhir yang `mulai`-nya masih di atas rasio HP ini.
// `mulai` menurun (1.00, 0.65, 0.30): rasio 0.8 masih fase 1, 0.64 sudah fase 2.
function cariFaseBos(def, rasio) {
  let hasil = 0;
  for (let i = 0; i < def.fase.length; i++) {
    if (def.fase[i].mulai > rasio) hasil = i;
  }
  return hasil;
}

// "#4ade80" + 0.4 -> "rgba(74,222,128,0.4)"
function warnaRGBA(hex, a) {
  let h = String(hex || "#ffffff").replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  if (isNaN(n)) return "rgba(255,255,255," + a + ")";
  return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
}
