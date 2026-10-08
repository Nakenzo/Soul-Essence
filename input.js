const keys = {};

let mouse = { x: WORLD_W / 2, y: WORLD_H / 2, sx: W / 2, sy: H / 2, down: false };

const joy = { x: 0, y: 0 };
const JARI_R_MX = 60;
let _joyId = null;
let _joyBasis = null;
let _aimId = null;

let aimDx = 0, aimDy = 0;
let _serangAktif = false;
let _serangId = null;
let _serangBasis = null;
const JARI_SERANG = 90;
let _btnSerang = false;
let _btnSerangId = null;
const joyBase = document.getElementById("joyBase");
const joyKnob = document.getElementById("joyKnob");

// Tombol yang sedang dipantai di layar Settings (ubah ikatan). Selama itu
// berjalan, SEMUA tombol keyboard diabaikan supaya "w" yang ditekan untuk
// memindahkan ikatan tidak sekaligus menggerakkan karakter.
function tangkapIkatanAktif() {
  return typeof sedangTangkap === "function" && sedangTangkap();
}

// Bawaan dipakai kalau settings.js belum termuat (mis. harness uji yang
// memuat sebagian file saja).
const IKATAN_POKOK = {
  maju: "w",
  mundur: "s",
  kiri: "a",
  kanan: "d",
  jurus: "k",
  ultimate: "r"
};

// Tombol yang sedang ditekan untuk aksi tertentu, mengikuti ikatan di
// settings.js. Kalau settings.js belum termuat, jatuh ke bawaan (WASD/K/R).
function tombolAksi(aksi) {
  const k = typeof pengaturanIkatan === "function" ? pengaturanIkatan(aksi)
    : IKATAN_POKOK[aksi] || "";
  return !!k && !!keys[k];
}

function gerakDx() {
  let dx = 0;
  if (tombolAksi("kiri") || keys["arrowleft"]) dx -= 1;
  if (tombolAksi("kanan") || keys["arrowright"]) dx += 1;
  return Math.max(-1, Math.min(1, dx + joy.x));
}
function gerakDy() {
  let dy = 0;
  if (tombolAksi("maju") || keys["arrowup"]) dy -= 1;
  if (tombolAksi("mundur") || keys["arrowdown"]) dy += 1;
  return Math.max(-1, Math.min(1, dy + joy.y));
}

function _poinMouse(e) {
  const r = canvas.getBoundingClientRect();

  mouse.sx = (e.clientX - r.left) * (W / r.width);
  mouse.sy = (e.clientY - r.top) * (H / r.height);

  mouse.x = (mouse.sx || 0) + kam.x;
  mouse.y = (mouse.sy || 0) + kam.y;
}

function _pusatJoy() {
  const r = canvas.getBoundingClientRect();
  return {
    x: r.left + joyBase.offsetLeft + joyBase.offsetWidth / 2,
    y: r.top + joyBase.offsetTop + joyBase.offsetHeight / 2
  };
}

