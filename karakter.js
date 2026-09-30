// KERANGKA KARAKTER
//
// Menambah karakter baru = tambah 1 objek di array KARAKTER (config.js).
// Slot skill, syarat level, tampilan menu, dan save ikut benar sendiri
// karena semuanya diturunkan dari levelKarakter().
//
// Kalau nama/level skill karakter itu mau beda dari bawaan, tulis
// opsional "skill" di config.js:
//
//   skill: [
//     { nama: "BASE ATTACK" },              // slot 1, selalu terbuka
//     { nama: "NAMA JURUS" },               // slot 2, selalu terbuka
//     { nama: "NAMA SKILL 3", level: 10 },  // slot 3
//     { nama: "NAMA SKILL 4", level: 15 },  // slot 4
//     { nama: "NAMA SKILL 5", level: 20 }   // slot 5
//   ]
//
// Slot yang tidak ditulis memakai nama & level bawaan.
// Slot 1 = serangan biasa (bukan jurus, tidak bisa dipilih).
// Slot 2-5 = jurus, hanya 1 yang bisa terpasang di Q/K.

const SKILL_SLOT_TOTAL = 5;
const SKILL_SLOT_JURUS_PERTAMA = 2;
const SKILL_LEVEL_JEDA = 5;
const SKILL_AWAL_PAKAI = 2;

function skillLevelBuka(slot) {
  if (slot <= SKILL_SLOT_JURUS_PERTAMA) return 0;
  return SKILL_LEVEL_JEDA * (slot - 1);
}

function skillNamaBawaan(kar, slot) {
  if (slot === 1) return "BASE ATTACK";
  if (slot === 2) return kar.tipe === "dekat" ? "HEATWAVE" : "FROSTBITE";
  return "SKILL " + slot;
}

function karTemukan(kunci) {
  for (let i = 0; i < KARAKTER.length; i++) {
    if (KARAKTER[i].kunci === kunci) return KARAKTER[i];
  }
  return null;
}

function daftarSkill(kunci) {
  const kar = karTemukan(kunci);
  if (!kar) return [];
  const tulis = Array.isArray(kar.skill) ? kar.skill : [];
  const hasil = [];
  for (let slot = 1; slot <= SKILL_SLOT_TOTAL; slot++) {
    const def = tulis[slot - 1] || {};
    const lv = Number.isInteger(def.level) ? def.level : skillLevelBuka(slot);
    const nama = typeof def.nama === "string" && def.nama.trim() ? def.nama.trim() : skillNamaBawaan(kar, slot);
    hasil.push({
      slot: slot,
      kunci: kunci,
      nama: nama,
      level: Math.max(0, lv),
      bisaPakai: slot >= SKILL_SLOT_JURUS_PERTAMA
    });
  }
  return hasil;
}

function skillTerbuka(kunci, lvKarakter) {
  const lv = Number.isInteger(lvKarakter) ? lvKarakter : levelKarakter(kunci);
  return daftarSkill(kunci).filter(function (s) { return lv >= s.level; });
}

function skillPakai(kunci) {
  const lv = levelKarakter(kunci);
  const simpan = progres.skillPakai ? progres.skillPakai[kunci] : SKILL_AWAL_PAKAI;
  const sah = daftarSkill(kunci).filter(function (s) {
    return s.slot === simpan && s.bisaPakai && lv >= s.level;
  });
  return sah.length ? sah[0].slot : SKILL_AWAL_PAKAI;
}

function pasangSkill(kunci, slot) {
  const cari = daftarSkill(kunci).filter(function (s) { return s.slot === slot; });
  if (!cari.length || !cari[0].bisaPakai) return false;
  if (levelKarakter(kunci) < cari[0].level) return false;
  if (!progres.skillPakai) progres.skillPakai = {};
  progres.skillPakai[kunci] = slot;
  saveTulis();
  return true;
}
