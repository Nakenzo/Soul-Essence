// ============================================================
// INPUT - keyboard & mouse (desktop) + layar sentuh (HP).
// 1/2/3 : pilih karakter (layar pilih) / pilih kartu upgrade
// R   : ulang dengan karakter yang sama
// Mode HP: joystick tetap di pojok KIRI layar; sisi kanan bisa dipakai
//          bidik+serang manual, tombol SERANG besar = auto-aim musuh
//          terdekat, tombol DASH / SKILL / ULT melingkari tombol serang.
// Vektor gerak gabungan joy+keyboard dipakai entities.js via gerakDx/Dy.
// ============================================================
const keys = {};
let mouse = { x: W / 2, y: H / 2, down: false };

// ---------- Joystick tetap (mode HP, pojok kiri bawah) ----------
const joy = { x: 0, y: 0 };
const JARI_R_MX = 60; // radius jempol dalam px layar
let _joyId = null;
let _joyBasis = null;
let _aimId = null;
let autoAim = false; // tombol SERANG: bidik otomatis musuh terdekat
let _btnSerang = false;
let _btnSerangId = null;
const joyBase = document.getElementById("joyBase");
const joyKnob = document.getElementById("joyKnob");

// Vektor gerak gabungan keyboard + joystick (dijepit -1..1).
function gerakDx() {
  let dx = 0;
  if (keys["a"] || keys["arrowleft"]) dx -= 1;
  if (keys["d"] || keys["arrowright"]) dx += 1;
  return Math.max(-1, Math.min(1, dx + joy.x));
}
function gerakDy() {
  let dy = 0;
  if (keys["w"] || keys["arrowup"]) dy -= 1;
  if (keys["s"] || keys["arrowdown"]) dy += 1;
  return Math.max(-1, Math.min(1, dy + joy.y));
}

function _poinMouse(e) {
  const r = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - r.left) * (W / r.width);
  mouse.y = (e.clientY - r.top) * (H / r.height);
}

// Pusat joystick tetap (pada elemen joyBase) dalam koordinat klien.
function _pusatJoy() {
  const r = canvas.getBoundingClientRect();
  return {
    x: r.left + joyBase.offsetLeft + joyBase.offsetWidth / 2,
    y: r.top + joyBase.offsetTop + joyBase.offsetHeight / 2
  };
}

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  keys[k] = true;

  if (k === "k" || k === "q") {
    castSpecial();
  }

  if (e.key === "Escape") {
    if (statusGame === "main") {
      tampilkanPause();
    } else if (statusGame === "pause") {
      lanjutDariPause();
    } else if (statusGame === "select") {
      tampilkanJudul();
    }
    e.preventDefault();
  }

  if (k === "r") {
    // Di dalam game: R = tebus ultimate. R di layar game over tetap ulang.
    if (statusGame === "over") {
      ulangDenganKarakter();
    } else if (statusGame === "main" && karakter) {
      rilisUltimate();
    }
  }

  // Layar pilih kartu upgrade: tombol 1/2/3 langsung pilih kartu.
  if (k === "1" || k === "2" || k === "3") {
    if (statusGame === "upgrade" && pilihanKartu) {
      pilihKartuUpgrade(Number(k) - 1);
      return;
    }
  }

  KARAKTER.forEach((kar, idx) => {
    if (k === String(idx + 1) && statusGame === "select") {
      karakter = kar;
      mulaiGameBaru();
    }
  });
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

// ---------- Pointer (mouse + sentuh) ----------
canvas.addEventListener("pointermove", (e) => {
  if (deviceTerpilih === "mobile") {
    // Mode HP: hanya gerakan jempol bidik yang mengubah arah serangan,
    // agar joystick (tangan kiri) tidak menggeser tujuan bidik.
    if (e.pointerId === _joyId && _joyBasis) _geserJoy(e);
    if (e.pointerId === _aimId) _poinMouse(e);
    return;
  }
  _poinMouse(e);
});

canvas.addEventListener("pointerdown", (e) => {
  _poinMouse(e);
  if (deviceTerpilih === "mobile") {
    e.preventDefault();
    // Layar kartu upgrade: sentuh kartu = langsung pilih.
    if (statusGame === "upgrade" && pilihanKartu) {
      const k = kartuIndexDariKlik(mouse.x, mouse.y);
      if (k !== -1) {
        pilihKartuUpgrade(k);
        return;
      }
    }
    const r = canvas.getBoundingClientRect();
    if (e.clientX >= r.left + r.width / 2 && _aimId === null) {
      // Kanan: bidik + serang manual (tekan & tahan).
      _aimId = e.pointerId;
      mouse.down = true;
    }
    return;
  }
  // Desktop (mouse): klik kiri serang, klik kanan dash.
  if (e.button === 0 && statusGame === "upgrade" && pilihanKartu) {
    const k = kartuIndexDariKlik(mouse.x, mouse.y);
    if (k !== -1) {
      pilihKartuUpgrade(k);
      return;
    }
  }
  if (e.button === 0) mouse.down = true;
  if (e.button === 2) dashLari();
});