window.addEventListener("keydown", (e) => {
  // Sedang memantai tombol baru di Settings: jangan proses apa pun.
  if (tangkapIkatanAktif()) return;

  const k = e.key.toLowerCase();
  keys[k] = true;

  if (typeof pakaiModeTigaSkill === "function" && pakaiModeTigaSkill()) {
    // 1 = skill bawaan (slot 2), 2 = slot 3, 3 = slot 4
    const slot = typeof slotDariTombol === "function" ? slotDariTombol(k) : 0;
    if (slot) castSkillSlot(slot);
    else if (tombolAksi("jurus") || k === "q") castSkillSlot(2);
  } else if (tombolAksi("jurus") || k === "q") {
    castSpecial();
  }

  if (e.key === "Escape") {
    const akunTerbuka = typeof layarAkun !== "undefined" && layarAkun &&
      !layarAkun.classList.contains("hidden");
    const settingTerbuka = typeof layarSetting !== "undefined" && layarSetting &&
      !layarSetting.classList.contains("hidden");
    if (akunTerbuka && typeof tutupAkun === "function") {
      tutupAkun();
    } else if (settingTerbuka && typeof tutupSetting === "function") {
      tutupSetting();
    } else if (statusGame === "main" && !animMati) {
      tampilkanPause();
    } else if (statusGame === "pause") {
      lanjutDariPause();
    } else if (statusGame === "level") {
      tampilkanJudul();
    } else if (statusGame === "select") {
      tampilkanJudul();
    }
    e.preventDefault();
  }

  if (k >= "1" && k <= "9" && statusGame === "level" && DAFTAR_LEVEL.length) {
    const idx = Number(k) - 1;
    if (idx >= 0 && idx < DAFTAR_LEVEL.length) {
      levelPilihan = idx;
      tampilkanPilih();
      return;
    }
  }

  if (tombolAksi("ultimate")) {

    if (statusGame === "over") {
      ulangDenganKarakter();
    } else if (statusGame === "main" && karakter) {
      rilisUltimate();
    }
  }

  if (k === "1" || k === "2" || k === "3") {
    if (statusGame === "upgrade" && pilihanKartu) {
      pilihKartuUpgrade(Number(k) - 1);
      return;
    }
  }

  KARAKTER.forEach((kar, idx) => {
    if (k === String(idx + 1) && statusGame === "select") {
      // Tekan angka untuk karakter terkunci = tidak mulai game (klik juga begitu).
      const cek = typeof syaratKarakter === "function"
        ? syaratKarakter(kar)
        : { terbuka: true, syarat: "" };
      if (!cek.terbuka) {
        if (typeof sfxKlik === "function") sfxKlik();
        return;
      }
      karakter = kar;
      mulaiGameBaru();
    }
  });
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener("pointermove", (e) => {
  if (deviceTerpilih === "mobile") {

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

    if (statusGame === "upgrade" && pilihanKartu) {
      const k = kartuIndexDariKlik(mouse.sx, mouse.sy);
      if (k !== -1) {
        pilihKartuUpgrade(k);
        return;
      }
    }
    const r = canvas.getBoundingClientRect();
    if (e.clientX >= r.left + r.width / 2 && _aimId === null) {

      _aimId = e.pointerId;
      mouse.down = true;
    }
    return;
  }

  if (e.button === 0 && statusGame === "upgrade" && pilihanKartu) {
    const k = kartuIndexDariKlik(mouse.sx, mouse.sy);
    if (k !== -1) {
      pilihKartuUpgrade(k);
      return;
    }
  }
  if (e.button === 0) mouse.down = true;
  if (e.button === 2 && !animMati) dashLari();
});

window.addEventListener("pointerup", lepasSentuh);
window.addEventListener("pointercancel", lepasSentuh);

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
      _serangAktif = false;
      _serangBasis = null;
      aimDx = 0;
      aimDy = 0;

      if (_aimId === null) mouse.down = false;

      const kn = document.getElementById("serangKnob");
      if (kn) kn.style.transform = "translate(-50%, -50%)";
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

const tombolSerang = document.getElementById("tombolSerang");

function punyaAutoAim() {
  return !!(player && player.kartu && player.kartu["bidik"] > 0);
}
tombolSerang.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  if (_btnSerang) return;
  _btnSerang = true;
  _btnSerangId = e.pointerId;
  _serangAktif = true;
  mouse.down = true;

  tombolSerang.classList.toggle("mode-aim", punyaAutoAim());
  if (punyaAutoAim()) {
    _serangAktif = false;
    _serangBasis = null;
    return;
  }

  const r = tombolSerang.getBoundingClientRect();
  _serangBasis = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  try { tombolSerang.setPointerCapture(e.pointerId); } catch (err) {}
});
tombolSerang.addEventListener("pointermove", (e) => {
  if (!_serangAktif || e.pointerId !== _btnSerangId || !_serangBasis) return;

  const lenX = e.clientX - _serangBasis.x;
  const lenY = e.clientY - _serangBasis.y;
  const len = Math.hypot(lenX, lenY);
  aimDx = len > 0 ? (lenX / len) * Math.min(1, len / JARI_SERANG) : 0;
  aimDy = len > 0 ? (lenY / len) * Math.min(1, len / JARI_SERANG) : 0;

  const kn = document.getElementById("serangKnob");
  if (kn) {
    const k = Math.min(1, len / JARI_SERANG);
    kn.style.transform = "translate(calc(-50% + " + (lenX * k) + "px), calc(-50% + " + (lenY * k) + "px))";
  }
});
const _pasangSentuh = (id, fn) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("pointerdown", fn);
};
_pasangSentuh("tombolDash", (e) => { e.preventDefault(); if (!animMati) dashLari(); });
_pasangSentuh("tombolSkill", (e) => {
  e.preventDefault();
  if (typeof pakaiModeTigaSkill === "function" && pakaiModeTigaSkill()) castSkillSlot(2);
  else castSpecial();
});
_pasangSentuh("tombolSkill2", (e) => {
  e.preventDefault();
  if (typeof pakaiModeTigaSkill === "function" && pakaiModeTigaSkill()) castSkillSlot(3);
});
_pasangSentuh("tombolSkill3", (e) => {
  e.preventDefault();
  if (typeof pakaiModeTigaSkill === "function" && pakaiModeTigaSkill()) castSkillSlot(4);
});
_pasangSentuh("tombolUlt", (e) => {
  e.preventDefault();
  // Guard sama seperti tombol keyboard R: ultimate hanya saat main, jadi
  // soul meter bisa tetap tampil (dan disentuh) saat fase pilih kartu tanpa
  // api justru terpakai memilih kartu.
  if (statusGame !== "main") return;
  if ((typeof soul === "number" ? soul : 0) >= SOUL_MAX) rilisUltimate();
});

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

