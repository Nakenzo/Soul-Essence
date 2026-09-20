// ============================================================
// AUDIO - efek suara prosedural (Web Audio API, tanpa file eksternal).
// Semua suara dibangkitkan langsung dari oscillator + noise.
// AudioContext dibuat/aktif saat interaksi pertama pemain (klik/tekan),
// karena browser melarang suara sebelum ada interaksi.
// ============================================================
let _actx = null;
let _master = null;   // SUARA UMUM = volume akhir yang mencegat semua jalur
let _sfxGain = null;  // jalur khusus EFEK (SFX)
let _musVol = null;   // jalur khusus MUSIK (BGM)

// ---------- Volume pemain (diatur lewat menu PAUSE) ----------
// UMUM mengalikan semua suara; EFEK hanya untuk SFX; MUSIK hanya BGM.
// Tersimpan di localStorage agar diingat antar sesi.
let _volUmum = 0.9;
let _volSfx = 1;
let _volMusik = 1;
(function _muatVolume() {
  try {
    const v = JSON.parse(localStorage.getItem("soul-essence-volume") || "{}");
    if (typeof v.umum === "number") _volUmum = Math.max(0, Math.min(1, v.umum));
    if (typeof v.sfx === "number") _volSfx = Math.max(0, Math.min(1, v.sfx));
    if (typeof v.musik === "number") _volMusik = Math.max(0, Math.min(1, v.musik));
  } catch (_) {}
})();
function _simpanVolume() {
  try {
    localStorage.setItem("soul-essence-volume",
      JSON.stringify({ umum: _volUmum, sfx: _volSfx, musik: _volMusik }));
  } catch (_) {}
}
function aturVolumeUmum(v) {
  _volUmum = Math.max(0, Math.min(1, v));
  if (_master) _master.gain.value = _volUmum;
  // File musik yang sedang diputar ikut disetel ulang volumenya.
  if (_musEl && _musKey) _fadeEl(_musEl, _volFileMusik(_musKey), 0.15);
  _simpanVolume();
}
function aturVolumeSfx(v) {
  _volSfx = Math.max(0, Math.min(1, v));
  if (_sfxGain) _sfxGain.gain.value = _volSfx;
  _simpanVolume();
}
function aturVolumeMusik(v) {
  _volMusik = Math.max(0, Math.min(1, v));
  if (_musVol) _musVol.gain.value = _volMusik;
  // File musik yang sedang diputar ikut disetel ulang volumenya.
  if (_musEl && _musKey) _fadeEl(_musEl, _volFileMusik(_musKey), 0.15);
  _simpanVolume();
}

function bukaAudio() {
  if (_actx) {
    if (_actx.state === "suspended") _actx.resume();
    return;
  }
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    _actx = new AC();
    // SUARA UMUM di posisi paling akhir; SFX & musik melewatinya.
    _master = _actx.createGain();
    _master.gain.value = _volUmum;
    _master.connect(_actx.destination);
    // Jalur SFX (efek prosedural + file) lewat gain khusus agar volume
    // efek bisa diatur terpisah dari musik.
    _sfxGain = _actx.createGain();
    _sfxGain.gain.value = _volSfx;
    _sfxGain.connect(_master);
    // Jalur musik (BGM): _musGain untuk fade/komposisi, lalu _musVol
    // sebagai volume musik yang diatur pemain.
    _musGain = _actx.createGain();
    _musGain.gain.value = 0;
    _musVol = _actx.createGain();
    _musVol.gain.value = _volMusik;
    _musGain.connect(_musVol);
    _musVol.connect(_master);
    // Musik yang sempat diset sebelum interaksi pertama (audio diblokir
    // browser) perlu diputar ulang sekarang, karena kunci masih sama maka
    // setMusik akan langsung berhenti. Paksa hidupkan ulang.
    if (_musKey) {
      const kunciBgm = _musKey;
      _musKey = null;
      setMusik(kunciBgm);
    }
  } catch (_) {
    _actx = null;
  }
}

