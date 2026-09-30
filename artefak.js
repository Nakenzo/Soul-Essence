// SISTEM ARTEFAK (desain ala Genshin: rarity 1-5 bintang)
//
// 4 slot per karakter: crown, armor, legging, boots.
// Boleh dicampur antar set, jadi player bebas milih set mana yang
// dipakai di slot mana.
//
// SET BONUS BERTINGKAT (pola Genshin):
//   2 slot dari set yang sama  -> bonus2 aktif
//   4 slot dari set yang sama  -> bonus2 + bonus4 aktif
//
// RARITAS 1-5 BINTANG:
//   - ditetapkan saat piece pertama kali drop (semakin dalam wave, semakin
//     besar chance dapat bintang tinggi).
//   - cap level piece = bintang * 4 (4/8/12/16/20).
//   - jumlah substat saat drop = sesuai tabel ARTEFAK_BINTANG.
//   - setiap level threshold (ARTEFAK_SUBSTAT_NAIK_PADA) ada roll Genshin:
//     65% tambah substat baru, sisanya naikkan substat yang sudah ada.
//   - piece yang sudah dimiliki bisa "naik bintang" kalau drop berikutnya
//     memberi rarity lebih tinggi (level dipertahankan, substat diacak ulang).
//
// STAT UTAMA PER SLOT:
//   crown selalu HP, armor selalu damage (dari ARTEFAK_SLOT[*].stat).
//   legging & boots fleksibel, ikut set.stat dari ARTEFAK_SET.
//
// Koleksi artefak milik player secara global (bukan per karakter), tapi
// pemasangannya per karakter. Jadi satu artefak bisa dipakai Kenzro di
// crown dan Rin di boots.
//
// Tambah set baru = tambah 1 objek ke ARTEFAK_SET (config.js) + 1 ikon di
// menu.js. Slot per karakter dibaca otomatis dari ARTEFAK_SLOT.

const ARTEFAK_ID_PANJANG_MAX = 40;

// Nama stat yang boleh dipakai set/substat. Harus sama dengan stat yang
// dipakai bonusStatKarakter() di save.js.
const ARTEFAK_STAT_DAERAH = ["hp", "damage", "kecepatan"];

function artefakSlotAda(kunci) {
  for (let i = 0; i < ARTEFAK_SLOT.length; i++) {
    if (ARTEFAK_SLOT[i].kunci === kunci) return true;
  }
  return false;
}

function artefakId(setKunci, slotKunci) {
  return setKunci + "_" + slotKunci;
}

function artefakCari(id) {
  if (typeof id !== "string" || !id) return null;
  const potong = id.split("_");
  if (potong.length !== 2) return null;
  for (let i = 0; i < ARTEFAK_SET.length; i++) {
    const set = ARTEFAK_SET[i];
    if (set.kunci === potong[0] && artefakSlotAda(potong[1])) {
      return { id: id, set: set, slot: potong[1] };
    }
  }
  return null;
}

function artefakDimiliki(id) {
  if (!artefakCari(id)) return false;
  return artefakLevel(id) > 0;
}

// Rarity piece: 1-5. Piece dari save lama (belum punya artefakBintang)
// dianggap 3 bintang (biru) agar tetap valid.
function artefakBintang(id) {
  if (!artefakCari(id)) return 0;
  const b = progres.artefakBintang ? progres.artefakBintang[id] : 0;
  return Number.isInteger(b) ? Math.min(Math.max(b, 1), 5) : 3;
}

function artefakBintangDef(id) {
  const b = artefakBintang(id);
  if (b < 1 || b > ARTEFAK_BINTANG.length) return ARTEFAK_BINTANG[2] || ARTEFAK_BINTANG[0];
  return ARTEFAK_BINTANG[b - 1];
}

// Cap level sesuai rarity; source of truth semua batas naik level.
function artefakCapLevel(id) {
  const def = artefakBintangDef(id);
  return Math.min(ARTEFAK_LEVEL_MAX, def.cap);
}

function artefakLevel(id) {
  if (!artefakCari(id)) return 0;
  const lv = progres.artefakMilik ? progres.artefakMilik[id] : 0;
  const bersih = Number.isInteger(lv) ? Math.min(Math.max(lv, 0), ARTEFAK_LEVEL_MAX) : 0;
  return Math.min(bersih, artefakCapLevel(id));
}