// Konversi busur SVG (A/a) menjadi arc canvas (endpoint -> pusat).
function _busurSvg(c, x1, y1, rxx, ryy, phiDeg, fA, fS, x2, y2) {
  rxx = Math.abs(rxx);
  ryy = Math.abs(ryy);
  if (rxx === 0 || ryy === 0 || (x1 === x2 && y1 === y2)) {
    c.lineTo(x2, y2);
    return;
  }
  const phi = phiDeg * Math.PI / 180;
  const cosP = Math.cos(phi), sinP = Math.sin(phi);
  const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
  const x1p = cosP * dx + sinP * dy;
  const y1p = -sinP * dx + cosP * dy;
  let L = (x1p * x1p) / (rxx * rxx) + (y1p * y1p) / (ryy * ryy);
  if (L > 1) { const q = Math.sqrt(L); rxx *= q; ryy *= q; L = 1; }
  const m = rxx * rxx * ryy * ryy - rxx * rxx * y1p * y1p - ryy * ryy * x1p * x1p;
  const den = rxx * rxx * y1p * y1p + ryy * ryy * x1p * x1p;
  const co = m <= 0 || den <= 0 ? 0 : Math.sqrt(m / den);
  const sign = (fA === fS) ? -1 : 1;
  const cxp = sign * co * (rxx * y1p) / ryy;
  const cyp = sign * co * -(ryy * x1p) / rxx;
  const cx0 = cosP * cxp - sinP * cyp + (x1 + x2) / 2;
  const cy0 = sinP * cxp + cosP * cyp + (y1 + y2) / 2;
  const ux = (x1p - cxp) / rxx, uy = (y1p - cyp) / ryy;
  const vx = (-x1p - cxp) / rxx, vy = (-y1p - cyp) / ryy;
  const a1 = Math.atan2(uy, ux);
  let da = Math.atan2(vy, vx) - a1;
  if (fS === 0 && da > 0) da -= Math.PI * 2;
  if (fS === 1 && da < 0) da += Math.PI * 2;
  if (typeof c.ellipse === "function") {
    c.ellipse(cx0, cy0, rxx, ryy, phi, a1, a1 + da, fS === 0);
  } else {
    c.arc(cx0, cy0, rxx, a1, a1 + da, fS === 0);
  }
}

