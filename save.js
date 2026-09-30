const SAVE_KUNCI = "soul-essence-progress";
const SAVE_KUNCI_BAK = "soul-essence-progress-bak";
const SAVE_SALT = 0x9e3779b9;
const SAVE_SALT2 = 0x85ebca6b;
const SAVE_VERSI = 3;

const KARAKTER_LEVEL_MAX = 20;
const KOIN_MAKS = 999999999;

const maksIdArtefak = typeof ARTEFAK_ID_PANJANG_MAX === "number"
  ? ARTEFAK_ID_PANJANG_MAX
  : 40;
const maksLevelArtefak = typeof ARTEFAK_LEVEL_MAX === "number"
  ? ARTEFAK_LEVEL_MAX
  : 20;
const maksSlotSkill = typeof SKILL_SLOT_TOTAL === "number"
  ? SKILL_SLOT_TOTAL
  : 5;

function kunciAman(k) {
  return typeof k === "string" && k.length > 0 &&
    k !== "__proto__" && k !== "constructor" && k !== "prototype";
}

function _xorChr(k, c) {
  return (k * 31 + c) >>> 0;
}

function saveEnkode(obj) {
  const json = JSON.stringify(obj);
  let k = SAVE_SALT, bs = "";
  for (let i = 0; i < json.length; i++) {
    const c = json.charCodeAt(i);
    bs += String.fromCharCode(c ^ (k & 0xff));
    k = _xorChr(k, c);
  }
  try { return btoa(bs); } catch (err) { return ""; }
}

function saveDekode(str) {
  try {
    const bs = atob(str);
    let k = SAVE_SALT, json = "";
    for (let i = 0; i < bs.length; i++) {
      const c = bs.charCodeAt(i) ^ (k & 0xff);
      json += String.fromCharCode(c);
      k = _xorChr(k, c);
    }
    return JSON.parse(json);
  } catch (err) { return null; }
}