function artefakBiayaNaik(id) {
  const lv = artefakLevel(id);
  if (lv <= 0) return Infinity;
  if (lv >= artefakCapLevel(id)) return Infinity;
  return 300 * lv;
}

// STAT UTAMA PER SLOT (Genshin-style). crown -> hp, armor -> damage,
// legging/boots -> set.stat. Dipakai oleh bonusArtefak & kartu UI.
function artefakStatUtama(set, slotKunci) {
  const utama = {};
  for (let i = 0; i < ARTEFAK_SLOT.length; i++) {
    if (ARTEFAK_SLOT[i].kunci === slotKunci && ARTEFAK_SLOT[i].stat) {
      const s = ARTEFAK_SLOT[i].stat;
      for (const k in s) if (Object.prototype.hasOwnProperty.call(s, k)) utama[k] = s[k];
      return utama;
    }
  }
  if (set && set.stat) {
    for (const k in set.stat) if (Object.prototype.hasOwnProperty.call(set.stat, k)) utama[k] = set.stat[k];
  }
  return utama;
}

// SUBSTAT
// Bentuknya: { hp: 0.03, kecepatan: 0.02 }  (stat berbeda-beda)

function validBintang(bintang) {
  return Number.isInteger(bintang) && bintang >= 1 && bintang <= 5 ? bintang : 3;
}

// Roll substat saat piece baru drop. Jumlah awal dari rarity piece,
// nilainya dikali pengali rarity. Stat tidak boleh dobel.
function acakSubstat(bintang) {
  const def = ARTEFAK_BINTANG[validBintang(bintang) - 1];
  const jumlah = Math.min(ARTEFAK_SUBSTAT_MAKS, Math.max(1, def.substat));
  const kandidat = [];
  for (let i = 0; i < ARTEFAK_SUBSTAT_POOL.length; i++) kandidat.push(ARTEFAK_SUBSTAT_POOL[i]);
  for (let i = kandidat.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tukar = kandidat[i];
    kandidat[i] = kandidat[j];
    kandidat[j] = tukar;
  }
  const hasil = {};
  let dipakai = 0;
  for (let i = 0; i < kandidat.length && dipakai < jumlah; i++) {
    const s = kandidat[i];
    if (!s || typeof s.stat !== "string" || hasil[s.stat] !== undefined) continue;
    hasil[s.stat] = Math.round((s.nilai * def.kali) * 10000) / 10000;
    dipakai++;
  }
  return hasil;
}

// Baca substat dari save, buang yang rusak. Null kalau tidak punya / belum drop.
function artefakSubstat(id) {
  if (!artefakCari(id)) return null;
  const mentah = progres.artefakSubstat ? progres.artefakSubstat[id] : null;
  if (!mentah || typeof mentah !== "object") return null;
  const hasil = {};
  let jumlah = 0;
  for (let i = 0; i < ARTEFAK_STAT_DAERAH.length && jumlah < ARTEFAK_SUBSTAT_MAKS; i++) {
    const k = ARTEFAK_STAT_DAERAH[i];
    const v = mentah[k];
    if (Number.isFinite(v) && v !== 0) {
      hasil[k] = v;
      jumlah++;
    }
  }
  return jumlah > 0 ? hasil : null;
}