// Pemutar jalur data SVG sederhana -> perintah canvas 2D murni (moveTo,
// lineTo, bezierCurveTo, arc). Mendukung M/m L/l H/h V/v C/c A/a Z/z.
// Dipakai supaya logo tombol bisa digambar TANPA Path2D (kompatibel semua
// browser) sambil tetap memakai data jalur yang sama dengan menu karakter.
function _gambarJalurSvg(c, d) {
  c.beginPath();
  const n = d.length;
  let i = 0, cmd = "", cx = 0, cy = 0, subX = 0, subY = 0;
  function angka() {
    while (i < n && /[\s,]/.test(d[i])) i++;
    let s = i;
    if (i < n && (d[i] === "+" || d[i] === "-")) i++;
    let titik = false;
    if (i < n && d[i] === ".") { titik = true; i++; }
    while (i < n && /[0-9]/.test(d[i])) i++;
    if (!titik && i < n && d[i] === ".") { i++; while (i < n && /[0-9]/.test(d[i])) i++; }
    if (i < n && (d[i] === "e" || d[i] === "E")) {
      const back = i; i++;
      if (i < n && (d[i] === "+" || d[i] === "-")) i++;
      if (i < n && /[0-9]/.test(d[i])) { while (i < n && /[0-9]/.test(d[i])) i++; }
      else i = back;
    }
    const num = parseFloat(d.slice(s, i));
    return isNaN(num) ? 0 : num;
  }
  while (i < n) {
    while (i < n && /[\s,]/.test(d[i])) i++;
    if (i >= n) break;
    if (/[A-Za-z]/.test(d[i])) {
      cmd = d[i++];
      if (cmd === "Z" || cmd === "z") { c.closePath(); cx = subX; cy = subY; }
      continue;
    }
    const mulai = i;
    const v = angka();
    if (i === mulai) break;
    switch (cmd) {
      case "M": cx = v; cy = angka(); c.moveTo(cx, cy); subX = cx; subY = cy; cmd = "L"; break;
      case "m": cx += v; cy += angka(); c.moveTo(cx, cy); subX = cx; subY = cy; cmd = "l"; break;
      case "L": cx = v; cy = angka(); c.lineTo(cx, cy); break;
      case "l": cx += v; cy += angka(); c.lineTo(cx, cy); break;
      case "H": cx = v; c.lineTo(cx, cy); break;
      case "h": cx += v; c.lineTo(cx, cy); break;
      case "V": cy = v; c.lineTo(cx, cy); break;
      case "v": cy += v; c.lineTo(cx, cy); break;
      case "C": {
        const x1 = v, y1 = angka(), x2 = angka(), y2 = angka(), x = angka(), y = angka();
        c.bezierCurveTo(x1, y1, x2, y2, x, y); cx = x; cy = y; break;
      }
      case "c": {
        const x1 = cx + v, y1 = cy + angka(), x2 = cx + angka(), y2 = cy + angka(), x = cx + angka(), y = cy + angka();
        c.bezierCurveTo(x1, y1, x2, y2, x, y); cx = x; cy = y; break;
      }
      case "A": {
        const rx = v, ry = angka(), rot = angka(), fa = angka(), fs = angka(), x = angka(), y = angka();
        _busurSvg(c, cx, cy, rx, ry, rot, fa, fs, x, y); cx = x; cy = y; break;
      }
      case "a": {
        const rx = v, ry = angka(), rot = angka(), fa = angka(), fs = angka(), x = cx + angka(), y = cy + angka();
        _busurSvg(c, cx, cy, rx, ry, rot, fa, fs, x, y); cx = x; cy = y; break;
      }
      default: break;
    }
  }
}

