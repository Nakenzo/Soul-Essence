let _actx = null;
let _master = null;
let _sfxGain = null;
let _musVol = null;
let _musFilter = null;
let _sfxJeda = false;

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

  if (_musEl && _musKey) _fadeEl(_musEl, _volFileMusik(_musKey), 0.15);
  _simpanVolume();
}
function aturVolumeSfx(v) {
  _volSfx = Math.max(0, Math.min(1, v));
  if (_sfxGain) _sfxGain.gain.setValueAtTime(_sfxJeda ? 0 : _volSfx, _actx ? _actx.currentTime : 0);
  _simpanVolume();
}
function aturVolumeMusik(v) {
  _volMusik = Math.max(0, Math.min(1, v));
  if (_musVol) _musVol.gain.value = _volMusik;

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

    _master = _actx.createGain();
    _master.gain.value = _volUmum;
    _master.connect(_actx.destination);

    _sfxGain = _actx.createGain();
    _sfxGain.gain.value = _volSfx;
    _sfxGain.connect(_master);

    _musGain = _actx.createGain();
    _musGain.gain.value = 0;
    _musFilter = _actx.createBiquadFilter();
    _musFilter.type = "lowpass";
    _musFilter.frequency.value = 18000;
    _musFilter.Q.value = 0.0001;
    _musVol = _actx.createGain();
    _musVol.gain.value = _volMusik;
    _musGain.connect(_musFilter);
    _musFilter.connect(_musVol);
    _musVol.connect(_master);

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

let _sfxPlaying = new Set();
function _mainkanElement(a) {
  _sfxPlaying.add(a);
  a.addEventListener("ended", () => _sfxPlaying.delete(a), { once: true });
  a.play().catch(() => _sfxPlaying.delete(a));
}

function _bisaRuteWebAudio() {
  try {
    return !(typeof location !== "undefined" && location.protocol === "file:");
  } catch (_) {
    return true;
  }
}
function _aturEfekBGM(jeda) {
  if (!_actx || !_musFilter) return;
  const t = _actx.currentTime;
  if (jeda) {
    _musFilter.frequency.setTargetAtTime(190, t, 0.7);
    _musFilter.Q.setTargetAtTime(5, t, 0.7);
  } else {
    _musFilter.frequency.setTargetAtTime(18000, t, 0.4);
    _musFilter.Q.setTargetAtTime(0.0001, t, 0.4);
  }

  if (_musEl && _musKey && !_bisaRuteWebAudio()) {
    const v = _volFileMusik(_musKey);
    _fadeEl(_musEl, jeda ? v * 0.18 : v, 0.6);
  }
}

function setSfxTerjeda(jeda) {
  _sfxJeda = jeda;

  if (_actx && _sfxGain) {
    _sfxGain.gain.setValueAtTime(jeda ? 0 : _volSfx, _actx.currentTime);
  }

  _aturEfekBGM(jeda);
  if (jeda) {
    _sfxPlaying.forEach((a) => { try { if (!a.paused) a.pause(); } catch (err) {} });
  } else {
    _sfxPlaying.forEach((a) => {
      try {
        if (a.ended) _sfxPlaying.delete(a);
        else a.play().catch(() => {});
      } catch (err) { _sfxPlaying.delete(a); }
    });
  }

}

function sinkronSfxTerjeda() {
  setSfxTerjeda(statusGame === "pause" || statusGame === "upgrade");
}

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

function sfxFile(kunci) {
  const a = _sfxFiles[kunci];
  if (!a) return false;
  a.currentTime = 0;
  a.volume = (_sfxVol[kunci] != null ? _sfxVol[kunci] : 1) * _volSfx * _volUmum;
  _mainkanElement(a);
  return true;
}

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
    if (Number.isFinite(tMulai)) s.currentTime = tMulai;
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

function sfxTembak() {

  if (player && player.specialBuff > 0) {
    if (sfxFile("panah-beku")) return;
    sfxTone({ freq: 980, endFreq: 1450, dur: 0.14, type: "sine", vol: 0.18 });
    sfxNoise({ dur: 0.16, vol: 0.12, fType: "highpass", fFreq: 3200 });
    sfxTone({ freq: 1650, endFreq: 2100, dur: 0.09, type: "sine", vol: 0.1, delay: 0.05 });
    return;
  }

  if (sfxFile("panah")) return;
  sfxNoise({ dur: 0.08, vol: 0.18, fType: "highpass", fFreq: 2400 });
  sfxTone({ freq: 1180, endFreq: 540, dur: 0.15, type: "triangle", vol: 0.26 });
  sfxTone({ freq: 590, endFreq: 270, dur: 0.12, type: "sine", vol: 0.2, delay: 0.01 });
}

function sfxSabet() {

  if (sfxFile("sabet")) return;

  sfxNoise({ dur: 0.05, vol: 0.18, fType: "highpass", fFreq: 6000 });

  sfxNoise({ dur: 0.22, vol: 0.26, fType: "bandpass", fFreq: 5000, fEnd: 350, q: 1.2, trem: 0.06, tremFreq: 40 });

  sfxNoise({ dur: 0.18, vol: 0.14, fType: "lowpass", fFreq: 2400, fEnd: 200 });

  sfxTone({ freq: 1400, endFreq: 900, dur: 0.1, type: "sine", vol: 0.06, delay: 0.12 });
}

function sfxApiLapis(fileKey) {
  if (fileKey && sfxFile(fileKey)) return;

  sfxNoise({ dur: 0.6, vol: 0.22, fType: "lowpass", fFreq: 900, fEnd: 380, trem: 0.08, tremFreq: 11 });
  sfxNoise({ dur: 0.55, vol: 0.14, fType: "bandpass", fFreq: 3200, fEnd: 1100, q: 0.8, trem: 0.05, tremFreq: 23 });
}

function sfxTebasan() {

  if (!sfxFile("jurus-vender")) {

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

  if (sfxFile("dash")) return;
  sfxNoise({ dur: 0.18, vol: 0.18, fType: "bandpass", fFreq: 320, fEnd: 2600 });
}

function sfxSoul() {
  sfxTone({ freq: 680, endFreq: 1020, dur: 0.08, type: "sine", vol: 0.14 });
}

function sfxJurus() {

  if (sfxFileCrop("jurus-kenzro", 0.15)) return;
  sfxTone({ freq: 480, endFreq: 920, dur: 0.2, type: "sawtooth", vol: 0.17 });
  sfxTone({ freq: 240, endFreq: 640, dur: 0.26, type: "square", vol: 0.12, delay: 0.06 });
  sfxNoise({ dur: 0.28, vol: 0.16, fType: "bandpass", fFreq: 700, fEnd: 2400 });
}

function sfxPanahRaksasa() {

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

function sfxBoss() {
  sfxTone({ freq: 95, endFreq: 40, dur: 0.7, type: "sawtooth", vol: 0.32 });
  sfxTone({ freq: 130, endFreq: 48, dur: 0.9, type: "square", vol: 0.22, delay: 0.05 });
  sfxNoise({ dur: 0.5, vol: 0.28, fType: "lowpass", fFreq: 520, fEnd: 90 });
}

function sfxMenang() {
  if (sfxFile("menang")) return;
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

let _musFiles = {};
let _musKey = null;
let _musEl = null;
let _musSeq = null;
let _musGain = null;

const _MUS_VOL = { lobby: 0.5, game: 0.55 };
const _MUS_GAIN = { lobby: 0.9, game: 0.95 };

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

function setMusik(kunci) {
  if (kunci === _musKey) return;
  _hentiMusik();
  _musKey = kunci;
  if (!kunci) return;

  if (!_mulaiFileMusik(kunci)) _mulaiMusikProsedural(kunci);
}

let _musElTersambung = new WeakSet();
function _alirkanFileMusik(el) {
  if (!_actx || _musElTersambung.has(el)) return false;
  try {
    const src = _actx.createMediaElementSource(el);
    src.connect(_musFilter || _musVol);
    _musElTersambung.add(el);
    return true;
  } catch (_) {
    return false;
  }
}

function _mulaiFileMusik(kunci) {
  const el = _musFiles[kunci];
  if (!el) return false;
  _musEl = el;
  el.volume = 0;

  if (!_bisaRuteWebAudio()) {
    _fadeEl(el, _volFileMusik(kunci), 1.2);
    const janji = el.play();
    if (janji && typeof janji.then === "function") {
      janji.catch(() => {
        if (_musEl !== el) return;
        _musEl = null;
        _musKey = null;
        _mulaiMusikProsedural(kunci);
        _musKey = kunci;
      });
    }
    return true;
  }

  _alirkanFileMusik(el);
  _fadeEl(el, _volFileMusik(kunci), 1.2);
  const janji = el.play();
  if (janji && typeof janji.then === "function") {
    janji.catch(() => {
      if (_musEl !== el) return;
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

function _durBar(kunci) {
  const m = kunci === "game" ? _MUSIK_GAME : _MUSIK_LOBBY;
  return (60 / m.bpm) * m.bar * 1000;
}

const _MUSIK_LOBBY = {
  bpm: 76, bar: 4,
  prog: [
    { root: 110.0, minor: true },
    { root: 87.31, minor: false },
    { root: 130.81, minor: false },
    { root: 98.0, minor: false }
  ]
};
let _seqStep = 0;
function _barLobby(step) {
  if (!_actx || _actx.state !== "running") return;
  const pr = _MUSIK_LOBBY.prog[step % _MUSIK_LOBBY.prog.length];
  const r = pr.root, t3 = r * (pr.minor ? 1.1892 : 1.25), t5 = r * 1.5;
  const B = _durBar("lobby") / 1000;
  const out = _musGain;

  sfxTone({ freq: r, dur: B * 0.96, type: "sine", vol: 0.05, out: out });
  sfxTone({ freq: t5, dur: B * 0.96, type: "sine", vol: 0.035, out: out });

  sfxTone({ freq: t3, dur: B * 0.5, type: "sine", vol: 0.03, delay: B * 0.5, out: out });

  sfxTone({ freq: r / 2, dur: 0.6, type: "triangle", vol: 0.07, out: out });
  sfxTone({ freq: r / 2, dur: 0.4, type: "triangle", vol: 0.05, delay: B * 0.5, out: out });

  const arp = [r, t3, t5, r * 2, t5, t3];
  const stepT = B / arp.length;
  arp.forEach((f, i) =>
    sfxTone({ freq: f, dur: stepT * 1.2, type: "triangle", vol: 0.04, delay: i * stepT, out: out }));
}

const _MUSIK_GAME = {
  bpm: 138, bar: 4, root: 55.0,
  riff: [1, 1.5, 0.75, 1.5, 2, 1.5, 1.192, 1.5]
};
function _barGame(step) {
  if (!_actx || _actx.state !== "running") return;
  const B = _durBar("game") / 1000;
  const r8 = B / 8;
  const out = _musGain;

  const root = _MUSIK_GAME.root * (1 + Math.floor(step / 4) * 0.06);

  [0, B * 0.5].forEach((t) => {
    sfxNoise({ dur: 0.1, vol: 0.06, fType: "lowpass", fFreq: 260, delay: t, out: out });
    sfxTone({ freq: 140, endFreq: 45, dur: 0.11, type: "sine", vol: 0.1, delay: t, out: out });
  });

  for (let i = 0; i < 8; i++) {
    sfxNoise({ dur: 0.035, vol: 0.028, fType: "highpass", fFreq: 6200, delay: i * r8, out: out });
  }

  const bassP = [1, 1, 1.5, 1, 1, 1.5, 1.192, 1];
  for (let i = 0; i < 8; i++) {
    sfxTone({ freq: root * bassP[i], dur: 0.32, type: "square", vol: 0.055, delay: i * r8, out: out });
  }

  const len = _MUSIK_GAME.riff.length;
  for (let i = 0; i < len; i++) {
    sfxTone({
      freq: root * 2 * _MUSIK_GAME.riff[i],
      endFreq: root * 2 * _MUSIK_GAME.riff[i] * 0.98,
      dur: 0.16, type: "sawtooth", vol: 0.04, delay: i * r8, out: out
    });
  }
}