// ROLL GENSHIN saat naik level: 65% tambah substat baru (kalau masih ada
// slot), sisanya naikkan substat acak yang sudah ada. Nilai dikali rarity.
function substatProsesNaik(id) {
  const def = artefakBintangDef(id);
  let sub = artefakSubstat(id) || {};
  sub = Object.assign({}, sub);
  progres.artefakSubstat = progres.artefakSubstat || {};

  const jumlah = Object.keys(sub).length;
  if (jumlah < ARTEFAK_SUBSTAT_MAKS && Math.random() < 0.65) {
    const tersisa = [];
    for (let i = 0; i < ARTEFAK_SUBSTAT_POOL.length; i++) {
      const p = ARTEFAK_SUBSTAT_POOL[i];
      if (!sub[p.stat]) tersisa.push(p);
    }
    if (tersisa.length) {
      const p = tersisa[Math.floor(Math.random() * tersisa.length)];
      sub[p.stat] = Math.round((p.nilai * def.kali) * 10000) / 10000;
      progres.artefakSubstat[id] = sub;
      saveTulis();
      return sub;
    }
  }

  const yangAda = ARTEFAK_STAT_DAERAH.filter(function (k) { return Number.isFinite(sub[k]); });
  if (yangAda.length) {
    const k = yangAda[Math.floor(Math.random() * yangAda.length)];
    let base = 0;
    for (let i = 0; i < ARTEFAK_SUBSTAT_POOL.length; i++) {
      if (ARTEFAK_SUBSTAT_POOL[i].stat === k) { base = ARTEFAK_SUBSTAT_POOL[i].nilai; break; }
    }
    const tambah = Math.round((base * def.kali * 0.6) * 10000) / 10000;
    sub[k] = Math.round((sub[k] + tambah) * 10000) / 10000;
    progres.artefakSubstat[id] = sub;
    saveTulis();
  }
  return sub;
}

function artefakNaikLevel(id) {
  if (!artefakDimiliki(id)) return false;
  if (artefakLevel(id) >= artefakCapLevel(id)) return false;
  const biaya = artefakBiayaNaik(id);
  if (!Number.isFinite(biaya) || progres.koinSaldo < biaya) return false;
  progres.koinSaldo -= biaya;
  if (!progres.artefakMilik) progres.artefakMilik = {};
  const lvBaru = artefakLevel(id) + 1;
  progres.artefakMilik[id] = lvBaru;
  if (ARTEFAK_SUBSTAT_NAIK_PADA.indexOf(lvBaru) !== -1 && lvBaru <= artefakCapLevel(id)) {
    substatProsesNaik(id);
  }
  saveTulis();
  return true;
}

// Level piece naik ke levelAwal (dipakai drop & admin). Kalau piece belum
// ada, set rarity-nya lalu roll substat awal. bintang opsional.
function artefakBeri(id, levelAwal, bintang) {
  if (!artefakCari(id)) return false;
  const lv = Number.isInteger(levelAwal) ? levelAwal : 1;
  const def = ARTEFAK_BINTANG[validBintang(bintang) - 1];
  if (artefakLevel(id) > 0) {
    if (artefakLevel(id) >= artefakCapLevel(id)) return false;
    if (!progres.artefakMilik) progres.artefakMilik = {};
    progres.artefakMilik[id] = artefakLevel(id) + 1;
  } else {
    if (!progres.artefakMilik) progres.artefakMilik = {};
    if (!progres.artefakSubstat) progres.artefakSubstat = {};
    if (!progres.artefakBintang) progres.artefakBintang = {};
    progres.artefakMilik[id] = Math.min(Math.max(lv, 1), def.cap);
    if (!progres.artefakBintang[id]) progres.artefakBintang[id] = def.bintang;
    if (!artefakSubstat(id)) progres.artefakSubstat[id] = acakSubstat(def.bintang);
  }
  saveTulis();
  return true;
}

// Piece yang sudah dimiliki dapat rarity lebih tinggi dari drop berikutnya
// -> "naik bintang": rarity baru, level dipertahankan, substat diacak ulang.
function artefakNaikBintang(id, bintang) {
  if (!artefakCari(id) || !artefakDimiliki(id)) return false;
  const b = validBintang(bintang);
  if (b <= artefakBintang(id)) return false;
  if (!progres.artefakBintang) progres.artefakBintang = {};
  if (!progres.artefakSubstat) progres.artefakSubstat = {};
  progres.artefakBintang[id] = b;
  progres.artefakSubstat[id] = acakSubstat(b);
  saveTulis();
  return true;
}

// DROP ARTEFAK
// Rarity naik seiring wave: semakin dalam main, semakin besar chance
// 4-5 bintang. Ada sedikit luck (18% naik 1 tingkat di atas hasil dasar).

function dropRaritas() {
  const nTotal = (typeof LEVELS !== "undefined" && LEVELS && LEVELS.length)
    ? LEVELS.length
    : 12;
  const wSekarang = (typeof level === "number" && Number.isFinite(level)) ? Math.max(0, level) : 0;
  const pRasio = Math.min(1, Math.max(0, wSekarang / Math.max(1, nTotal - 1)));
  let b = 1 + Math.floor(pRasio * 5);
  if (b > 5) b = 5;
  if (b < 5 && Math.random() < 0.18) b++;
  return Math.min(5, Math.max(1, b));
}

