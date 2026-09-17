// ============================================================
// AUDIO - efek suara prosedural (Web Audio API, tanpa file eksternal).
// Semua suara dibangkitkan langsung dari oscillator + noise.
// AudioContext dibuat/aktif saat interaksi pertama pemain (klik/tekan),
// karena browser melarang suara sebelum ada interaksi.
// ============================================================
let _actx = null;
let _master = null;
let _mute = false;

function bukaAudio() {
  if (_actx) {
    if (_actx.state === "suspended") _actx.resume();
    return;
  }
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    _actx = new AC();
    _master = _actx.createGain();
    _master.gain.value = 0.9;
    _master.connect(_actx.destination);
  } catch (_) {
    _actx = null;
  }
}

window.addEventListener("pointerdown", bukaAudio, { once: false });
window.addEventListener("keydown", bukaAudio, { once: false });

function sfxResume() { bukaAudio(); }

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
  a.volume = _sfxVol[kunci] != null ? _sfxVol[kunci] : 1;
  a.play().catch(() => {});
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
  const vol = _sfxVol[kunci] != null ? _sfxVol[kunci] : 1;
  const n = Math.max(1, lapis || 1);
  for (let i = 0; i < n; i++) {
    const s = i === 0 ? el : new Audio(el.src);
    s.currentTime = tMulai;
    s.volume = vol;
    s.play().catch(() => {});
    if (durasi) {
      setTimeout(() => {
        try { s.pause(); s.currentTime = 0; } catch (e) {}
      }, durasi * 1000);
    }
  }
  return true;
}

// Suara dasar: nada tunggal (tone) dengan ADSR singkat.
function sfxTone({ freq, endFreq, dur, type, vol, delay }) {
  if (!_actx || _mute) return;
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
  g.connect(_master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

// Suara dasar: butiran noise (tiupan angin, ledakan, desis).
// q = resonansi filter (bandpass) biar sapuan frekuensi terdengar tegas.
// trem = kedalaman modulasi amplitudo (flutter khas sapuan udara/blade).
function sfxNoise({ dur, vol, fType, fFreq, fEnd, delay, q, trem, tremFreq }) {
  if (!_actx || _mute) return;
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
  g.connect(_master);
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
  sfxNoise({ dur: 0.07, vol: 0.1, fType: "highpass", fFreq: 2200 });
  sfxTone({ freq: 1150, endFreq: 580, dur: 0.11, type: "triangle", vol: 0.16 });
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