window.addEventListener("pointerdown", bukaAudio, { once: false });
window.addEventListener("keydown", bukaAudio, { once: false });

function sfxResume() { bukaAudio(); }

// ---------- Jeda/lanjutkan SFX saat PAUSE & PEMILIHAN KARTU ----------
// Elemen file .mp3/.wav yang sedang berbunyi dilacak agar bisa di-pause
// dan di-resume. Suara Web Audio (oscillator/noise) di-freeze lewat
// suspend() AudioContext supaya ikut TERJEDA (bukan terpotong) dan
// berlanjut tepat saat game dilanjutkan.
let _sfxPlaying = new Set();
function _mainkanElement(a) {
  _sfxPlaying.add(a);
  a.addEventListener("ended", () => _sfxPlaying.delete(a), { once: true });
  a.play().catch(() => _sfxPlaying.delete(a));
}
function setSfxTerjeda(jeda) {
  if (_actx) {
    if (jeda && _actx.state === "running") _actx.suspend();
    else if (!jeda && _actx.state === "suspended") _actx.resume();
  }
  if (jeda) {
    _sfxPlaying.forEach((a) => { try { if (!a.paused) a.pause(); } catch (err) {} });
    // Musik latar berbasis file ikut dijeda agar seragam dengan musik prosedural.
    if (_musEl) { try { if (!_musEl.paused) _musEl.pause(); } catch (err) {} }
  } else {
    _sfxPlaying.forEach((a) => {
      try {
        if (a.ended) _sfxPlaying.delete(a);
        else a.play().catch(() => {});
      } catch (err) { _sfxPlaying.delete(a); }
    });
    if (_musEl) { try { _musEl.play().catch(() => {}); } catch (err) {} }
  }
}
// Dipanggil di transisi status game: "pause" & "upgrade" = dijeda,
// lainnya (lanjut bermain) = dilanjutkan.
function sinkronSfxTerjeda() {
  setSfxTerjeda(statusGame === "pause" || statusGame === "upgrade");
}

// ---------- Efek suara dari FILE lokal (opsional) ----------
// Letakkan file mp3 di assets/sfx/ agar dipakai persis apa adanya.
// Jika file gagal dimuat, efek jatuh ke sintesis prosedural di bawah.
// Tiap file bisa punya volume berbeda via muatSfxLokal(kunci, src, vol).
let _sfxFiles = {};
let _sfxVol = {};

function muatSfxLokal(kunci, src, vol) {
  _sfxVol[kunci] = vol != null ? vol : 1;
  return new Promise((resolve) => {
    const a = new Audio();
    a.preload = "auto";
    a.volume = _sfxVol[kunci];
    const ok = () => { _sfxFiles[kunci] = a; resolve(true); };
    const gagal = () => resolve(false);
    a.addEventListener("canplaythrough", ok, { once: true });
    a.addEventListener("error", gagal, { once: true });
    a.src = src;
  });
}

// Mainkan efek dari file; kembalikan true bila berhasil (ternyata ada).
function sfxFile(kunci) {
  const a = _sfxFiles[kunci];
  if (!a) return false;
  a.currentTime = 0;
  a.volume = (_sfxVol[kunci] != null ? _sfxVol[kunci] : 1) * _volSfx * _volUmum;
  _mainkanElement(a);
  return true;
}