window.addEventListener("pointerup", lepasSentuh);
window.addEventListener("pointercancel", lepasSentuh);

// ---------- Joystick: elemen joyBase sendiri yang menerima sentuhan ----------
// (area tetap di POJOK layar HP, di luar kanvas). Sentuhan kiri-atas hingga
// kanan-under joystick dipetakan ke vektor gerak via _geserJoy.
joyBase.addEventListener("pointerdown", (e) => {
  if (deviceTerpilih !== "mobile") return;
  if (_joyId !== null) return;
  e.preventDefault();
  _joyId = e.pointerId;
  _joyBasis = _pusatJoy();
  try { joyBase.setPointerCapture(e.pointerId); } catch (err) {}
  _geserJoy(e);
});
joyBase.addEventListener("pointermove", (e) => {
  if (e.pointerId === _joyId) _geserJoy(e);
});

function lepasSentuh(e) {
  if (deviceTerpilih === "mobile") {
    if (e.pointerId === _joyId) {
      _joyId = null;
      _joyBasis = null;
      joy.x = 0;
      joy.y = 0;
      joyKnob.style.transform = "translate(-50%, -50%)";
    }
    if (e.pointerId === _aimId) {
      _aimId = null;
      if (!_btnSerang) mouse.down = false;
    }
    if (e.pointerId === _btnSerangId) {
      _btnSerang = false;
      _btnSerangId = null;
      autoAim = false;
      if (_aimId === null) mouse.down = false;
    }
    return;
  }
  mouse.down = false;
}

function _geserJoy(e) {
  const lenX = e.clientX - _joyBasis.x;
  const lenY = e.clientY - _joyBasis.y;
  const len = Math.hypot(lenX, lenY);
  const k = Math.min(1, len / JARI_R_MX);
  if (len > 0) {
    joy.x = (lenX / len) * k;
    joy.y = (lenY / len) * k;
  } else {
    joy.x = 0;
    joy.y = 0;
  }
  joyKnob.style.transform = "translate(calc(-50% + " + (lenX * k) + "px), calc(-50% + " + (lenY * k) + "px))";
}

canvas.addEventListener("contextmenu", (e) => e.preventDefault());

// ---------- Tombol aksi sentuh (mode HP) ----------
// SERANG: auto-aim musuh terdekat selama ditekan (lihat update mouse.down).
const tombolSerang = document.getElementById("tombolSerang");
tombolSerang.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  if (_btnSerang) return;
  _btnSerang = true;
  _btnSerangId = e.pointerId;
  autoAim = true;
  mouse.down = true;
});
document.getElementById("tombolDash").addEventListener("pointerdown", (e) => { e.preventDefault(); dashLari(); });
document.getElementById("tombolSkill").addEventListener("pointerdown", (e) => { e.preventDefault(); castSpecial(); });
document.getElementById("tombolUlt").addEventListener("pointerdown", (e) => {
  e.preventDefault();
  // Tombol SOUL METER: hanya jadi tombol ultimate saat meter PENUH.
  if ((typeof soul === "number" ? soul : 0) >= SOUL_MAX) rilisUltimate();
});