function saveChecksum(obj) {
  const json = JSON.stringify(obj);
  let h = 0x811c9dc5;
  for (let i = 0; i < json.length; i++) {
    h ^= json.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  h ^= SAVE_SALT2;
  h = (h * 0x01000193) >>> 0;
  return h.toString(36) + "|" + json.length.toString(36);
}

function progresBaru() {
  return {
    v: SAVE_VERSI,
    selesai: [],
    koinTertinggi: 0,
    koinSaldo: 0,
    levelKarakter: {},
    skillPakai: {},
    artefakMilik: {},
    artefakBintang: {},
    artefakPakai: {},
    artefakSubstat: {},
    t: Date.now()
  };
}

function bacaProgres() {
  let terbaik = null;

  for (const kunci of [SAVE_KUNCI, SAVE_KUNCI_BAK]) {
    try {
      const raw = localStorage.getItem(kunci);
      if (!raw) continue;
      const box = saveDekode(raw);
      if (!box || typeof box !== "object") continue;
      if (box.sig !== saveChecksum(box.d)) continue;
      const d = box.d;
      if (d && (d.v === SAVE_VERSI || d.v === 1 || d.v === 2)) { terbaik = d; break; }
    } catch (err) { continue; }
  }

  if (!terbaik) terbaik = progresBaru();
  const n = progresBaru();
  n.selesai = Array.isArray(terbaik.selesai)
    ? terbaik.selesai.filter((x) => Number.isInteger(x) && x >= 0 && x <= 200)
    : [];

  const koin = Number.isFinite(terbaik.koinTertinggi)
    ? terbaik.koinTertinggi
    : terbaik.skorTertinggi;
  n.koinTertinggi = Number.isFinite(koin)
    ? Math.min(KOIN_MAKS, Math.max(0, Math.floor(koin)))
    : 0;

  n.koinSaldo = Number.isFinite(terbaik.koinSaldo)
    ? Math.min(KOIN_MAKS, Math.max(0, Math.floor(terbaik.koinSaldo)))
    : 0;

  n.levelKarakter = {};
  if (terbaik.levelKarakter && typeof terbaik.levelKarakter === "object") {
    for (const k in terbaik.levelKarakter) {
      const lv = terbaik.levelKarakter[k];
      if (Number.isInteger(lv) && lv >= 0) {
        n.levelKarakter[k] = Math.min(lv, KARAKTER_LEVEL_MAX);
      }
    }
  }
  n.skillPakai = {};
  if (terbaik.skillPakai && typeof terbaik.skillPakai === "object") {
    for (const k in terbaik.skillPakai) {
      const sl = terbaik.skillPakai[k];
      if (Number.isInteger(sl) && sl >= 2 && sl <= maksSlotSkill) n.skillPakai[k] = sl;
    }
  }
  n.artefakMilik = {};
  if (terbaik.artefakMilik && typeof terbaik.artefakMilik === "object") {
    for (const k in terbaik.artefakMilik) {
      const lv = terbaik.artefakMilik[k];
      if (kunciAman(k) && k.length <= maksIdArtefak && Number.isInteger(lv) && lv > 0) {
        n.artefakMilik[k] = Math.min(lv, maksLevelArtefak);
      }
    }
  }

  // rarity piece: 1-5 bintang. Piece dari save lama tanpa field ini
  // dianggap 3 bintang (lihat artefakBintang() di artefak.js).
  n.artefakBintang = {};
  if (terbaik.artefakBintang && typeof terbaik.artefakBintang === "object") {
    for (const k in terbaik.artefakBintang) {
      const b = terbaik.artefakBintang[k];
      if (kunciAman(k) && k.length <= maksIdArtefak && Number.isInteger(b) && b >= 1 && b <= 5) {
        n.artefakBintang[k] = b;
      }
    }
  }

  n.artefakPakai = {};
  if (terbaik.artefakPakai && typeof terbaik.artefakPakai === "object") {
    for (const kar in terbaik.artefakPakai) {
      if (!kunciAman(kar) || kar.length > maksIdArtefak) continue;
      const isi = terbaik.artefakPakai[kar];
      if (!isi || typeof isi !== "object") continue;
      const bersih = {};
      for (const slot in isi) {
        if (!kunciAman(slot)) continue;
        const id = isi[slot];
        if (typeof id === "string" && id.length <= maksIdArtefak) bersih[slot] = id;
        else bersih[slot] = null;
      }
      n.artefakPakai[kar] = bersih;
    }
  }

  // substat: { artefakId: { hp: 0.03, ... } }. Buang stat yang tidak dikenal
  // atau angkanya aneh, dan batasi maksimal ARTEFAK_SUBSTAT_MAKS per artefak.
  //
  // CATATAN: save.js dimuat SEBELUM config.js dan artefak.js, jadi fungsi ini
  // jalan lebih dulu. Karena itu daftar stat dipakai literal + fallback,
  // bukan langsung baca ARTEFAK_STAT_DAERAH (kalau begitu = ReferenceError).
  const statSubstat = typeof ARTEFAK_STAT_DAERAH !== "undefined"
    ? ARTEFAK_STAT_DAERAH
    : ["hp", "damage", "kecepatan"];
  const maksSubstat = typeof ARTEFAK_SUBSTAT_MAKS !== "undefined"
    ? ARTEFAK_SUBSTAT_MAKS
    : 3;
  n.artefakSubstat = {};
  if (terbaik.artefakSubstat && typeof terbaik.artefakSubstat === "object") {
    for (const k in terbaik.artefakSubstat) {
      if (!kunciAman(k) || k.length > maksIdArtefak) continue;
      const isi = terbaik.artefakSubstat[k];
      if (!isi || typeof isi !== "object") continue;
      const bersih = {};
      let jumlah = 0;
      for (let i = 0; i < statSubstat.length && jumlah < maksSubstat; i++) {
        const nama = statSubstat[i];
        const v = isi[nama];
        if (Number.isFinite(v) && v !== 0 && Math.abs(v) <= 1) {
          bersih[nama] = v;
          jumlah++;
        }
      }
      if (jumlah > 0) n.artefakSubstat[k] = bersih;
    }
  }
  return n;
}

function saveTulis() {
  const d = {
    v: SAVE_VERSI,
    selesai: progres.selesai,
    koinTertinggi: progres.koinTertinggi,
    koinSaldo: progres.koinSaldo,
    levelKarakter: progres.levelKarakter,
    skillPakai: progres.skillPakai,
    artefakMilik: progres.artefakMilik,
    artefakBintang: progres.artefakBintang,
    artefakPakai: progres.artefakPakai,
    artefakSubstat: progres.artefakSubstat,
    t: Date.now()
  };
  const box = { d: d, sig: saveChecksum(d) };
  const teks = saveEnkode(box);
  try {
    localStorage.setItem(SAVE_KUNCI, teks);
    localStorage.setItem(SAVE_KUNCI_BAK, teks);
  } catch (err) {  }
}

let progres;
try {
  progres = bacaProgres();
} catch (err) {
  console.warn("SAVE: gagal baca progres, pakai default.", err);
  progres = progresBaru();
}

function apakahLevelTerbuka(idx) {
  if (!Number.isInteger(idx) || idx < 0) return false;
  if (idx === 0) return true;
  return progres.selesai.includes(idx - 1);
}

function tandaiLevelSelesai(idx, koin) {
  if (!Number.isInteger(idx) || idx < 0) return;
  if (!progres.selesai.includes(idx)) progres.selesai.push(idx);
  if (koin > 0) progres.koinTertinggi = Math.max(progres.koinTertinggi, Math.floor(koin));
  saveTulis();
}

function catatKoinTertinggi(koin) {
  if (Number.isFinite(koin) && koin > progres.koinTertinggi) {
    progres.koinTertinggi = Math.min(KOIN_MAKS, Math.floor(koin));
    saveTulis();
  }
}

function tambahKoinSaldo(koin) {
  if (Number.isFinite(koin) && koin > 0) {
    progres.koinSaldo = Math.min(KOIN_MAKS, progres.koinSaldo + Math.floor(koin));
    saveTulis();
  }
}

function biayaNaikLevelKarakter(levelSekarang) {
  if (levelSekarang >= KARAKTER_LEVEL_MAX) return Infinity;
  return 1000 * (levelSekarang + 1);
}

function levelKarakter(kunci) {
  const lv = progres.levelKarakter[kunci];
  return Number.isInteger(lv) ? Math.min(Math.max(lv, 0), KARAKTER_LEVEL_MAX) : 0;
}

function bonusStatKarakter(kunci) {
  const lv = levelKarakter(kunci);
  const b = { hp: 0.05 * lv, damage: 0.05 * lv, kecepatan: 0.04 * lv };

  // bonus piece: stat utama per level + substat tetap
  if (typeof bonusArtefak === "function") {
    const a = bonusArtefak(kunci);
    if (Number.isFinite(a.hp)) b.hp += a.hp;
    if (Number.isFinite(a.damage)) b.damage += a.damage;
    if (Number.isFinite(a.kecepatan)) b.kecepatan += a.kecepatan;
  }
  // bonus set bertingkat: 2 slot -> bonus2, 4 slot -> bonus2 + bonus4
  if (typeof bonusSetArtefak === "function") {
    const s = bonusSetArtefak(kunci);
    if (Number.isFinite(s.hp)) b.hp += s.hp;
    if (Number.isFinite(s.damage)) b.damage += s.damage;
    if (Number.isFinite(s.kecepatan)) b.kecepatan += s.kecepatan;
  }

  // atribut element = base karakter + bonus set (angka tetap, bukan persen)
  let em = 0;
  if (typeof atributElement === "function") em = atributElement(kunci);

  return {
    hp: 1 + b.hp,
    damage: 1 + b.damage,
    kecepatan: 1 + b.kecepatan,
    atributElement: em,
    lv: lv
  };
}

function naikkanLevelKarakter(kunci) {
  const lv = levelKarakter(kunci);
  if (lv >= KARAKTER_LEVEL_MAX) return false;
  const biaya = biayaNaikLevelKarakter(lv);
  if (progres.koinSaldo < biaya) return false;
  progres.koinSaldo -= biaya;
  progres.levelKarakter[kunci] = lv + 1;
  saveTulis();
  return true;
}
