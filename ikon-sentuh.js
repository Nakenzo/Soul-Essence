// ===== IKON SENTUH FAIL-SAFE =====
// File BARU (nama ini belum pernah dipakai di versi mana pun), sehingga cache
// browser / service worker / salinan lama TIDAK MUNGKIN menyajikan versi lama
// dari file ini. Fungsinya:
//   1. Mengganti pasangIkonSentuh global (dipanggil ulang saat resize oleh
//      input.js) lewat penulisan window.pasangIkonSentuh.
//   2. Menggambar SEMUA tombol sentuh (serang, dash, dan 3 skill) memakai logo
//      yang SAMA dengan menu karakter (jalurJurus bila tersedia; data cadangan
//      sendiri bila menu.js ternyata versi lama).
//   3. Logo digambar TEPAT di tengah tombol + dikoreksi optik per jurus.
//   4. Memakai perintah canvas murni (moveTo/lineTo/bezierCurveTo/ellipse/arc),
//      TANPA Path2D → kompatibel semua browser.
(function () {
  if (typeof document !== "object" || !document) return;

  // --- Konversi busur SVG ke canvas (endpoint -> pusat) ---
  function busurV15(c, x1, y1, rxx, ryy, phiDeg, fA, fS, x2, y2) {
    rxx = Math.abs(rxx);
    ryy = Math.abs(ryy);
    if (rxx === 0 || ryy === 0 || (x1 === x2 && y1 === y2)) { c.lineTo(x2, y2); return; }
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

  // --- Pemutar jalur SVG data -> perintah canvas murni ---
  function jalurV15(c, d) {
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
          busurV15(c, cx, cy, rx, ry, rot, fa, fs, x, y); cx = x; cy = y; break;
        }
        case "a": {
          const rx = v, ry = angka(), rot = angka(), fa = angka(), fs = angka(), x = cx + angka(), y = cy + angka();
          busurV15(c, cx, cy, rx, ry, rot, fa, fs, x, y); cx = x; cy = y; break;
        }
        default: break;
      }
    }
  }

  // --- Lukis kumpulan jalur (d / circle / ellipse), dengan koreksi pusat ---
  function lukisLogoV15(c, jalur, ukuran, offx, offy) {
    c.save();
    c.scale(ukuran / 24, ukuran / 24);
    if (offx || offy) c.translate(offx, offy);
    c.lineCap = "round";
    c.lineJoin = "round";
    for (let i = 0; i < jalur.length; i++) {
      const p = jalur[i];
      c.save();
      if (p.op != null) c.globalAlpha = p.op;
      if (p.d) {
        jalurV15(c, p.d);
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

  // --- Pembantu warna (untuk palet sepatu) ---
  function rgbV15(hex, f) {
    let h = String(hex || "#7dd3fc").replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return { r: 125, g: 211, b: 252 };
    const n = parseInt(h, 16);
    return {
      r: Math.max(0, Math.min(255, Math.round(((n >> 16) & 255) * f))),
      g: Math.max(0, Math.min(255, Math.round(((n >> 8) & 255) * f))),
      b: Math.max(0, Math.min(255, Math.round((n & 255) * f)))
    };
  }
  function rgbaV15(hex, f, a) {
    const c = rgbV15(hex, f);
    return "rgba(" + c.r + "," + c.g + "," + c.b + "," + a + ")";
  }
  function rgbV15s(hex, f) {
    const c = rgbV15(hex, f);
    return "rgb(" + c.r + "," + c.g + "," + c.b + ")";
  }

  // --- Data cadangan (identik dengan menu.js jalurJurus) dipakai bila
  // menu.js yang termuat ternyata versi lama (tanpa jalurJurus). ---
  function netralV15(aksen, dua) {
    return dua
      ? [{ d: "M13 2L5 14h6l-1 8 8-12h-6z", warna: aksen, tebal: 1.8 }]
      : [{ d: "M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z", warna: aksen, tebal: 1.8 }];
  }
  function umbraV15(aksen) {
    return [
      { d: "M4 12h16", warna: "#e9d5ff", tebal: 2.6 },
      { d: "M6 9l.5 6M9 8l.5 8M12 7.5l.5 9M15 8l.5 8M18 9l.5 6", warna: aksen, tebal: 1.4, op: .85 },
      { d: "M7.5 12h9M8 15h8M8 9h8", warna: aksen, tebal: 1.1, op: .5 }
    ];
  }
  function sonicV15(aksen) {
    return [
      { d: "M3 16a9 9 0 0 1 18 0", warna: "#b3e5fc", tebal: 2.4 },
      { d: "M6 16a6 6 0 0 1 12 0", warna: aksen, tebal: 1.8 },
      { d: "M9 16a3 3 0 0 1 6 0", warna: "#e1f5fe", tebal: 1.4 },
      { d: "M8 18v2.5M12 18.5v2.5M16 18v2.5", warna: "#b3e5fc", tebal: 1.4 }
    ];
  }
  var FROZFALL_V15 = [
    { d: "M12 2.6v9.6", warna: "#7dd3fc", tebal: 2 },
    { d: "M9.7 4.9L12 3.5l2.3 1.4", warna: "#b3e5fc", tebal: 1.6 },
    { d: "M12 11.8l-3.1 3.1M12 11.8l3.1 3.1", warna: "#e1f5fe", tebal: 1.9 },
    { d: "M12 14.9l.9 1.5a.95.95 0 0 1-1.8 0z", warna: "#7dd3fc", isi: true },
    { d: "M5.1 8.3l.8.8M6 8.3v1M6 8.3l1.1-1", warna: "#4fc3f7", tebal: 1.2 },
    { d: "M18.5 6.2l.8.8M19.7 6.2v1M19.7 6.2l1.1-1", warna: "#4fc3f7", tebal: 1.2 },
    { d: "M16.9 13.7l-.7.7M17.6 14.4l.8-.7", warna: "#b3e5fc", tebal: 1.2 }
  ];
  function rinV15(aksen) {
    return [
      { d: "M3 17a9 9 0 0 1 18 0", warna: "#ff3d00", tebal: 2.6 },
      { d: "M6 17a6 6 0 0 1 12 0", warna: "#ff9100", tebal: 1.8 },
      { d: "M9 17a3 3 0 0 1 6 0", warna: "#ffee58", tebal: 1.4 }
    ];
  }
  var INFERNO_V15 = [
    { d: "M4.2 19A10.5 10.5 0 0 1 19.8 19", warna: "#ff3d00", tebal: 2.3 },
    { d: "M8.1 19A8 8 0 0 1 15.9 19", warna: "#ff9100", tebal: 1.6, op: .85 },
    { d: "M12 16.4l2.4 4.2a2.4 2.4 0 0 1-4.8 0z", warna: "#ffd54f", isi: true },
    { d: "M12 17.3l1.5 2.6a1.5 1.5 0 0 1-3 0z", warna: "#ff9100", isi: true },
    { d: "M5.6 21.7l1-1.7M4.3 23.1l1.3-1M18.4 21.7l-1-1.7M19.7 23.1l-1.3-1", warna: "#ff6a00", tebal: 1.2, op: .85 }
  ];
  function serangJarakV15(aksen) {
    return [
      { d: "M5 19L16 8", warna: aksen, tebal: 2.2 },
      { d: "M13 5l6 6", warna: aksen, tebal: 2.2 },
      { d: "M15 5h4v4", warna: aksen, tebal: 2.2 },
      { d: "M5 19l1.5-3.5L10 17z", warna: aksen, isi: true }
    ];
  }
  function serangDekatV15(aksen) {
    return [
      { d: "M4 18C8 14 14 8 20 4", warna: aksen, tebal: 2.4 },
      { d: "M4 18l.5-3M4 18l3-.5", warna: aksen, tebal: 1.6 }
    ];
  }

  // Koreksi pusat optik per jurus (satuan 24x24, sumbu y ke bawah). Bounding
  // box tiap gambar vektor tidak persis di tengah 12,12; tabel ini menepatkan
  // titik visualnya.
  var KOREKSI_V15 = {
    "kenzro|2": { dx: 0, dy: -2 },
    "kenzro|3": { dx: -0.4, dy: 2 },
    "kenzro|4": { dx: 0, dy: 1.5 },
    "rin|2": { dx: 0, dy: -0.5 },
    "rin|3": { dx: 0, dy: -3.8 },
    "rin|4": { dx: 0, dy: 1.5 },
    "voiz|2": { dx: 0, dy: -0.25 },
    "voiz|3": { dx: 0, dy: 1.5 },
    "voiz|4": { dx: 0, dy: 0 }
  };
  function koreksiV15(kar, slot) {
    if (!kar) return { dx: 0, dy: 0 };
    return KOREKSI_V15[(kar.kunci || "") + "|" + slot] || { dx: 0, dy: 0 };
  }

  function jalurIkonV15(kar, slot) {
    if (!kar) return null;
    try {
      if (typeof jalurJurus === "function") {
        const j = jalurJurus(kar, slot);
        if (Array.isArray(j) && j.length) return j;
      }
    } catch (err) {}
    const jarak = kar.tipe === "jarak";
    const aksen = kar.warnaDash || (jarak ? "#7dd3fc" : "#ff4d4d");
    if (slot === 1) return jarak ? serangJarakV15(aksen) : serangDekatV15(aksen);
    if (kar.kunci === "voiz") {
      if (slot === 2) return umbraV15(aksen);
      if (slot === 3) return netralV15(aksen, false);
      if (slot === 4) return netralV15(aksen, true);
      return netralV15(aksen, false);
    }
    if (jarak) {
      if (slot === 2) return sonicV15(aksen);
      if (slot === 3) return FROZFALL_V15;
      if (slot === 4) return netralV15(aksen, false);
      return netralV15(aksen, true);
    }
    if (slot === 2) return rinV15(aksen);
    if (slot === 3) return INFERNO_V15;
    if (slot === 4) return netralV15(aksen, false);
    return netralV15(aksen, true);
  }

  var IDS_V15 = [["tombolSkill", 2], ["tombolSkill2", 3], ["tombolSkill3", 4]];

  function ukuranKanvas(btn, cv) {
    let s = cv.width || cv.height || 0;
    if (s < 8) s = Math.max(24, Math.round((btn.clientWidth || 100) * 0.56));
    if (s < 8) s = 48;
    return s;
  }

  function gambarSerangV15() {
    if (!karakter) return;
    const btn = document.getElementById("tombolSerang");
    if (!btn) return;
    const cv = btn.querySelector(".ikon-sentuh");
    if (!cv) return;
    const c = cv.getContext ? cv.getContext("2d") : null;
    if (!c) return;
    const s = ukuranKanvas(btn, cv);
    c.clearRect(0, 0, s, s);
    c.fillStyle = "rgba(0,0,0,0.62)";
    c.fillRect(0, 0, s, s);
    const jalur = jalurIkonV15(karakter, 1);
    if (jalur && jalur.length) {
      const ukuran = s * 0.82;
      c.save();
      c.translate((s - ukuran) / 2, (s - ukuran) / 2);
      lukisLogoV15(c, jalur, ukuran, 0, 0);
      c.restore();
    }
    btn.dataset.serangv15 = "1";
  }

  function gambarDashV15() {
    if (!karakter) return;
    if (typeof _gambarSepatu !== "function") return;
    const btn = document.getElementById("tombolDash");
    if (!btn) return;
    const cv = btn.querySelector(".ikon-sentuh");
    if (!cv) return;
    const c = cv.getContext ? cv.getContext("2d") : null;
    if (!c) return;
    const s = ukuranKanvas(btn, cv);
    c.clearRect(0, 0, s, s);
    c.fillStyle = "rgba(0,0,0,0.62)";
    c.fillRect(0, 0, s, s);
    const cx = s / 2, cy = s / 2;
    const sk = (s / 34) * 0.9;
    if (karakter.tipe === "dekat") {
      _gambarSepatu(c, cx, cy, sk, "#ffffff", "#ff4d4d", "#ff2030");
    } else {
      const wd = karakter.warnaDash || "#7dd3fc";
      const solG = rgbaV15(wd, 0.5, 0.85);
      const gel = rgbaV15(wd, 0.75, 0.9);
      const cer = rgbaV15(wd, 1.5, 1);
      _gambarSepatu(c, cx - 3, cy, sk * 0.85, gel, solG, rgbV15s(wd, 1));
      _gambarSepatu(c, cx + 3, cy, sk * 0.85, cer, gel, rgbV15s(wd, 1));
    }
    btn.dataset.dashv15 = "1";
  }

  function gambarUlangSkillV15() {
    if (!karakter) return;
    for (let i = 0; i < IDS_V15.length; i++) {
      const id = IDS_V15[i][0];
      const slot = IDS_V15[i][1];
      const btn = document.getElementById(id);
      if (!btn) continue;
      const cv = btn.querySelector(".ikon-sentuh");
      if (!cv) continue;
      const c = cv.getContext ? cv.getContext("2d") : null;
      if (!c) continue;
      const s = ukuranKanvas(btn, cv);
      c.clearRect(0, 0, s, s);
      c.fillStyle = "rgba(0,0,0,0.62)";
      c.fillRect(0, 0, s, s);
      c.save();
      c.fillStyle = "rgba(6,8,14,.45)";
      c.beginPath();
      c.arc(s / 2, s / 2, s * 0.34, 0, Math.PI * 2);
      c.fill();
      c.restore();
      const jalur = jalurIkonV15(karakter, slot);
      if (jalur && jalur.length) {
        const ukuran = s * 0.76;
        const kor = koreksiV15(karakter, slot);
        c.save();
        c.translate((s - ukuran) / 2, (s - ukuran) / 2);
        lukisLogoV15(c, jalur, ukuran, kor.dx, kor.dy);
        c.restore();
      }
      btn.dataset.ikonv15 = "1";
    }
  }

  var pasangLamaV15 = window.pasangIkonSentuh;

  function pasangIkonSentuhV15() {
    try { if (typeof pasangLamaV15 === "function") pasangLamaV15(); } catch (err) {}
    try { gambarSerangV15(); } catch (err) {}
    try { gambarDashV15(); } catch (err) {}
    try { gambarUlangSkillV15(); } catch (err) {}
  }

  window.pasangIkonSentuh = pasangIkonSentuhV15;

  try { console.log("[DEB ikon v15] " + (karakter ? karakter.kunci : "?")); } catch (err) {}

  try { pasangIkonSentuhV15(); } catch (err) {}

  window.addEventListener("resize", function () {
    try { pasangIkonSentuhV15(); } catch (err) {}
  });

  // Pantau pergantian karakter & perangkat, lalu gambar ulang logo — penting
  // bila input.js lama tidak menggambar ulang saat karakter dipilih.
  if (typeof requestAnimationFrame === "function") {
    var kunciPantau = "";
    var devPantau = "";
    (function pantauV15() {
      requestAnimationFrame(pantauV15);
      var k2 = karakter ? karakter.kunci : "";
      var d2 = typeof deviceTerpilih !== "undefined" ? deviceTerpilih : "";
      if (k2 !== kunciPantau || d2 !== devPantau) {
        kunciPantau = k2;
        devPantau = d2;
        try { pasangIkonSentuhV15(); } catch (err) {}
      }
    })();
  }
})();