const ARTEFAK_DROP_CHANCE = 0.85;

let artefakBaruTerakhir = null;

function dropArtefak() {
  if (Math.random() > ARTEFAK_DROP_CHANCE) return null;

  const bintang = dropRaritas();
  const belum = [];
  const punya = [];
  for (const set of ARTEFAK_SET) {
    for (const slot of ARTEFAK_SLOT) {
      const id = artefakId(set.kunci, slot.kunci);
      if (artefakLevel(id) <= 0) belum.push(id);
      else if (artefakLevel(id) < artefakCapLevel(id)) punya.push(id);
    }
  }

  if (belum.length) {
    const id = belum[Math.floor(Math.random() * belum.length)];
    artefakBeri(id, 1, bintang);
    return { id: id, baru: true, lv: artefakLevel(id), bintang: artefakBintang(id) };
  }
  if (punya.length) {
    const id = punya[Math.floor(Math.random() * punya.length)];
    const bLama = artefakBintang(id);
    if (bintang > bLama) {
      artefakNaikBintang(id, bintang);
      return {
        id: id,
        baru: false,
        lv: artefakLevel(id),
        bintang: artefakBintang(id),
        naikBintang: true
      };
    }
    artefakBeri(id, artefakLevel(id) + 1);
    return { id: id, baru: false, lv: artefakLevel(id), bintang: bLama };
  }
  return null;
}

function artefakPakai(kunci) {
  const hasil = {};
  const simpan = progres.artefakPakai ? progres.artefakPakai[kunci] : null;
  for (let i = 0; i < ARTEFAK_SLOT.length; i++) {
    const slot = ARTEFAK_SLOT[i].kunci;
    let id = simpan && typeof simpan[slot] === "string" ? simpan[slot] : null;
    // save bisa berisi artefak yang sudah tidak ada / belum dimiliki -> abaikan
    if (id) {
      const cari = artefakCari(id);
      if (!cari || cari.slot !== slot || artefakLevel(id) <= 0) id = null;
    }
    hasil[slot] = id;
  }
  return hasil;
}

function pasangArtefak(kunci, slot, id) {
  if (!artefakSlotAda(slot)) return false;
  if (id === null || id === undefined) {
    if (!progres.artefakPakai) progres.artefakPakai = {};
    if (!progres.artefakPakai[kunci]) progres.artefakPakai[kunci] = {};
    progres.artefakPakai[kunci][slot] = null;
    saveTulis();
    return true;
  }
  const cari = artefakCari(id);
  if (!cari || cari.slot !== slot) return false;
  if (!artefakDimiliki(id)) return false;
  if (!progres.artefakPakai) progres.artefakPakai = {};
  if (!progres.artefakPakai[kunci]) progres.artefakPakai[kunci] = {};
  progres.artefakPakai[kunci][slot] = id;
  saveTulis();
  return true;
}

// SET BONUS BERTINGKAT
// Hitung berapa slot yang terisi dari tiap set.
// Contoh 4 slot: 4A -> {es:4}      (bonus2 + bonus4 aktif)
//                2A+2B -> {es:2,bara:2} (dua-duanya bonus2 aktif)
function setArtefakHitung(kunci) {
  const pakai = artefakPakai(kunci);
  const out = {};
  for (let i = 0; i < ARTEFAK_SLOT.length; i++) {
    const id = pakai[ARTEFAK_SLOT[i].kunci];
    if (!id) continue;
    const cari = artefakCari(id);
    if (!cari) continue;
    out[cari.set.kunci] = (out[cari.set.kunci] || 0) + 1;
  }
  return out;
}

// Daftar set yang sedang aktif, diurut dari yang paling lengkap.
// Tiap entri: { set, jumlah, tier2, tier4, kunci }
function setArtefakAktif(kunci) {
  const hitung = setArtefakHitung(kunci);
  const hasil = [];
  for (let i = 0; i < ARTEFAK_SET.length; i++) {
    const set = ARTEFAK_SET[i];
    const n = hitung[set.kunci] || 0;
    if (n < 2) continue;
    hasil.push({
      set: set,
      kunci: set.kunci,
      jumlah: n,
      tier2: true,
      tier4: n >= 4
    });
  }
  hasil.sort((a, b) => b.jumlah - a.jumlah);
  return hasil;
}