// ---------- Ikon tombol (canvas kecil, gaya sesuai karakter) ----------
function _gambarSepatu(c, sx, sy, sk, badan, sol, tali) {
  c.save();
  c.translate(sx, sy);
  c.scale(sk, sk);
  c.fillStyle = badan;
  c.beginPath();
  c.moveTo(-10, 5);
  c.lineTo(-10, -2);
  c.lineTo(-8, -6);
  c.lineTo(-1, -5);
  c.lineTo(2, 5);
  c.closePath();
  c.fill();
  c.fillStyle = sol;
  c.fillRect(-10, 5, 21, 5);
  c.fillStyle = tali;
  c.fillRect(-6, -4, 9, 3);
  c.fillRect(-5, -1, 9, 3);
  c.restore();
}
function _gambarSlash(c, cx, cy, sk, warna) {
  c.save();
  c.translate(cx, cy);
  c.scale(sk, sk);
  c.rotate(Math.PI / 4);
  c.strokeStyle = warna;
  c.lineWidth = 6;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(-8, 8);
  c.lineTo(8, -8);
  c.stroke();
  c.strokeStyle = "rgba(255,255,255,.95)";
  c.lineWidth = 2.5;
  c.beginPath();
  c.moveTo(-6.5, 6.5);
  c.lineTo(6.5, -6.5);
  c.stroke();
  c.restore();
}
function _gambarPanah(c, cx, cy, sk, warna) {
  c.save();
  c.translate(cx, cy);
  c.scale(sk, sk);
  c.rotate(Math.PI / 4);
  c.fillStyle = "#fff";
  c.strokeStyle = warna;
  c.lineWidth = 2.5;
  c.beginPath();
  c.moveTo(0, -10);
  c.lineTo(8, 2);
  c.lineTo(-8, 2);
  c.closePath();
  c.fill();
  c.stroke();
  c.strokeStyle = "#fff";
  c.lineWidth = 4;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(0, 4);
  c.lineTo(0, 12);
  c.stroke();
  c.restore();
}
function _gambarSinar4(c, cx, cy, sk, warna) {
  c.save();
  c.translate(cx, cy);
  c.scale(sk, sk);
  c.rotate(Math.PI / 4);
  c.fillStyle = warna;
  c.beginPath();
  for (let i = 0; i < 8; i++) {
    const r = i % 2 ? 0.5 : 1;
    const a = (i * Math.PI) / 4 - Math.PI / 2;
    const X = Math.cos(a) * r * 11;
    const Y = Math.sin(a) * r * 11;
    if (i === 0) c.moveTo(X, Y);
    else c.lineTo(X, Y);
  }
  c.closePath();
  c.fill();
  c.fillStyle = "rgba(255,255,255,.85)";
  c.beginPath();
  c.arc(0, 0, 3.4, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

// ------------- SOUL METER BAR → tombol ULTIMATE (mode HP) -------------
// Tombol ult adalah OVERLAY tepat di atas bar SOUL METER (yang digambar di
// canvas): visual penuh/isi berasal dari bar asli, tekan bar saat meter
// PENUH untuk melancarkan ultimate.
const tombolUlt = document.getElementById("tombolUlt");

function gambarSoulUlt() {
  // Meter penuh → bar berpendar emas (canvas juga menyala): tanda siap ditekan
  // untuk melancarkan ultimate. Tanpa teks agar tidak bertumpuk di bar.
  const soulNow = typeof soul === "number" ? soul : 0;
  tombolUlt.classList.toggle("ult-siap", soulNow >= SOUL_MAX);
}

(function loopSoulUlt() {
  if (deviceTerpilih === "mobile") gambarSoulUlt();
  requestAnimationFrame(loopSoulUlt);
})();

// Gambar ulang ikon tombol sesuai karakter terpilih.
function pasangIkonSentuh() {
  const dekat = karakter && karakter.tipe === "dekat";
  const wK = dekat ? "#ff8c3f" : "#7dd3fc";
  const mk = (id) => {
    const btn = document.getElementById(id);
    const cv = btn.querySelector(".ikon-sentuh");
    const s = Math.min(btn.clientWidth, btn.clientHeight);
    cv.width = s;
    cv.height = s;
    const c = cv.getContext("2d");
    const cx = s / 2;
    const cy = s / 2;
    const sk = s / 34; // ukuran logis ikon ≈ 34 satuan
    return { c, cx, cy, sk, btn };
  };
  const t = mk("tombolSerang");
  if (dekat) _gambarSlash(t.c, t.cx, t.cy, t.sk, wK);
  else _gambarPanah(t.c, t.cx, t.cy, t.sk, wK);
  const d = mk("tombolDash");
  if (dekat) {
    // Vender: satu sepatu khas (merah) seperti UI dash dalam game.
    _gambarSepatu(d.c, d.cx, d.cy, d.sk * 0.95, "#ffffff", "#ff4d4d", "#ff2030");
  } else {
    // Kenzro: dua sepatu (biru es).
    _gambarSepatu(d.c, d.cx - 3, d.cy, d.sk * 0.85, "rgba(125,211,252,0.85)", "#4a9fd8", "#dff4ff");
    _gambarSepatu(d.c, d.cx + 3, d.cy, d.sk * 0.85, "#ffffff", "#9fd9ff", "#7dd3fc");
  }
  const s = mk("tombolSkill");
  _gambarSinar4(s.c, s.cx, s.cy, s.sk, wK);
}

// Gambar ikon awal (sebelum karakter dipilih).
pasangIkonSentuh();
window.addEventListener("resize", () => { if (deviceTerpilih === "mobile") pasangIkonSentuh(); });