// Mainkan file dengan memotong: mulai dari detik "mulai", berhenti setelah "durasi".
//   - mulai < 1  : dianggap PERSEN durasi file (mis. 0.15 = mulai dari 15% file,
//                  menskip awalan yang lambat/hening).
//   - mulai >= 1 : dianggap detik mutlak.
//   - mulai null : otomatis bagan hidup (~60% dari panjang file).
// "lapis" = berapa salinan dimainkan bersamaan (pengganti volume, <audio>.volume mentok 1.0).
function sfxFileCrop(kunci, mulai, durasi, lapis) {
  const el = _sfxFiles[kunci];
  if (!el) return false;
  const total = el.duration || 0;
  let tMulai = mulai;
  if (tMulai == null && total > 0) {
    tMulai = Math.min(total * 0.6, Math.max(0, total - (durasi || 0.3)));
  } else if (typeof tMulai === "number" && tMulai > 0 && tMulai < 1 && total > 0) {
    tMulai = total * tMulai;
  }
  tMulai = Math.max(0, Math.min((total || 0) - 0.05, tMulai || 0));
  const vol = (_sfxVol[kunci] != null ? _sfxVol[kunci] : 1) * _volSfx * _volUmum;
  const n = Math.max(1, lapis || 1);
  for (let i = 0; i < n; i++) {
    const s = i === 0 ? el : new Audio(el.src);
    s.currentTime = tMulai;
    s.volume = vol;
    _mainkanElement(s);
    if (durasi) {
      setTimeout(() => {
        try { s.pause(); s.currentTime = 0; } catch (e) {}
        _sfxPlaying.delete(s);
      }, durasi * 1000);
    }
  }
  return true;
}