// Bonus dari piece-nya sendiri: stat utama per slot (dikali level & rarity)
// + substat yang sudah dikumpulkan.
function bonusArtefak(kunci) {
  const pakai = artefakPakai(kunci);
  const out = { hp: 0, damage: 0, kecepatan: 0 };
  for (let i = 0; i < ARTEFAK_SLOT.length; i++) {
    const id = pakai[ARTEFAK_SLOT[i].kunci];
    if (!id) continue;
    const cari = artefakCari(id);
    if (!cari) continue;
    const lv = artefakLevel(id);
    const kali = artefakBintangDef(id).kali;
    const utama = artefakStatUtama(cari.set, cari.slot);
    for (let s = 0; s < ARTEFAK_STAT_DAERAH.length; s++) {
      const k = ARTEFAK_STAT_DAERAH[s];
      if (Number.isFinite(utama[k])) out[k] += utama[k] * lv * kali;
    }

    const sub = artefakSubstat(id);
    if (sub) {
      for (let s = 0; s < ARTEFAK_STAT_DAERAH.length; s++) {
        const k = ARTEFAK_STAT_DAERAH[s];
        if (Number.isFinite(sub[k])) out[k] += sub[k];
      }
    }
  }
  return out;
}

// Bonus set saja (tanpa stat piece), supaya save.js tinggal menjumlahkan.
function bonusSetArtefak(kunci) {
  const out = { hp: 0, damage: 0, kecepatan: 0, atributElement: 0 };
  const aktif = setArtefakAktif(kunci);
  for (let i = 0; i < aktif.length; i++) {
    const set = aktif[i].set;
    if (aktif[i].tier2 && set.bonus2) {
      for (let s = 0; s < ARTEFAK_STAT_DAERAH.length; s++) {
        const k = ARTEFAK_STAT_DAERAH[s];
        if (Number.isFinite(set.bonus2[k])) out[k] += set.bonus2[k];
      }
      if (Number.isFinite(set.bonus2.atributElement)) out.atributElement += set.bonus2.atributElement;
    }
    if (aktif[i].tier4 && set.bonus4) {
      for (let s = 0; s < ARTEFAK_STAT_DAERAH.length; s++) {
        const k = ARTEFAK_STAT_DAERAH[s];
        if (Number.isFinite(set.bonus4[k])) out[k] += set.bonus4[k];
      }
      if (Number.isFinite(set.bonus4.atributElement)) out.atributElement += set.bonus4.atributElement;
    }
  }
  return out;
}

// ATRIBUT ELEMENT = Elemental Mastery ala Genshin:
//   base dari karakter (config.js) + bonus set artefak yang aktif.
//   Stat ini JANGAN dikali persen: jumlahnya angka tetap.
function atributElementBase(kunci) {
  for (let i = 0; i < KARAKTER.length; i++) {
    if (KARAKTER[i].kunci === kunci) return KARAKTER[i].atributElement || 0;
  }
  return 0;
}

function atributElement(kunci) {
  return atributElementBase(kunci) + (bonusSetArtefak(kunci).atributElement || 0);
}

// Pengali damage skill/ultimate dari atribut element.
// Semakin tinggi "mastery", skill elemental semakin kenyal (mirip EM
// Genshin yang memperbesar damage reaksi elemental). Tiap 400 poin = x2.
function pengaliElement(kunci) {
  return 1 + (atributElement(kunci) || 0) / 400;
}

function koleksiArtefak() {
  const hasil = [];
  for (let i = 0; i < ARTEFAK_SET.length; i++) {
    const set = ARTEFAK_SET[i];
    for (let j = 0; j < ARTEFAK_SLOT.length; j++) {
      const id = artefakId(set.kunci, ARTEFAK_SLOT[j].kunci);
      const lv = artefakLevel(id);
      if (lv > 0) hasil.push({ id: id, set: set, slot: ARTEFAK_SLOT[j].kunci, lv: lv });
    }
  }
  return hasil;
}