// Gambar logo jurus ke canvas tombol — perintah canvas murni dari data jalur
// yang SAMA dengan menu karakter (jalurJurus). Tanpa Path2D, tanpa gambar
// eksternal: sinkron & kompatibel semua browser.
function _gambarIkonJurus(c, kar, slot, ukuran, opt) {
  if (!kar || !c || ukuran < 8) return;
  let jalur;
  try { jalur = typeof jalurJurus === "function" ? jalurJurus(kar, slot) : null; } catch (err) { return; }
  if (!jalur || !jalur.length) return;
  c.save();
  if (opt) {
    const px = ukuran / 24;
    c.translate(
      (opt.cx || ukuran / 2) - ukuran / 2 + (opt.dx || 0) * px,
      (opt.cy || ukuran / 2) - ukuran / 2 + (opt.dy || 0) * px
    );
  }
  c.scale(ukuran / 24, ukuran / 24);
  c.lineCap = "round";
  c.lineJoin = "round";
  for (let i = 0; i < jalur.length; i++) {
    const p = jalur[i];
    c.save();
    if (p.op != null) c.globalAlpha = p.op;
    if (p.d) {
      _gambarJalurSvg(c, p.d);
      if (p.isi) { c.fillStyle = p.warna; c.fill(); }
      else { c.strokeStyle = p.warna; c.lineWidth = p.tebal || 1; c.stroke(); }
    } else if (p.jenis === "circle") {
      c.beginPath();
      c.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
      if (p.das) c.setLineDash(p.das);
      if (p.isi) { c.fillStyle = p.warna; c.fill(); }
      else { c.strokeStyle = p.warna; c.lineWidth = p.tebal || 1; c.stroke(); }
      if (p.das) c.setLineDash([]);
    } else if (p.jenis === "ellipse") {
      c.save();
      c.translate(p.cx, p.cy);
      c.rotate((p.rot || 0) * Math.PI / 180);
      c.beginPath();
      c.ellipse(0, 0, p.rx, p.ry, 0, 0, Math.PI * 2);
      c.strokeStyle = p.warna;
      c.lineWidth = p.tebal || 1;
      c.stroke();
      c.restore();
    }
    c.restore();
  }
  c.restore();
}

const tombolUlt = document.getElementById("tombolUlt");

function gambarSoulUlt() {
  if (!tombolUlt) return;
  const soulNow = typeof soul === "number" ? soul : 0;
  tombolUlt.classList.toggle("ult-siap", soulNow >= SOUL_MAX);
}

// Tiga tombol skill (gaya Mobile Legends). Ketiganya dijalankan KODE YANG
// SAMA persis dengan tombol skill pertama: hanya slot-nya yang beda.
// - tombolSkill  -> slot 2 (skill bawaan karakter)
// - tombolSkill2 -> slot 3
// - tombolSkill3 -> slot 4
// Persembunyian (non-mode) pakai style.display langsung, jadi dijamin
// terlihat saat mode 3 skill aktif, tanpa bergantung class/CSS.
function perbaruiCdSkillSentuh() {
  const mode = typeof pakaiModeTigaSkill === "function" && pakaiModeTigaSkill();
  const ids = ["tombolSkill", "tombolSkill2", "tombolSkill3"];
  const slots = [2, 3, 4];
  const sisa = Math.max(0, player && player.specialCd ? player.specialCd : 0);
  for (let i = 0; i < ids.length; i++) {
    const btn = document.getElementById(ids[i]);
    if (!btn) continue;
    if (i > 0) {
      btn.style.display = mode ? "" : "none";
      if (!mode) continue;
    }
    const slot = slots[i];
    const tutup = btn.querySelector(".cd-tutup");
    const ang = btn.querySelector(".cd-angka");
    const def = karakter && typeof daftarSkill === "function"
      ? daftarSkill(karakter.kunci).filter(function (s) { return s.slot === slot; })[0]
      : null;
    const cd = typeof cdSkill === "function" && karakter ? cdSkill(karakter.kunci, slot) : 0;
    const terkunci = def && karakter && typeof levelKarakter === "function" && levelKarakter(karakter.kunci) < def.level;
    // Lapisan gelap cooldown: 100% saat baru dipakai/terkunci, menyusut
    // mengikuti sisa waktu, dan 0% (bukan 100%) saat siap -- jadi logo tombol
    // TAMPIL bersih saat skill siap.
    const lapis = terkunci ? 100 : (cd > 0 && sisa > 0 ? Math.max(0, Math.min(100, sisa / cd * 100)) : 0);
    if (tutup) {
      tutup.style.background = "conic-gradient(rgba(8,10,16,.78) " + lapis + "%, rgba(8,10,16,0) " + lapis + "%)";
    }
    if (ang) ang.textContent = terkunci ? ("LV" + def.level) : (sisa > 0 ? sisa.toFixed(1) : "");
  }
}