// Suara dasar: nada tunggal (tone) dengan ADSR singkat.
// out: node gain tujuan (default _master; musik latar pakai _musGain).
function sfxTone({ freq, endFreq, dur, type, vol, delay, out }) {
  if (!_actx) return;
  const t0 = _actx.currentTime + (delay || 0);
  const osc = _actx.createOscillator();
  const g = _actx.createGain();
  osc.type = type || "square";
  osc.frequency.setValueAtTime(Math.max(20, freq), t0);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol || 0.1, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(out || _sfxGain);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

// Suara dasar: butiran noise (tiupan angin, ledakan, desis).
// q = resonansi filter (bandpass) biar sapuan frekuensi terdengar tegas.
// trem = kedalaman modulasi amplitudo (flutter khas sapuan udara/blade).
// out: node gain tujuan (default _master; musik latar pakai _musGain).
function sfxNoise({ dur, vol, fType, fFreq, fEnd, delay, q, trem, tremFreq, out }) {
  if (!_actx) return;
  const t0 = _actx.currentTime + (delay || 0);
  const n = Math.max(1, Math.floor((dur || 0.2) * _actx.sampleRate));
  const buf = _actx.createBuffer(1, n, _actx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
  const src = _actx.createBufferSource();
  src.buffer = buf;
  const f = _actx.createBiquadFilter();
  f.type = fType || "lowpass";
  f.frequency.setValueAtTime(fFreq || 1000, t0);
  if (fEnd) f.frequency.exponentialRampToValueAtTime(Math.max(20, fEnd), t0 + dur);
  if (q) f.Q.value = q;
  const g = _actx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol || 0.1, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  // Flutter amplitudo: modulasi nada dasar yang memberi rasa "sapuan angin".
  if (trem > 0) {
    const lfo = _actx.createOscillator();
    const lfoG = _actx.createGain();
    lfo.type = "sine";
    lfo.frequency.value = tremFreq || 30;
    lfoG.gain.value = trem;
    lfo.connect(lfoG);
    lfoG.connect(g.gain);
    lfo.start(t0);
    lfo.stop(t0 + dur + 0.02);
  }
  src.connect(f);
  f.connect(g);
  g.connect(out || _sfxGain);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

// ---------- Efek suara game ----------
function sfxTembak() {
  // Saat buff Kenzro aktif (specialBuff > 0), panahnya membekukan musuh —
  // suaranya dibuat BEDA dari panah biasa (kristal es yang lebih tinggi).
  if (player && player.specialBuff > 0) {
    if (sfxFile("panah-beku")) return;
    sfxTone({ freq: 980, endFreq: 1450, dur: 0.14, type: "sine", vol: 0.18 });
    sfxNoise({ dur: 0.16, vol: 0.12, fType: "highpass", fFreq: 3200 });
    sfxTone({ freq: 1650, endFreq: 2100, dur: 0.09, type: "sine", vol: 0.1, delay: 0.05 });
    return;
  }
  // Panah biasa Kenzro: file lokal jika ada (assets/sfx/kenzro/panah.wav).
  // Fallback sintesis dibuat bertenaga agar tetap terdengar di speaker HP.
  if (sfxFile("panah")) return;
  sfxNoise({ dur: 0.08, vol: 0.18, fType: "highpass", fFreq: 2400 });
  sfxTone({ freq: 1180, endFreq: 540, dur: 0.15, type: "triangle", vol: 0.26 });
  sfxTone({ freq: 590, endFreq: 270, dur: 0.12, type: "sine", vol: 0.2, delay: 0.01 });
}

function sfxSabet() {
  // Prioritas: file lokal (mis. assets/sfx/sword-slash-4.mp3) jika ada.
  if (sfxFile("sabet")) return;
  // Fallback sintesis gaya "sword slash" tajam-cepat:
  // 1) "Crack" transien frekuensi sangat tinggi di awal.
  sfxNoise({ dur: 0.05, vol: 0.18, fType: "highpass", fFreq: 6000 });
  // 2) Sapuan utama resonan turun cepat = "swish" tegas.
  sfxNoise({ dur: 0.22, vol: 0.26, fType: "bandpass", fFreq: 5000, fEnd: 350, q: 1.2, trem: 0.06, tremFreq: 40 });
  // 3) Badan lowpass tipis: tambah bobot, jangan sampai jadi "thud".
  sfxNoise({ dur: 0.18, vol: 0.14, fType: "lowpass", fFreq: 2400, fEnd: 200 });
  // 4) Kilau logam pendek setelah sapuan (nada tinggi yang cepat menghilang).
  sfxTone({ freq: 1400, endFreq: 900, dur: 0.1, type: "sine", vol: 0.06, delay: 0.12 });
}

// Kobaran api — lapisan tambahan api untuk jurus/ultimate Vender.
// fileKey: kunci file (jurus-vender-api / ultimate-vender-api).
function sfxApiLapis(fileKey) {
  if (fileKey && sfxFile(fileKey)) return;
  // Fallback sintesis: gemuruh rendah + kretek api yang KERAS.
  sfxNoise({ dur: 0.6, vol: 0.22, fType: "lowpass", fFreq: 900, fEnd: 380, trem: 0.08, tremFreq: 11 });
  sfxNoise({ dur: 0.55, vol: 0.14, fType: "bandpass", fFreq: 3200, fEnd: 1100, q: 0.8, trem: 0.05, tremFreq: 23 });
}

function sfxTebasan() {
  // Heatwave = TEBASAN + KOBARAN API: dua lapis dimainkan bersamaan.
  if (!sfxFile("jurus-vender")) {
    // Fallback sintesis tebasan besar: panjang, resonan, bertenaga.
    sfxNoise({ dur: 0.08, vol: 0.14, fType: "highpass", fFreq: 5200 });
    sfxNoise({ dur: 0.3, vol: 0.26, fType: "bandpass", fFreq: 4200, fEnd: 300, q: 1.4, trem: 0.05, tremFreq: 26 });
    sfxNoise({ dur: 0.28, vol: 0.2, fType: "lowpass", fFreq: 2200, fEnd: 160 });
    sfxTone({ freq: 220, endFreq: 800, dur: 0.26, type: "triangle", vol: 0.09 });
  }
  sfxApiLapis("jurus-vender-api");
}

function sfxKena() {
  sfxTone({ freq: 700, endFreq: 400, dur: 0.07, type: "square", vol: 0.12 });
}

function sfxBeku() {
  // File lokal efek membeku (assets/sfx/kenzro/beku.mp3) jika ada.
  if (sfxFile("beku")) return;
  sfxNoise({ dur: 0.14, vol: 0.12, fType: "highpass", fFreq: 4000 });
  sfxTone({ freq: 1400, endFreq: 2200, dur: 0.12, type: "sine", vol: 0.15 });
}

function sfxMatMusuh() {
  sfxTone({ freq: 420, endFreq: 120, dur: 0.22, type: "square", vol: 0.16 });
  sfxNoise({ dur: 0.18, vol: 0.13, fType: "lowpass", fFreq: 1400, fEnd: 180 });
}

function sfxPemainKena() {
  sfxTone({ freq: 190, endFreq: 75, dur: 0.25, type: "sawtooth", vol: 0.3 });
  sfxNoise({ dur: 0.14, vol: 0.2, fType: "lowpass", fFreq: 900, fEnd: 160 });
}

function sfxDash() {
  // File lokal dash (mis. assets/sfx/dash.mp3) jika ada.
  if (sfxFile("dash")) return;
  sfxNoise({ dur: 0.18, vol: 0.18, fType: "bandpass", fFreq: 320, fEnd: 2600 });
}

function sfxSoul() {
  sfxTone({ freq: 680, endFreq: 1020, dur: 0.08, type: "sine", vol: 0.14 });
}

function sfxJurus() {
  // File lokal jurus Kenzro; awalan lambatnya DI-SKIP 15% (mulai dari 15% file).
  if (sfxFileCrop("jurus-kenzro", 0.15)) return;
  sfxTone({ freq: 480, endFreq: 920, dur: 0.2, type: "sawtooth", vol: 0.17 });
  sfxTone({ freq: 240, endFreq: 640, dur: 0.26, type: "square", vol: 0.12, delay: 0.06 });
  sfxNoise({ dur: 0.28, vol: 0.16, fType: "bandpass", fFreq: 700, fEnd: 2400 });
}

function sfxPanahRaksasa() {
  // File lokal panah raksasa Kenzro (assets/sfx/panah-raksasa.mp3) jika ada.
  if (sfxFile("panah-raksasa")) return;
  sfxNoise({ dur: 0.26, vol: 0.22, fType: "highpass", fFreq: 500, fEnd: 4200 });
  sfxTone({ freq: 280, endFreq: 1250, dur: 0.22, type: "sawtooth", vol: 0.2 });
  sfxBeku();
}

function sfxUltimate() {
  sfxTone({ freq: 150, endFreq: 950, dur: 0.32, type: "sawtooth", vol: 0.26 });
  sfxTone({ freq: 75, endFreq: 420, dur: 0.4, type: "square", vol: 0.2, delay: 0.02 });
  sfxNoise({ dur: 0.42, vol: 0.26, fType: "highpass", fFreq: 400, fEnd: 6000 });
}

// Ultimate Vender (360°) = TEBASAN BESAR + KOBARAN API.
// Api: mainkan FILE UTUH 8 detik (bukan dipotong) — durasi panjang ini
// "dimanfaatkan" oleh efek visual api yang menyertai (ditambahkan terpisah).
// Dua salinan dipramuat terpisah lalu dimainkan bersamaan → lebih keras.
function sfxUltimateVender() {
  if (!sfxFile("ultimate-vender")) sfxUltimate();
  sfxFile("ultimate-vender-api");
  sfxFile("ultimate-vender-api-b");
}

function sfxUltimateKenzro() {
  if (!sfxFile("ultimate-kenzro")) sfxUltimate();
}

function sfxLevel() {
  sfxTone({ freq: 660, dur: 0.14, type: "square", vol: 0.15 });
  sfxTone({ freq: 880, dur: 0.22, type: "square", vol: 0.15, delay: 0.13 });
}

function sfxMenang() {
  [523, 659, 784, 1047].forEach((f, i) =>
    sfxTone({ freq: f, dur: 0.26, type: "square", vol: 0.16, delay: i * 0.14 }));
}

function sfxGameOver() {
  [400, 340, 280, 190].forEach((f, i) =>
    sfxTone({ freq: f, dur: 0.3, type: "sawtooth", vol: 0.16, delay: i * 0.2 }));
}

function sfxKlik() {
  sfxTone({ freq: 700, endFreq: 940, dur: 0.06, type: "square", vol: 0.15 });
}

// ============================================================
// LAGU LATAR (BGM) — dua lagu BERBEDA:
//   "lobby" = menu (judul, pilih karakter, game over) — tenang, misterius.
//   "game"  = saat bermain — lebih cepat, tegang, bertenaga.
// Opsional: taruh file mp3 di assets/music/lobby.mp3 & game.mp3 → dipakai
// apa adanya (loop). Kalau file tidak ada, dipakai musik PROSEDURAL Web
// Audio (fallback) dengan komposisi berbeda per bagian. BGM berjalan lewat
// gain khusus (_musGain) sehingga bisa di-fade terpisah dari SFX.
// ============================================================
let _musFiles = {};
let _musKey = null;
let _musEl = null;   // element file yang sedang diputar
let _musSeq = null;  // interval sequencer (musik prosedural)
let _musGain = null; // gain khusus musik
// Volume file mp3 (0..1) dan gain target musik prosedural.
// Prosedural diputar lewat _musGain; biarkan gain tinggi karena tiap nada
// sudah punya volume kecil sendiri (0.03–0.1), hasil akhirnya seimbang SFX.
const _MUS_VOL = { lobby: 0.5, game: 0.55 };
const _MUS_GAIN = { lobby: 0.9, game: 0.95 };

// Volume akhir file musik: ketetapan lagu x volume musik x volume umum.
function _volFileMusik(kunci) {
  return (_MUS_VOL[kunci] || 0.5) * _volMusik * _volUmum;
}

function muatLaguLokal(kunci, src) {
  return new Promise((resolve) => {
    const a = new Audio();
    a.preload = "auto";
    a.loop = true;
    const ok = () => { _musFiles[kunci] = a; resolve(true); };
    const gagal = () => resolve(false);
    a.addEventListener("canplaythrough", ok, { once: true });
    a.addEventListener("error", gagal, { once: true });
    a.src = src;
  });
}

// Fade volume element (file) dari kondisi sekarang ke target.
function _fadeEl(el, vol, dt) {
  const mulai = el.volume;
  const t0 = performance.now();
  const st = setInterval(() => {
    const p = Math.min(1, (performance.now() - t0) / (dt * 1000));
    el.volume = mulai + (vol - mulai) * p;
    if (p >= 1) clearInterval(st);
  }, 40);
}

function _hentiMusik() {
  if (_musSeq) { clearInterval(_musSeq); _musSeq = null; }
  if (_musEl) { try { _musEl.pause(); } catch (err) {} _musEl = null; }
  if (_musGain && _actx) {
    try { _musGain.gain.setTargetAtTime(0, _actx.currentTime, 0.15); } catch (err) {}
  }
  _musKey = null;
}

// Ganti lagu: berhentikan yang lama → mulai kunci baru sesudahnya.
function setMusik(kunci) {
  if (kunci === _musKey) return;
  _hentiMusik();
  _musKey = kunci;
  if (!kunci) return;
  // File mp3 jika tersedia; kalau gagal diputar (mis. diblokir autoplay),
  // jatuh ke musik prosedural agar tetap ada suara.
  if (!_mulaiFileMusik(kunci)) _mulaiMusikProsedural(kunci);
}

function _mulaiFileMusik(kunci) {
  const el = _musFiles[kunci];
  if (!el) return false;
  _musEl = el;
  el.volume = 0;
  _fadeEl(el, _volFileMusik(kunci), 1.2);
  const janji = el.play();
  if (janji && typeof janji.then === "function") {
    janji.catch(() => {
      if (_musEl !== el) return; // sudah ganti lagu, abaikan
      _musEl = null;
      _musKey = null;
      _mulaiMusikProsedural(kunci);
      _musKey = kunci;
    });
  }
  return true;
}

function _mulaiMusikProsedural(kunci) {
  if (!_actx || !_musGain || _actx.state === "closed") return;
  _musGain.gain.setValueAtTime(0, _actx.currentTime);
  _musGain.gain.setTargetAtTime(_MUS_GAIN[kunci] || 0.9, _actx.currentTime, 0.6);
  const fn = kunci === "game" ? _barGame : _barLobby;
  _seqStep = 0;
  fn(0);
  _musSeq = setInterval(() => {
    if (_actx && _actx.state === "running") fn(_seqStep++);
  }, _durBar(kunci));
  _musKey = kunci;
}

// Durasi satu birama (detik) per lagu.
function _durBar(kunci) {
  const m = kunci === "game" ? _MUSIK_GAME : _MUSIK_LOBBY;
  return (60 / m.bpm) * m.bar * 1000;
}

// ---------- Komposisi lobby (tenang, misterius) ----------
const _MUSIK_LOBBY = {
  bpm: 76, bar: 4,
  prog: [
    { root: 110.0, minor: true },   // Am
    { root: 87.31, minor: false },  // F
    { root: 130.81, minor: false }, // C
    { root: 98.0, minor: false }    // G
  ]
};
let _seqStep = 0;
function _barLobby(step) {
  if (!_actx || _actx.state !== "running") return;
  const pr = _MUSIK_LOBBY.prog[step % _MUSIK_LOBBY.prog.length];
  const r = pr.root, t3 = r * (pr.minor ? 1.1892 : 1.25), t5 = r * 1.5;
  const B = _durBar("lobby") / 1000;
  const out = _musGain;
  // Pad (dua nada chord panjang).
  sfxTone({ freq: r, dur: B * 0.96, type: "sine", vol: 0.05, out: out });
  sfxTone({ freq: t5, dur: B * 0.96, type: "sine", vol: 0.035, out: out });
  // Nada ketiga masuk pelan di tengah birama.
  sfxTone({ freq: t3, dur: B * 0.5, type: "sine", vol: 0.03, delay: B * 0.5, out: out });
  // Bass dalam.
  sfxTone({ freq: r / 2, dur: 0.6, type: "triangle", vol: 0.07, out: out });
  sfxTone({ freq: r / 2, dur: 0.4, type: "triangle", vol: 0.05, delay: B * 0.5, out: out });
  // Arpeggio lambat naik-turun.
  const arp = [r, t3, t5, r * 2, t5, t3];
  const stepT = B / arp.length;
  arp.forEach((f, i) =>
    sfxTone({ freq: f, dur: stepT * 1.2, type: "triangle", vol: 0.04, delay: i * stepT, out: out }));
}

// ---------- Komposisi game (cepat, tegang) ----------
const _MUSIK_GAME = {
  bpm: 138, bar: 4, root: 55.0, // A1
  riff: [1, 1.5, 0.75, 1.5, 2, 1.5, 1.192, 1.5]
};
function _barGame(step) {
  if (!_actx || _actx.state !== "running") return;
  const B = _durBar("game") / 1000;
  const r8 = B / 8;
  const out = _musGain;
  // Naikkan nada dasar pelan setiap 4 birama untuk kesan menekan.
  const root = _MUSIK_GAME.root * (1 + Math.floor(step / 4) * 0.06);
  // Kick dua kali per birama.
  [0, B * 0.5].forEach((t) => {
    sfxNoise({ dur: 0.1, vol: 0.06, fType: "lowpass", fFreq: 260, delay: t, out: out });
    sfxTone({ freq: 140, endFreq: 45, dur: 0.11, type: "sine", vol: 0.1, delay: t, out: out });
  });
  // Hi-hat kedelapan.
  for (let i = 0; i < 8; i++) {
    sfxNoise({ dur: 0.035, vol: 0.028, fType: "highpass", fFreq: 6200, delay: i * r8, out: out });
  }
  // Bass not-8.
  const bassP = [1, 1, 1.5, 1, 1, 1.5, 1.192, 1];
  for (let i = 0; i < 8; i++) {
    sfxTone({ freq: root * bassP[i], dur: 0.32, type: "square", vol: 0.055, delay: i * r8, out: out });
  }
  // Lead melodi minor pendek.
  const len = _MUSIK_GAME.riff.length;
  for (let i = 0; i < len; i++) {
    sfxTone({
      freq: root * 2 * _MUSIK_GAME.riff[i],
      endFreq: root * 2 * _MUSIK_GAME.riff[i] * 0.98,
      dur: 0.16, type: "sawtooth", vol: 0.04, delay: i * r8, out: out
    });
  }
}