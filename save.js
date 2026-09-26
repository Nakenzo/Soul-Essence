const SAVE_KUNCI = "soul-essence-progress";
const SAVE_KUNCI_BAK = "soul-essence-progress-bak";
const SAVE_SALT = 0x9e3779b9;
const SAVE_SALT2 = 0x85ebca6b;
const SAVE_VERSI = 3;

const KARAKTER_LEVEL_MAX = 20;

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
    ? terbaik.selesai.filter((x) => Number.isInteger(x) && x >= 0)
    : [];

  const koin = Number.isFinite(terbaik.koinTertinggi)
    ? terbaik.koinTertinggi
    : terbaik.skorTertinggi;
  n.koinTertinggi = Number.isFinite(koin) ? Math.max(0, Math.floor(koin)) : 0;

  n.koinSaldo = Number.isFinite(terbaik.koinSaldo)
    ? Math.max(0, Math.floor(terbaik.koinSaldo))
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
  return n;
}

function saveTulis() {
  const d = {
    v: SAVE_VERSI,
    selesai: progres.selesai,
    koinTertinggi: progres.koinTertinggi,
    koinSaldo: progres.koinSaldo,
    levelKarakter: progres.levelKarakter,
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
    progres.koinTertinggi = Math.floor(koin);
    saveTulis();
  }
}

function tambahKoinSaldo(koin) {
  if (Number.isFinite(koin) && koin > 0) {
    progres.koinSaldo += Math.floor(koin);
    saveTulis();
  }
}

function resetProgres() {
  progres = progresBaru();
  saveTulis();
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
  return {
    hp: 1 + 0.05 * lv,
    damage: 1 + 0.05 * lv,
    kecepatan: 1 + 0.04 * lv,
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