(function loopSoulUlt() {
  requestAnimationFrame(loopSoulUlt);
  if (deviceTerpilih !== "mobile") return;
  try { gambarSoulUlt(); } catch (err) {}
  try { perbaruiCdSkillSentuh(); } catch (err) {}
})();

function pasangIkonSentuh() {
  const dekat = karakter && karakter.tipe === "dekat";
  const wK = dekat ? "#ff8c3f" : "#7dd3fc";
  const mk = (id, lebarBasis) => {
    const btn = document.getElementById(id);
    if (!btn) return null;
    const cv = btn.querySelector(".ikon-sentuh");
    if (!cv) return null;
    let s = Math.min(btn.clientWidth, btn.clientHeight);
    if (s < 24) {
      let cs = 0.56;
      const v = getComputedStyle(document.documentElement).getPropertyValue("--cs").trim();
      if (v && !isNaN(parseFloat(v))) cs = parseFloat(v);
      s = Math.max(24, Math.round((lebarBasis || 100) * cs));
    }
    cv.width = s;
    cv.height = s;
    const c = cv.getContext("2d");
    // Latar kanvas ikon: hitam sedikit transparan supaya wajah tombol
    // tetap gelap walau CSS lama masih menempel — hanya sedikit latar menembus.
    c.fillStyle = "rgba(0,0,0,0.62)";
    c.fillRect(0, 0, s, s);
    const cx = s / 2;
    const cy = s / 2;
    const sk = s / 34;
    return { c, cx, cy, sk, btn };
  };
  const t = mk("tombolSerang", 205);
  if (t) {
    if (dekat) _gambarSlash(t.c, t.cx, t.cy, t.sk, wK);
    else _gambarPanah(t.c, t.cx, t.cy, t.sk, wK);
  }
  const d = mk("tombolDash", 110);
  if (d) {
    if (dekat) {

      _gambarSepatu(d.c, d.cx, d.cy, d.sk * 0.95, "#ffffff", "#ff4d4d", "#ff2030");
    } else {

      _gambarSepatu(d.c, d.cx - 3, d.cy, d.sk * 0.85, "rgba(125,211,252,0.85)", "#4a9fd8", "#dff4ff");
      _gambarSepatu(d.c, d.cx + 3, d.cy, d.sk * 0.85, "#ffffff", "#9fd9ff", "#7dd3fc");
    }
  }
  // 3 tombol skill: logo vektor diambil dari jalurJurus() — sumber data yang
  // SAMA dengan logo menu karakter (per karakter & slot). Sinkron via Path2D,
  // jadi tombol HP selalu menampilkan jurus yang dimiliki saat itu.
  const skillIds = [["tombolSkill", 2], ["tombolSkill2", 3], ["tombolSkill3", 4]];
  for (const [id, slot] of skillIds) {
    const sk = mk(id, 100);
    if (!sk) continue;
    _gambarSinar4(sk.c, sk.cx, sk.cy, sk.sk * 0.85, wK);
    sk.c.save();
    sk.c.fillStyle = "rgba(6,8,14,.45)";
    sk.c.beginPath();
    sk.c.arc(sk.cx, sk.cy, sk.s * 0.34, 0, Math.PI * 2);
    sk.c.fill();
    sk.c.restore();
    try { _gambarIkonJurus(sk.c, karakter, slot, sk.s * 0.76, { cx: sk.cx, cy: sk.cy }); } catch (err) {}
  }
  try {
    console.log("[DEB ikon] karakter=" + (karakter ? karakter.kunci : "?") +
      " tombolSkill=slot2 tombolSkill2=slot3 tombolSkill3=slot4");
  } catch (err) {}
}

pasangIkonSentuh();
window.addEventListener("resize", () => { if (deviceTerpilih === "mobile") pasangIkonSentuh(); });
