const layarJudul = document.getElementById("layarJudul");
const layarLevel = document.getElementById("layarLevel");
const layarPilih = document.getElementById("layarPilih");
const layarKarakter = document.getElementById("layarKarakter");
const layarGameOver = document.getElementById("layarGameOver");
const layarMenang = document.getElementById("layarMenang");
const layarPause = document.getElementById("layarPause");
const tombolPause = document.getElementById("tombolPause");
const daftarKarakter = document.getElementById("daftarKarakter");
const koinAkhirEl = document.getElementById("skorAkhir");
const koinMenangEl = document.getElementById("skorMenang");
const judulAkhirEl = document.getElementById("judulAkhir");

const layarDevice = document.getElementById("layarDevice");
const layarPutar = document.getElementById("layarPutar");

// ========== EQUIP ANIMATION EFFECTS ==========
function spawnEquipBurst(kotak, warna) {
  if (!kotak || !document.body.contains(kotak)) return;
  
  const rect = kotak.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  
  // Buat 6-8 particle yang burst keluar
  const jumlahParticle = 6 + Math.floor(Math.random() * 3);
  for (let i = 0; i < jumlahParticle; i++) {
    const angle = (i / jumlahParticle) * Math.PI * 2;
    const distance = 40 + Math.random() * 30;
    
    const p = document.createElement("div");
    p.className = "equip-particle";
    p.style.left = cx + "px";
    p.style.top = cy + "px";
    p.style.width = (3 + Math.random() * 6) + "px";
    p.style.height = p.style.width;
    p.style.background = warna;
    p.style.opacity = "1";
    p.style.boxShadow = "0 0 " + (4 + Math.random() * 4) + "px " + warna;
    
    // Burst direction
    const px = Math.cos(angle) * distance;
    const py = Math.sin(angle) * distance;
    
    p.style.setProperty("--px", px + "px");
    p.style.setProperty("--py", py + "px");
    p.style.animation = "equipParticleBurst " + (0.4 + Math.random() * 0.2) + "s ease-out forwards";
    
    document.body.appendChild(p);
    
    // Cleanup
    setTimeout(() => {
      if (p.parentNode) p.parentNode.removeChild(p);
    }, 700);
  }
}

// Spawn sparkle effect untuk slot kosong saat hover - SIMPLIFIED
function spawnSlotSparkles(kotak, jumlah) {
  if (!kotak || !document.body.contains(kotak)) return;
  
  const rect = kotak.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  
  const sparkleCount = jumlah || 3;
  for (let i = 0; i < sparkleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 20 + Math.random() * 20;
    
    const s = document.createElement("div");
    s.className = "slot-sparkle";
    s.style.left = cx + "px";
    s.style.top = cy + "px";
    s.style.width = (2 + Math.random() * 2) + "px";
    s.style.height = s.style.width;
    s.style.background = "#fff";
    s.style.borderRadius = "50%";
    s.style.position = "fixed";
    s.style.pointerEvents = "none";
    s.style.opacity = 0.6;
    s.style.boxShadow = "0 0 2px rgba(255,255,255,0.8)";
    
    const px = Math.cos(angle) * distance;
    const py = Math.sin(angle) * distance;
    
    s.style.setProperty("--px", px + "px");
    s.style.setProperty("--py", py + "px");
    s.style.animation = "slotSparkleFade " + (0.4 + Math.random() * 0.2) + "s ease-out forwards";
    
    document.body.appendChild(s);
    
    setTimeout(() => {
      if (s.parentNode) s.parentNode.removeChild(s);
    }, 600);
  }
}

function kunciLandscapeMobile() {
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen()
      .then(() => {
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock("landscape").catch(() => {});
        }
      })
      .catch(() => {});
  }
}

function cekOrientasi() {
  if (deviceTerpilih !== "mobile") return;
  if (!layarPutar) return;
  const portrait = window.innerHeight > window.innerWidth;
  layarPutar.classList.toggle("tampil", portrait);
}

window.addEventListener("resize", cekOrientasi);
window.addEventListener("orientationchange", () => setTimeout(cekOrientasi, 200));

function pilihDevice(dev) {
  deviceTerpilih = dev;
  document.body.dataset.device = dev;
  try { localStorage.setItem("soul-essence-device", dev); } catch (err) {}
  bukaAudio();

  if (typeof latarSkala === "function" && latarSkala() !== latarSkalaTerpakai) latarCache = null;
  layarDevice.classList.add("hidden");

  if (statusGame === "title" && layarJudul && layarJudul.classList.contains("hidden")) {
    layarJudul.classList.remove("hidden");
  }
  if (dev === "mobile") {
    kunciLandscapeMobile();
    cekOrientasi();
  }
}
layarDevice.querySelectorAll("[data-device]").forEach((b) =>
  b.addEventListener("click", () => pilihDevice(b.dataset.device)));

let _statusNotaTerakhir = null;
function aturNotaKartu() {
  if (_statusNotaTerakhir === statusGame) return;
  _statusNotaTerakhir = statusGame;
  const nota = document.getElementById("notaKartu");
  if (!nota) return;
  const tampil = statusGame === "main" || statusGame === "upgrade" ||
    statusGame === "pause" || statusGame === "over" || statusGame === "menang";
  nota.classList.toggle("tampil", tampil);
}

function aturTombolPause() {
  if (statusGame === "main") {
    tombolPause.classList.remove("hidden");
  } else {
    tombolPause.classList.add("hidden");
  }
}

function sembunyiSemua() {
  layarJudul.classList.add("hidden");
  layarLevel.classList.add("hidden");
  layarPilih.classList.add("hidden");
  layarKarakter.classList.add("hidden");
  layarGameOver.classList.add("hidden");
  layarPause.classList.add("hidden");
  layarMenang.classList.add("hidden");
  if (typeof hentikanKonfeti === "function") hentikanKonfeti();

  if (!animMati && statusGame !== "main") {
    zoomKamera = 1;
    aturFilterMati(0);
  }
}

function tampilkanJudul() {

  statusGame = "title";
  karakter = null;
  koin = 0;
  try {
    sembunyiSemua();
  } catch (err) {
    errorBanner = err && err.message ? err.message : String(err);
  }
  layarJudul.classList.remove("hidden");
  try {
    resetArena({ koinBaru: true });
    segarkanSaldoJudul();
    aturTombolPause();
    if (typeof setMusik === "function") setMusik("lobby");
  } catch (err) {
    errorBanner = err && err.message ? err.message : String(err);
    if (err && err.stack) {
      const st = err.stack.split("\n");
      if (st[1]) errorBanner += " — " + st[1].trim();
    }
  }
}

function segarkanSaldoJudul() {
  const el = document.getElementById("saldoJudul");
  if (!el) return;
  const saldo = typeof progres === "object" && progres ? progres.koinSaldo : 0;
  el.textContent = saldo > 0 ? ("KOIN TERSIMPAN: " + saldo) : "";
}

function ikonTipeSVG(kar) {
  if (kar && kar.tipe === "jarak") {
    return '<svg class="ikon-stat" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19L19 5"/><path d="M9 5h10v10"/></svg>';
  }
  return '<svg class="ikon-stat" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#c8d6ea" stroke-width="2.2" stroke-linecap="round"><path d="M4.5 4.5L19.5 19.5"/><path d="M19.5 4.5L4.5 19.5"/><path d="M15.7 18.3l3-3"/><path d="M5.7 15.7l3 3"/></svg>';
}

function ikonElemenSVG(el) {
  const e = String(el || "").toLowerCase();
  if (e === "api") {
    return '<svg class="ikon-stat ikon-elemen" viewBox="0 0 24 24" width="46" height="46">' +
      '<defs><linearGradient id="gradApi" x1="0" y1="1" x2="0" y2="0">' +
      '<stop offset="0%" stop-color="#ff3d00"/><stop offset="55%" stop-color="#ff9100"/><stop offset="100%" stop-color="#ffee58"/>' +
      '</linearGradient></defs>' +
      '<path fill="url(#gradApi)" d="M13.5 1.5c.3 2.8 1.9 4.2 3.4 6.1 1.4 1.8 2.6 3.7 2.6 6.4 0 4.1-3.2 7.5-7.5 7.5S4.5 18.1 4.5 14c0-2.4 1-4.3 2.4-6.1.5 1.3 1.3 2.1 2.4 2.5-.4-3.1.5-6.3 1.8-8.4.3 1.9 1 3.1 2 3.9.6-1.5.6-3.1.4-4.4z"/>' +
      '<path fill="#ffd54f" opacity="0.9" d="M12.2 10.5c.6 1.5 2.4 2.6 2.4 5 0 1.9-1.3 3.4-3.1 3.4s-3.1-1.5-3.1-3.4c0-1.5.8-2.6 1.7-3.6.3.9.8 1.4 1.5 1.7-.2-1.2 0-2.3.6-3.1z"/>' +
      '</svg>';
  }
  if (e === "es") {
    return '<svg class="ikon-stat ikon-elemen" viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="#b3e5fc" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M12 2.5v19M3.8 7.2l16.4 9.6M20.2 7.2L3.8 16.8"/>' +
      '<path d="M9.9 4.6L12 5.8l2.1-1.2"/>' +
      '<path d="M9.9 19.4L12 18.2l2.1 1.2"/>' +
      '<path d="M17.4 6.5v2.4l2.1 1.2"/>' +
      '<path d="M6.6 6.5v2.4l-2.1 1.2"/>' +
      '<path d="M17.4 17.5v-2.4l2.1-1.2"/>' +
      '<path d="M6.6 17.5v-2.4l-2.1-1.2"/>' +
      '</svg>';
  }
  return "";
}

let karakterUpgrade = null;

function tampilkanKarakter() {
  sembunyiSemua();
  statusGame = "title";
  if (!karakterUpgrade) {

    karakterUpgrade = KARAKTER[0] ? KARAKTER[0].kunci : null;
  }
        layarKarakter.classList.remove("hidden");
        gantiTabKarakter(tabKarakter);
        buatPilihanUpgrade();
  aturTombolPause();
  if (typeof setMusik === "function") setMusik("lobby");
}

function segarkanSaldoKarakter() {
  const el = document.getElementById("saldoKarakter");
  if (!el) return;
  const saldo = typeof progres === "object" && progres ? progres.koinSaldo : 0;
  el.textContent = "KOIN KAMU: " + saldo;
}


// ============ IKON ARTEFAK ============
// Visual tiap set dibuat dari ELEMENT-nya, jadi dua set langsung kelihatan
// beda elemennya (semuanya nambah ATRIBUT ELEMENT):
//   es   -> kristal salju   -> Logo Salju (Glacier)
//   bara -> nyala api      -> Logo Bara (Ember)
// Tambah set baru = tambah 1 keterangan di ARTEFAK_IKON_SET.
const ARTEFAK_IKON_SET = {
  es: '<g stroke-linecap="round" stroke-linejoin="round">'
    + '<g transform="rotate(0 12 12)">'
    + '<path d="M12 2.2v19.6" stroke-width="1.3"/>'
    + '<path d="M9.1 4.6l2.9 2.6M14.9 4.6l-2.9 2.6" stroke-width="1.2"/>'
    + '<path d="M9.1 19.4l2.9-2.6M14.9 19.4l-2.9-2.6" stroke-width="1.2"/>'
    + '</g>'
    + '<g transform="rotate(60 12 12)">'
    + '<path d="M12 2.2v19.6" stroke-width="1.3"/>'
    + '<path d="M9.1 4.6l2.9 2.6M14.9 4.6l-2.9 2.6" stroke-width="1.2"/>'
    + '<path d="M9.1 19.4l2.9-2.6M14.9 19.4l-2.9-2.6" stroke-width="1.2"/>'
    + '</g>'
    + '<g transform="rotate(120 12 12)">'
    + '<path d="M12 2.2v19.6" stroke-width="1.3"/>'
    + '<path d="M9.1 4.6l2.9 2.6M14.9 4.6l-2.9 2.6" stroke-width="1.2"/>'
    + '<path d="M9.1 19.4l2.9-2.6M14.9 19.4l-2.9-2.6" stroke-width="1.2"/>'
    + '</g>'
    + '<path d="M12 8.5l3.5 3.5-3.5 3.5-3.5-3.5z" fill="#7dd3fc" stroke="none" opacity=".85"/>'
    + '</g>',
  bara: '<g stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="M12 3.2c3.2 3.6 5.8 6.4 5.8 9.6A5.8 5.8 0 0 1 12 21.2 5.8 5.8 0 0 1 6.2 12.8c0-3.2 2.6-6 5.8-9.6z" stroke-width="1.5"/>'
    + '<path d="M12 20.5a2.6 2.6 0 0 0 2.6-3.1c-.2-1.5-1.4-2.4-2.6-4-1.2 1.6-2.4 2.5-2.6 4a2.6 2.6 0 0 0 2.6 3.1z" stroke-width="1.1" opacity=".7"/>'
    + '<path d="M17.9 4.6h4.1M19.3 7.6h2.7" stroke-width="1.1" opacity=".55"/>'
    + '</g>',
  angin: '<g stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="M12 4.4s1.9 2.4 1.9 4.6a1.9 1.9 0 0 1-3.8 0C10.1 6.8 12 4.4 12 4.4z" stroke-width="1.5"/>'
    + '<path d="M12 8.2V19.4" stroke-width="1.2"/>'
    + '<path d="M8.1 10.4c-2.5.7-4.1.9-4.1-.5 0-1.6 1.7-2.5 3.9-2.2" stroke-width="1.1" opacity=".6"/>'
    + '<path d="M15.9 10.4c2.5.7 4.1.9 4.1-.5 0-1.6-1.7-2.5-3.9-2.2" stroke-width="1.1" opacity=".6"/>'
    + '</g>',
  gemuruh: '<path d="M13.4 2.2L6.4 13.4h4.1l-1.4 8.4 7.2-11.8h-4.2z" stroke-width="1.5" stroke-linejoin="round"/>'
};

// Lambang tiap slot (netral), dipakai sebagai badge kecil di pojok kotak/kartu.
const ARTEFAK_IKON_SLOT = {
  crown: '<path d="M1.2 3.4L4 5.7 6 2.2l2 3.5 2.8-2.3-.9 6.4H2.1z" stroke-width="1.4" stroke-linejoin="round"/>',
  armor: '<path d="M6 1.2L1.8 2.8v3.4c0 2.3 1.7 3.8 4.2 4.4 2.5-.6 4.2-2.1 4.2-4.4V2.8z" stroke-width="1.4" stroke-linejoin="round"/>',
  legging: '<path d="M3.2 1.4h5.6l-.6 9.2H6.6L6 6.2 5.4 10.6H3.8z" stroke-width="1.4" stroke-linejoin="round"/>',
  boots: '<path d="M2.2 1.4h3.3v4L9 7.2c.8.4 1.3 1 1.3 1.8v1.6H2.2z" stroke-width="1.4" stroke-linejoin="round"/>'
};

// Lambang slot kecil (diwarnai sesuai set yang dipasang)
function ikonSlotArtefak(slotKunci, warna) {
  const isi = ARTEFAK_IKON_SLOT[slotKunci];
  if (!isi) return "";
  return svgIkon("ikon-slot", "0 0 12 12", isi, warna || "#8a93a5");
}

// Ikon stat supaya ngxdamage/hp/kecepatan tidak cuma beda tulisan.
const ARTEFAK_IKON_STAT = {
  hp: 'M6 11C6 11 .6 7.4 .6 4.3.6 2.5 2 1.1 3.7 1.1c1 0 1.9.5 2.3 1.3.4-.8 1.3-1.3 2.3-1.3 1.7 0 3.1 1.4 3.1 3.2C11.4 7.4 6 11 6 11z',
  damage: 'M6 .4l1.5 2.7 2.9-1-1.4 2.7 2.4 2-2.9.6.9 2.7L6 9.4 3.5 10.1l.9-2.7L1.5 6.8l2.4-2L2.6 2.1l2.9 1z',
  kecepatan: 'M7.2 .4L2.2 6.9h3.1L4.6 11.6 9.8 4.9H6.6z',
  atributElement: 'M6 .4c.9 3.3 2.3 4.7 5.6 5.6C8.3 6.9 6.9 8.3 6 11.6 5.1 8.3 3.7 6.9.4 6c3.3-.9 4.7-2.3 5.6-5.6z' +
    'M14 13l1.9 3.1L19 18l-3.1 1.9L14 23l-1.9-3.1L9 18l3.1-1.9z'
};

function svgIkon(kelas, viewBox, isi, warna) {
  return '<svg class="' + kelas + '" viewBox="' + viewBox + '" fill="none" stroke="' + warna
    + '" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">' + isi + '</svg>';
}

// Lambang set (warna ikut set)
function ikonSetArtefak(set) {
  const isi = ARTEFAK_IKON_SET[set.kunci];
  if (!isi) return "";
  return svgIkon("ikon-artefak", "0 0 24 24", isi, set.warna);
}

// Derby rarity: ★ diulang sesuai bintang, warna ikut rarity (Genshin-style).
function ikonBintangArtfak(bintang, warna) {
  const n = Math.min(5, Math.max(0, bintang || 0));
  let s = "";
  for (let i = 0; i < n; i++) s += "★";
  return '<span class="artefak-bintang" style="color:' + (warna || "#cbd5e1") + '">' + s + '</span>';
}

// Ikon stat (isi, bukan garis)
function ikonStatArtefak(stat, warna) {
  const isi = ARTEFAK_IKON_STAT[stat];
  if (!isi) return "";
  return '<svg class="ikon-stat" viewBox="0 0 12 12" fill="' + warna
    + '" stroke="none" aria-hidden="true">' + isi + '</svg>';
}

// Satu butir stat: [ikon] nama +nilai. Labelnya pakai textContent (bukan
// rakit HTML) supaya aman dan tetap terbaca screen reader.
function buatStatArtefak(stat, nilai, warna) {
  const s = document.createElement("span");
  s.className = "artefak-stat";

  const ic = document.createElement("span");
  ic.className = "artefak-stat-ikon";
  ic.innerHTML = ikonStatArtefak(stat, warna);
  s.appendChild(ic);

  const t = document.createElement("span");
  t.className = "artefak-stat-teks";
  t.textContent = namaStatPendek(stat) + " +" + nilai;
  s.appendChild(t);
  return s;
}

// ============ EFEK SET LENGKAP (4/4) PER ELEMENT ============
// Tiap element punya bentuk sendiri biar fantasy-nya kelihatan:
//   es       -> garis duri kristal + duri es & salju di sekitar logo
//   bara     -> riak panas + nyala api & bara apung
//   angin    -> pusaran lebar + pusaran angin & daun
//   gemuruh  -> kilat tajam + percikan petir
const ARTEFAK_EL_EFEK = {
  es: { butir: 9, gaya: "duri" },
  bara: { butir: 9, gaya: "riak" },
  angin: { butir: 8, gaya: "pusar" },
  gemuruh: { butir: 10, gaya: "kilat" }
};

const ALIR_ASAL = [[30, 14], [70, 14], [30, 86], [70, 86]];

function alirPolar(sudut, jarak) {
  const a = sudut * Math.PI / 180;
  return [50 + Math.cos(a) * jarak, 50 + Math.sin(a) * jarak];
}
function alirPt(p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }
function alirPtSpasi(p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }

// garis dari titik asal ke tengah (tengah = 50 50), bentuknya ikut gaya element
function alirDuri(asal, amp) {
  const dx = asal[0] - 50, dy = asal[1] - 50;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const n = 5;
  // mulai dari pojok kartu slot, zigzag masuk ke titik tengah
  let d = "M" + asal[0].toFixed(1) + " " + asal[1].toFixed(1);
  for (let i = n - 1; i >= 1; i--) {
    const t = i / n;
    const s = (i % 2 ? amp : -amp) * (1 - t * 0.35);
    d += " L" + (50 + dx * t + nx * s).toFixed(1) + " " + (50 + dy * t + ny * s).toFixed(1);
  }
  return d + " L50 50";
}
function alirRiak(asal, amp) {
  const dx = asal[0] - 50, dy = asal[1] - 50;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const cx = 50 + dx * 0.5 + nx * amp, cy = 50 + dy * 0.5 + ny * amp;
  return "M" + asal[0].toFixed(1) + " " + asal[1].toFixed(1)
    + " Q" + cx.toFixed(1) + " " + cy.toFixed(1) + " 50 50";
}
function alirPusar(asal, amp) {
  const dx = asal[0] - 50, dy = asal[1] - 50;
  const n1x = -dy / (Math.hypot(dx, dy) || 1), n1y = dx / (Math.hypot(dx, dy) || 1);
  // dibalik arah: control point ditukar agar lekukan sama
  return "M" + asal[0].toFixed(1) + " " + asal[1].toFixed(1) + " C"
    + (50 + dx * 0.68 - n1x * amp * 1.3).toFixed(1) + " " + (50 + dy * 0.68 - n1y * amp * 1.3).toFixed(1) + " "
    + (50 + dx * 0.28 + n1x * amp).toFixed(1) + " " + (50 + dy * 0.28 + n1y * amp).toFixed(1) + " "
    + "50 50";
}
function alirKilat(asal) {
  const dx = asal[0] - 50, dy = asal[1] - 50;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const n = 4;
  let d = "M" + asal[0].toFixed(1) + " " + asal[1].toFixed(1);
  for (let i = n - 1; i >= 1; i--) {
    const t = i / n;
    const s = (i % 2 ? 12 : -9) * (1 - t * 0.3);
    d += " L" + (50 + dx * t + nx * s).toFixed(1) + " " + (50 + dy * t + ny * s).toFixed(1);
  }
  return d + " L50 50";
}

function gambarAlirArtefak(grid, lambang, kotakSlot, elemen) {
  if (!grid) return null;
  if (grid.__alirEl) { try { grid.removeChild(grid.__alirEl); } catch (e) {} }

  const alir = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  alir.setAttribute("class", "arti-alir el-" + elemen);
  alir.setAttribute("preserveAspectRatio", "none");

  const gb = grid.getBoundingClientRect();
  const tersembunyi = globalThis.__layoutSembunyi === true || grid.offsetParent === null
    || grid.getClientRects().length === 0 || gb.width < 1 || gb.height < 1;

  const cx = 50;
  const cy = 50;
  const pilih = [[1, 1], [0, 1], [1, 0], [0, 0]];
  const mulai = [];
  let viewBox;

  if (tersembunyi) {
    viewBox = "0 0 100 100";
    const pxy = [[14, 12], [86, 12], [14, 88], [86, 88]];
    for (let i = 0; i < ARTEFAK_SLOT.length; i++) {
      mulai.push({ x: pxy[i][0], y: pxy[i][1] });
    }
  } else {
    grid.appendChild(alir);
    const sr = alir.getBoundingClientRect();
    grid.removeChild(alir);
    const lb = lambang ? lambang.getBoundingClientRect() : { left: sr.left, top: sr.top, width: 1, height: 1 };
    const x0 = lb.left + lb.width / 2 - sr.left - 50;
    const y0 = lb.top + lb.height / 2 - sr.top - 50;
    viewBox = (-x0) + " " + (-y0) + " " + sr.width + " " + sr.height;
    for (let i = 0; i < ARTEFAK_SLOT.length; i++) {
      const r = kotakSlot[ARTEFAK_SLOT[i].kunci];
      if (!r) continue;
      const rr = r.getBoundingClientRect();
      mulai.push({
        x: rr.left + (pilih[i][0] ? rr.width : 0) - sr.left - x0,
        y: rr.top + (pilih[i][1] ? rr.height : 0) - sr.top - y0
      });
    }
  }

  alir.setAttribute("viewBox", viewBox);

  let garis = "";
  for (let i = 0; i < mulai.length; i++) {
    const dx = mulai[i].x - cx;
    const dy = mulai[i].y - cy;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;

    const gaya = (ARTEFAK_EL_EFEK[elemen] || ARTEFAK_EL_EFEK.es).gaya;
    let d;

    if (gaya === "riak") {
      const cx2 = cx + dx * 0.5 + nx * 12;
      const cy2 = cy + dy * 0.5 + ny * 12;
      d = "M" + mulai[i].x.toFixed(1) + " " + mulai[i].y.toFixed(1) + " Q" + cx2.toFixed(1) + " " + cy2.toFixed(1) + " " + cx.toFixed(1) + " " + cy.toFixed(1);
    } else if (gaya === "pusar") {
      const cx1 = cx + dx * 0.68 - nx * 18;
      const cy1 = cy + dy * 0.68 - ny * 18;
      const cx2 = cx + dx * 0.28 + nx * 14;
      const cy2 = cy + dy * 0.28 + ny * 14;
      d = "M" + mulai[i].x.toFixed(1) + " " + mulai[i].y.toFixed(1) + " C" + cx1.toFixed(1) + " " + cy1.toFixed(1) + " " + cx2.toFixed(1) + " " + cy2.toFixed(1) + " " + cx.toFixed(1) + " " + cy.toFixed(1);
    } else if (gaya === "kilat") {
      const n = 6;
      d = "M" + mulai[i].x.toFixed(1) + " " + mulai[i].y.toFixed(1);
      for (let j = n - 1; j >= 1; j--) {
        const t = j / n;
        const s = (j % 2 ? 16 : -12) * (1 - t * 0.3);
        d += " L" + (cx + dx * t + nx * s).toFixed(1) + " " + (cy + dy * t + ny * s).toFixed(1);
      }
      d += " L" + cx.toFixed(1) + " " + cy.toFixed(1);
    } else {
      const n = 6;
      d = "M" + mulai[i].x.toFixed(1) + " " + mulai[i].y.toFixed(1);
      for (let j = n - 1; j >= 1; j--) {
        const t = j / n;
        const s = (j % 2 ? 9 : -9) * (1 - t * 0.35);
        d += " L" + (cx + dx * t + nx * s).toFixed(1) + " " + (cy + dy * t + ny * s).toFixed(1);
      }
      d += " L" + cx.toFixed(1) + " " + cy.toFixed(1);
    }

    garis += '<path class="alir-luar" d="' + d + '"/><path class="alir-dalam" d="' + d + '"/><path class="arti-alir-garis" d="' + d + '"/>';
  }

  alir.innerHTML = garis;
  alir.classList.add("aktif");
  grid.appendChild(alir);
  grid.__alirEl = alir;
  grid.__alirData = { lambang: lambang, kotakSlot: kotakSlot, elemen: elemen };
  grid.__alirSelesai = !tersembunyi;
  return alir;
}

/* Panel artefak kadang dirender saat masih tersembunyi (lebar 0). Simpan
   state di grid lalu gambar ulang begitu panel benar-benar terlihat. */
function alirCekUlang(grid) {
  if (!grid || !grid.__alirData || grid.__alirSelesai) return;
  const dd = grid.__alirData;
  const gb = grid.getBoundingClientRect();
  const masihSembunyi = globalThis.__layoutSembunyi === true || grid.offsetParent === null
    || grid.getClientRects().length === 0 || gb.width < 1 || gb.height < 1;
  if (masihSembunyi) {
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => alirCekUlang(grid));
    return;
  }
  gambarAlirArtefak(grid, dd.lambang, dd.kotakSlot, dd.elemen);
  grid.classList.add("sudah-alir");
}

// ornamen fantasy di sekitar logo tengah (viewBox 0 0 100 100)
function ornamenSetElemen(elemen) {
  let s = '<g class="el-orns">';
  if (elemen === "es") {
    for (let i = 0; i < 8; i++) {
      const a = i * 45;
      s += '<polygon class="el-duri" points="'
        + alirPt(alirPolar(a, 30)) + " " + alirPt(alirPolar(a + 9, 47)) + " " + alirPt(alirPolar(a - 9, 47)) + '"/>';
    }
    let hex = "";
    for (let i = 0; i < 6; i++) hex += alirPt(alirPolar(i * 60 - 90, 28)) + " ";
    s += '<polygon class="el-cincin" points="' + hex + '"/>';
    for (let i = 0; i < 3; i++) {
      const p = alirPolar(i * 120 + 60, 40);
      s += '<g class="el-salju" transform="translate(' + p[0].toFixed(1) + " " + p[1].toFixed(1) + ')">'
        + '<path d="M0 -3.4V3.4M-2.9 -1.7L2.9 1.7M-2.9 1.7L2.9 -1.7"/></g>';
    }
  } else if (elemen === "bara") {
    for (let i = 0; i < 8; i++) {
      const a = 195 + i * 21;
      const kiri = alirPolar(a - 11, 31), kanan = alirPolar(a + 11, 31);
      const ujung = alirPolar(a, 50), lekok = alirPolar(a, 42);
      s += '<path class="el-nyala" d="M' + alirPtSpasi(kiri)
        + " Q" + alirPtSpasi(lekok) + " " + alirPtSpasi(ujung)
        + " Q" + alirPtSpasi(lekok) + " " + alirPtSpasi(kanan) + ' Z"/>';
    }
    s += '<circle class="el-inti" cx="50" cy="50" r="30"/>';
  } else if (elemen === "angin") {
    for (let i = 0; i < 3; i++) {
      const a = i * 120;
      s += '<path class="el-pusar" d="M' + alirPt(alirPolar(a - 40, 46))
        + " C" + alirPt(alirPolar(a + 10, 16)) + " " + alirPt(alirPolar(a + 55, 44))
        + " " + alirPt(alirPolar(a + 130, 44)) + '"/>';
    }
    for (let i = 0; i < 4; i++) {
      const p = alirPolar(i * 90 + 45, 41);
      s += '<ellipse class="el-daun" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1)
        + '" rx="4" ry="1.8" transform="rotate(' + (i * 90 + 20) + " " + p[0].toFixed(1) + " " + p[1].toFixed(1) + ')"/>';
    }
  } else {
    for (let i = 0; i < 6; i++) {
      const a = i * 60 + 12;
      let d = "M" + alirPtSpasi(alirPolar(a, 28));
      for (let k = 1; k <= 3; k++) {
        d += " L" + alirPtSpasi(alirPolar(a + (k % 2 ? 12 : -9), 28 + k * 7));
      }
      s += '<path class="el-kilat" d="' + d + '"/>';
    }
    s += '<circle class="el-inti" cx="50" cy="50" r="29"/>';
  }
  return s + "</g>";
}

// partikel kecil sesuai element (salju / bara apung / daun / percikan)
// Enhanced: variation in position, timing, dan offset untuk efek lebih natural
function butirSetElemen(elemen) {
  const cfg = ARTEFAK_EL_EFEK[elemen] || ARTEFAK_EL_EFEK.es;
  let s = "";
  for (let i = 0; i < cfg.butir; i++) {
    // Variation: spread particles lebih natural across width
    const x = 8 + ((i * 37) % 84) + (Math.sin(i * 0.7) * 8);
    const t = (i * 0.13).toFixed(2);
    const d = (i * 0.37).toFixed(2);
    
    // Tambah CSS variable untuk offset particle position (pixel offset)
    const px = (Math.cos(i * 0.5) * 15);
    const py = (Math.sin(i * 0.3) * 12);
    
    // Pilih animasi berdasarkan elemen
    let anim = "elJatuhEnhanced";
    if (cfg.gaya === "riak") anim = "elNaikEnhanced";
    else if (cfg.gaya === "pusar") anim = "elTerbangEnhanced";
    
    s += '<i class="el-butir" style="--bx:' + x.toFixed(1) + '%;--bt:' + t + 's;--bd:' + d + 's;--px:' + px.toFixed(1) + 'px;--py:' + py.toFixed(1) + 'px;animation-name:' + anim + '"></i>';
  }
  return s;
}

// Slot artefak sekarang ringkas: nama slot + artefak yang terpasang + tombol "+".
// Semua daftar & aksi dipindah ke modal (bukaPemilihArtefak).
function gambarArtefakKarakter(kar) {
  const grid = document.getElementById("daftarArtefak");
  if (!grid) return;
  grid.innerHTML = "";
  grid.__alirData = null;
  grid.__alirSelesai = false;
  grid.classList.remove("sudah-alir");
  const pakai = typeof artefakPakai === "function" ? artefakPakai(kar.kunci) : {};

  // Kalau belum punya artefak satu pun, jelaskan caranya. Tanpa ini panel
  // cuma tampil 4 kolom kosong dan terlihat seperti UI yang rusak.
  const totalPunya = typeof koleksiArtefak === "function" ? koleksiArtefak().length : 0;
  if (totalPunya === 0) {
    const kosong = document.createElement("div");
    kosong.className = "artefak-kosong";
    kosong.textContent = "BELUM PUNYA ARTEFAK. Artefak didapat dengan mengalahkan bos.";
    grid.appendChild(kosong);
    return;
  }

  const kotakSlot = {};
  for (let i = 0; i < ARTEFAK_SLOT.length; i++) {
    const slot = ARTEFAK_SLOT[i];
    const kolom = document.createElement("div");
    kolom.className = "slot-artefak";
    kolom.setAttribute("data-kunci", slot.kunci);
    kotakSlot[slot.kunci] = kolom;

    const idPakai = pakai[slot.kunci] || null;
    const cariPakai = idPakai && typeof artefakCari === "function" ? artefakCari(idPakai) : null;
    if (cariPakai) kolom.classList.add("slot-artefak-terpakai");
    kolom.style.color = cariPakai ? cariPakai.set.warna : "";

    // kartu dengan tampilan sama seperti box karakter: logo element di atas,
    // nama set, lalu baris level + bintang. Whole card = buka pemilih slot.
    const kotak = document.createElement("button");
    kotak.className = "slot-artefak-kotak";
    kotak.type = "button";
    kotak.title = cariPakai ? null : "Pilih artefak untuk " + slot.nama;
    kotak.onclick = () => bukaPemilihArtefak(kar, slot);

    if (cariPakai) {
      const lambang = document.createElement("div");
      lambang.className = "slot-art-lambang";
      lambang.innerHTML = ikonSetArtefak(cariPakai.set);
      
      // Trigger equip animation + particle burst effect
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(() => {
          lambang.classList.add("equip-animate");
          spawnEquipBurst(kotak, cariPakai.set.warna);
        });
      }
      
      kotak.appendChild(lambang);
      kotak.classList.add("equipped");

      const badgeSlot = document.createElement("div");
      badgeSlot.className = "slot-art-badge";
      badgeSlot.innerHTML = ikonSlotArtefak(slot.kunci, cariPakai.set.warna);
      badgeSlot.title = slot.nama;

      const n = document.createElement("div");
      n.className = "slot-art-nama";
      n.textContent = cariPakai.set.nama;
      kotak.appendChild(n);

      const meta = document.createElement("div");
      meta.className = "slot-art-meta";

      const l = document.createElement("div");
      l.className = "slot-art-lv";
      l.style.color = artefakBintangDef(cariPakai.id).warna;
      l.textContent = "LV" + artefakLevel(cariPakai.id) + "/" + artefakCapLevel(cariPakai.id);
      meta.appendChild(l);

      const bintang = document.createElement("div");
      bintang.className = "slot-art-bintang";
      bintang.innerHTML = ikonBintangArtfak(artefakBintang(cariPakai.id), artefakBintangDef(cariPakai.id).warna);
      meta.appendChild(bintang);
      kotak.appendChild(meta);
      kotak.appendChild(badgeSlot);
    } else {
      kotak.classList.add("kosong");
      const lambang = document.createElement("div");
      lambang.className = "slot-art-lambang kosong";
      lambang.innerHTML = ikonSlotArtefak(slot.kunci, "#3a3f52");
      kotak.appendChild(lambang);
      const t = document.createElement("div");
      t.className = "slot-art-lv";
      t.textContent = "KOSONG";
      kotak.appendChild(t);
      
      // Add subtle sparkle effect saat hover pada slot kosong
      kotak.addEventListener("mouseenter", function() {
        spawnSlotSparkles(kotak, 2);
      });
    }
    kolom.appendChild(kotak);

    if (cariPakai) {
      const btnLepas = document.createElement("button");
      btnLepas.className = "slot-artefak-lepas";
      btnLepas.type = "button";
      btnLepas.textContent = "X";
      btnLepas.title = "Lepas artefak dari " + slot.nama;
      btnLepas.onclick = (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        pasangArtefak(kar.kunci, slot.kunci, null);
        if (typeof sfxKlik === "function") sfxKlik();
        buatPilihanUpgrade();
      };
      kolom.appendChild(btnLepas);
    }

    grid.appendChild(kolom);
  }

  // Kalau 4 slot terisi SET yang sama: energi 4 pojok menyatu ke logo set di
  // tengah, dan efeknya ikut element setnya (es/bara/angin/gemuruh).
  const aktif = typeof setArtefakAktif === "function" ? setArtefakAktif(kar.kunci) : [];
  for (let i = 0; i < aktif.length; i++) {
    if (!aktif[i].tier4 || !aktif[i].set) continue;
    const set = aktif[i].set;
    const elemen = ARTEFAK_EL_EFEK[set.kunci] ? set.kunci : "es";
    grid.style.setProperty("--warna-set", set.warna);

    const partikel = document.createElement("div");
    partikel.className = "el-partikel el-" + elemen;
    partikel.innerHTML = butirSetElemen(elemen);
    grid.appendChild(partikel);

    const pusat = document.createElement("div");
    pusat.className = "arti-set-pusat nyala el-" + elemen;
    const aura = document.createElement("div");
    aura.className = "el-aura";
    pusat.appendChild(aura);
    const lambang = document.createElement("div");
    lambang.className = "arti-set-lambang";
    lambang.innerHTML = '<div class="arti-set-ring"></div>'
      + '<svg class="el-ornamen" viewBox="0 0 100 100">' + ornamenSetElemen(elemen) + "</svg>"
      + ikonSetArtefak(set);
    pusat.appendChild(lambang);
    const nama = document.createElement("div");
    nama.className = "arti-set-nama";
    nama.textContent = set.nama;
    pusat.appendChild(nama);
    const ket = document.createElement("div");
    ket.className = "arti-set-ket";
    ket.textContent = "2/4 - 4/4 SET AKTIF";
    pusat.appendChild(ket);
    grid.appendChild(pusat);

    gambarAlirArtefak(grid, lambang, kotakSlot, elemen);
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => alirCekUlang(grid));
    }
    break;
  }
}

// ============ MODAL PEMILIH ARTEFAK ============

let pemilihKarakter = null;
let pemilihSlot = null;

function namaStatPendek(k) {
  if (k === "atributElement") return "ATRIBUT ELEMENT";
  return k === "kecepatan" ? "speed" : k;
}

function persen(v) {
  return Math.round(v * 1000) / 10 + "%";
}

function tutupPemilihArtefak() {
  const kotak = document.getElementById("kotakPemilihArtefak");
  if (kotak) kotak.classList.add("hidden");
  pemilihKarakter = null;
  pemilihSlot = null;
}

// Semua artefak milik slot tertentu, urut dari yang levelnya tertinggi
function artefakUntukSlot(slotKunci) {
  const hasil = [];
  for (let s = 0; s < ARTEFAK_SET.length; s++) {
    const set = ARTEFAK_SET[s];
    const id = artefakId(set.kunci, slotKunci);
    const lv = artefakLevel(id);
    if (lv > 0) hasil.push({ id: id, set: set, slot: slotKunci, lv: lv });
  }
  hasil.sort((a, b) => b.lv - a.lv);
  return hasil;
}

function bukaPemilihArtefak(kar, slot) {
  pemilihKarakter = kar;
  pemilihSlot = slot;
  gambarPemilihArtefak();
}

function gambarPemilihArtefak() {
  const kotak = document.getElementById("kotakPemilihArtefak");
  if (!kotak || !pemilihKarakter || !pemilihSlot) return;
  kotak.classList.remove("hidden");

  // tombol tutup + klik area gelap di luar kartu = tutup
  const tutup = document.getElementById("tutupPemilihArtefak");
  if (tutup) tutup.onclick = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    tutupPemilihArtefak();
  };
  kotak.onclick = (e) => {
    if (e && e.target === kotak) tutupPemilihArtefak();
  };

  const judul = document.getElementById("judulPemilihArtefak");
  if (judul) judul.textContent = "PILIH " + pemilihSlot.nama + "  -  " + pemilihKarakter.nama;

  const daftar = document.getElementById("daftarPemilihArtefak");
  if (!daftar) return;
  daftar.innerHTML = "";

  const pakai = typeof artefakPakai === "function" ? artefakPakai(pemilihKarakter.kunci) : {};
  const idPakai = pakai[pemilihSlot.kunci] || null;
  const items = artefakUntukSlot(pemilihSlot.kunci);

  if (!items.length) {
    const kosong = document.createElement("div");
    kosong.className = "artefak-kosong";
    kosong.textContent = "BELUM PUNYA ARTEFAK " + pemilihSlot.nama + ". Kalahkan bos dulu.";
    daftar.appendChild(kosong);
    return;
  }

  for (let i = 0; i < items.length; i++) {
    const kartu = buatKartuArtefak(items[i], items[i].id === idPakai);
    // Stagger animation: tiap kartu masuk dengan delay bertahap
    kartu.style.animationDelay = (i * 0.08) + "s";
    daftar.appendChild(kartu);
  }
}

// Kartu artefak di modal. Ringkas kalau tidak di-hover, melebar saat di-hover
// untuk menampilkan stat, substat, tombol upgrade, dan tombol pasang.
function buatKartuArtefak(artefak, dipakai) {
  const kartu = document.createElement("div");
  kartu.className = "kartu-artefak" + (dipakai ? " dipakai" : "");
  kartu.style.setProperty("--warna-set", artefak.set.warna);

  const kepala = document.createElement("div");
  kepala.className = "kartu-artefak-kepala";

  // logo set di kiri: ini yang bikin tiap set kelihatan beda efeknya
  const lambang = document.createElement("div");
  lambang.className = "kartu-artefak-lambang";
  lambang.innerHTML = ikonSetArtefak(artefak.set);
  kepala.appendChild(lambang);

  const nama = document.createElement("div");
  nama.className = "kartu-artefak-nama";
  nama.textContent = artefak.set.nama;
  kepala.appendChild(nama);

  const bintang = document.createElement("div");
  bintang.className = "kartu-artefak-bintang";
  bintang.innerHTML = ikonBintangArtfak(artefakBintang(artefak.id), artefakBintangDef(artefak.id).warna);
  kepala.appendChild(bintang);

  const lv = document.createElement("div");
  lv.className = "kartu-artefak-lv";
  lv.style.color = artefakBintangDef(artefak.id).warna;
  lv.textContent = "LV" + artefakLevel(artefak.id) + "/" + artefakCapLevel(artefak.id);
  kepala.appendChild(lv);

  // badge slot di kanan, biar 4 slot tidak tertukar
  const badge = document.createElement("div");
  badge.className = "kartu-artefak-badge";
  badge.innerHTML = ikonSlotArtefak(artefak.slot, artefak.set.warna);
  badge.title = (ARTEFAK_SLOT.find(function (s) { return s.kunci === artefak.slot; }) || {}).nama || artefak.slot;
  kepala.appendChild(badge);

  if (dipakai) {
    const tag = document.createElement("div");
    tag.className = "kartu-artefak-tag";
    tag.textContent = "TERPAKAI";
    kepala.appendChild(tag);
  }
  kartu.appendChild(kepala);

  // --- bagian yang muncul saat hover ---
  const rinci = document.createElement("div");
  rinci.className = "kartu-artefak-rinci";

  // stat utama piece: per slot (crown=hp, armor=damage) atau set untuk
  // slot fleksibel, dikali level dan pengali rarity.
  const lvSekarang = artefakLevel(artefak.id);
  const kaliRaritas = artefakBintangDef(artefak.id).kali;
  const st = typeof artefakStatUtama === "function"
    ? artefakStatUtama(artefak.set, artefak.slot)
    : (artefak.set.stat || {});
  const barisStat = document.createElement("div");
  barisStat.className = "kartu-artefak-baris stat";
  for (let i = 0; i < ARTEFAK_STAT_DAERAH.length; i++) {
    const k = ARTEFAK_STAT_DAERAH[i];
    if (!Number.isFinite(st[k]) || st[k] === 0) continue;
    barisStat.appendChild(buatStatArtefak(k, persen(st[k] * lvSekarang * kaliRaritas), artefak.set.warna));
  }
  if (!barisStat.children.length) barisStat.textContent = "-";
  rinci.appendChild(barisStat);

  // substat juga pakai ikon, biar efeknya kelihatan tanpa baca teks
  const subData = typeof artefakSubstat === "function" ? artefakSubstat(artefak.id) : null;
  const barisSub = document.createElement("div");
  barisSub.className = "kartu-artefak-baris sub";
  if (subData) {
    const labelSub = document.createElement("span");
    labelSub.className = "artefak-stat-tier-label";
    labelSub.textContent = "SUB";
    barisSub.appendChild(labelSub);
    for (const k in subData) {
      if (!Object.prototype.hasOwnProperty.call(subData, k)) continue;
      barisSub.appendChild(buatStatArtefak(k, persen(subData[k]), "#9fb0c8"));
    }
  } else {
    barisSub.textContent = "SUB  -";
  }
  rinci.appendChild(barisSub);

  // titik upgrade substat (pola Genshin): terisi jika level sudah memotong
  // threshold ARTEFAK_SUBSTAT_NAIK_PADA
  const titikRow = document.createElement("div");
  titikRow.className = "artefak-titik";
  const capTitik = artefakCapLevel(artefak.id);
  for (let t = 0; t < ARTEFAK_SUBSTAT_NAIK_PADA.length; t++) {
    const thr = ARTEFAK_SUBSTAT_NAIK_PADA[t];
    if (thr > capTitik) continue;
    const titik = document.createElement("span");
    if (lvSekarang >= thr) titik.className = "isi";
    titikRow.appendChild(titik);
  }
  rinci.appendChild(titikRow);

  // tombol upgrade
  const biaya = artefakBiayaNaik(artefak.id);
  const btnLv = document.createElement("button");
  btnLv.className = "kartu-artefak-btn";
  btnLv.type = "button";
  const maks = lvSekarang >= artefakCapLevel(artefak.id);
  btnLv.textContent = maks ? "LV MAKS" : "NAIK LV " + (lvSekarang + 1) + "  (" + biaya + ")";
  btnLv.disabled = maks || progres.koinSaldo < biaya;
  btnLv.onclick = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (artefakNaikLevel(artefak.id)) {
      if (typeof sfxKlik === "function") sfxKlik();
      buatPilihanUpgrade();
      gambarPemilihArtefak();
    }
  };
  rinci.appendChild(btnLv);

  // tombol pasang / lepas
  const btnPakai = document.createElement("button");
  btnPakai.className = "kartu-artefak-btn utama";
  btnPakai.type = "button";
  btnPakai.textContent = dipakai ? "LEPAS" : "PASANG";
  btnPakai.onclick = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    pasangArtefak(pemilihKarakter.kunci, pemilihSlot.kunci, dipakai ? null : artefak.id);
    if (typeof sfxKlik === "function") sfxKlik();
    buatPilihanUpgrade();
    tutupPemilihArtefak();
  };
  rinci.appendChild(btnPakai);

  kartu.appendChild(rinci);

  // klik kartu = pasang langsung, tidak wajib hover dulu
  kartu.onclick = () => {
    if (dipakai) return;
    pasangArtefak(pemilihKarakter.kunci, pemilihSlot.kunci, artefak.id);
    if (typeof sfxKlik === "function") sfxKlik();
    buatPilihanUpgrade();
    tutupPemilihArtefak();
  };

  return kartu;
}

// "hp +3%  damage +2%" dari substat yang diacak waktu artefak pertama drop
function teksSubstat(id) {
  if (typeof artefakSubstat !== "function") return "";
  const sub = artefakSubstat(id);
  if (!sub) return "";
  const label = { hp: "hp", damage: "damage", kecepatan: "kecepatan" };
  const bagian = [];
  for (const k in sub) {
    if (!Object.prototype.hasOwnProperty.call(sub, k)) continue;
    bagian.push((label[k] || k) + " +" + Math.round(sub[k] * 100) + "%");
  }
  return bagian.join("  ");
}
function gambarInfoSetArtefak(kar) {
  const el = document.getElementById("infoSetArtefak");
  if (!el) return;
  el.innerHTML = "";

  if (typeof artefakBaruTerakhir === "object" && artefakBaruTerakhir) {
    const drop = artefakBaruTerakhir;
    artefakBaruTerakhir = null;
    const cari = artefakCari(drop.id);
    const barisBaru = document.createElement("div");
    barisBaru.className = "set-aktif";
    const warnaBintang = cari ? artefakBintangDef(drop.id).warna : "#ffd23f";
    barisBaru.style.color = cari ? cari.set.warna : "#ffd23f";

    const pre = document.createElement("span");
    pre.textContent = drop.naikBintang ? "★ NAIK BINTANG " : (drop.baru ? "DAPAT " : "NAIK LV ");
    if (drop.naikBintang) pre.style.color = warnaBintang;
    barisBaru.appendChild(pre);

    const nm = document.createElement("span");
    nm.textContent = (cari ? cari.set.nama : drop.id) + " LV" + drop.lv + " ";
    barisBaru.appendChild(nm);

    const st = document.createElement("span");
    st.className = "set-aktif-stars";
    st.innerHTML = ikonBintangArtfak(drop.bintang || 3, warnaBintang);
    barisBaru.appendChild(st);
    el.appendChild(barisBaru);
  }

  // SET AKTIF (bisa lebih dari satu, mis. 2 set A + 2 set B)
  const aktif = typeof setArtefakAktif === "function" ? setArtefakAktif(kar.kunci) : [];
  if (aktif && aktif.length) {
    for (let i = 0; i < aktif.length; i++) {
      const a = aktif[i];
      const set = a.set;
      const judul = document.createElement("div");
      judul.className = "set-aktif";
      judul.style.color = set.warna;
      // lambang set di depan nama, jadi efek set langsung kelihatan
      const lmb = document.createElement("span");
      lmb.className = "set-aktif-lambang";
      lmb.innerHTML = ikonSetArtefak(set);
      judul.appendChild(lmb);
      const teksJudul = document.createElement("span");
      teksJudul.className = "set-aktif-teks";
      teksJudul.textContent = set.nama + " - " + a.jumlah + "/" + ARTEFAK_SLOT.length
        + (a.tier4 ? " SET LENGKAP" : " SET SEBAGIAN");
      judul.appendChild(teksJudul);
      el.appendChild(judul);

      // bonus aktif ditulis pakai ikon stat, bukan cuma teks
      const ket = document.createElement("div");
      ket.className = "set-aktif-bonus";
      const tampilBonus = function (tier, label) {
        const sumber = tier === 4 ? set.bonus4 : set.bonus2;
        const el2 = document.createElement("span");
        el2.className = "artefak-stat artefak-stat-tier";
        const t = document.createElement("span");
        t.className = "artefak-stat-tier-label";
        t.textContent = label;
        el2.appendChild(t);
        for (let i = 0; i < ARTEFAK_STAT_DAERAH.length; i++) {
          const k = ARTEFAK_STAT_DAERAH[i];
          if (!Number.isFinite(sumber[k]) || sumber[k] === 0) continue;
          el2.appendChild(buatStatArtefak(k, persen(sumber[k]), set.warna));
        }
        // atribut element = angka tetap (bukan persen), seperti Elemental Mastery
        if (Number.isFinite(sumber.atributElement) && sumber.atributElement !== 0) {
          el2.appendChild(buatStatArtefak("atributElement", Math.round(sumber.atributElement), set.warna));
        }
        return el2;
      };
      if (a.tier2) ket.appendChild(tampilBonus(2, "2"));
      if (a.tier4) ket.appendChild(tampilBonus(4, "4"));
      if (!ket.children.length) ket.textContent = set.teks2 || "";
      el.appendChild(ket);
    }
  }

  // kalau belum ada set aktif sama sekali, tampilkan progres set terdekat
  if (!aktif || !aktif.length) {
    let terbaik = null;
    for (let s = 0; s < ARTEFAK_SET.length; s++) {
      const setUji = ARTEFAK_SET[s];
      let isi = 0;
      for (let i = 0; i < ARTEFAK_SLOT.length; i++) {
        const id = artefakId(setUji.kunci, ARTEFAK_SLOT[i].kunci);
        if (artefakLevel(id) > 0) isi++;
      }
      if (!terbaik || isi > terbaik.isi) terbaik = { set: setUji, isi: isi };
    }
    if (!terbaik) return;

    const baris = document.createElement("div");
    const tampil = ARTEFAK_SLOT.map(function (sl) {
      const id = artefakId(terbaik.set.kunci, sl.kunci);
      return artefakLevel(id) > 0 ? "[" + sl.nama + "]" : "[" + sl.nama + " -]";
    }).join(" ");
    baris.textContent = "Progres " + terbaik.set.nama + " " + terbaik.isi + "/" + ARTEFAK_SLOT.length;
    baris.style.color = terbaik.set.warna;
    el.appendChild(baris);

    const detail = document.createElement("div");
    detail.className = "slot-artefak-nama";
    detail.textContent = tampil;
    el.appendChild(detail);
  }
}

let tabKarakter = "skill";

function gantiTabKarakter(tab) {
  tabKarakter = tab;
  const isi = { skill: "panelSkill", artefak: "panelArtefak", stat: "panelStat" };
  for (const kunci in isi) {
    const el = document.getElementById(isi[kunci]);
    if (el) el.classList.toggle("hidden", kunci !== tab);
  }
  const tombol = document.querySelectorAll(".tab-karakter-btn");
  for (let i = 0; i < tombol.length; i++) {
    tombol[i].classList.toggle("aktif", tombol[i].getAttribute("data-tab") === tab);
  }
}

function pasangTabKarakter() {
  const tombol = document.querySelectorAll(".tab-karakter-btn");
  for (let i = 0; i < tombol.length; i++) {
    tombol[i].onclick = () => {
      const tab = tombol[i].getAttribute("data-tab");
      if (tab === tabKarakter) return;
      if (typeof sfxKlik === "function") sfxKlik();
      gantiTabKarakter(tab);
    };
  }
}
function buatPilihanUpgrade() {
  const daftar = document.getElementById("daftarUpgrade");
  if (!daftar) return;
  daftar.innerHTML = "";
  segarkanSaldoKarakter();

  KARAKTER.forEach((kar) => {
    const card = document.createElement("button");
    card.className = "kartu-up karakter-up";
    if (kar.kunci === karakterUpgrade) card.classList.add("terpilih");

    const img = typeof tekstur !== "undefined" ? tekstur[kar.kunci] : null;
    const cv = document.createElement("canvas");
    cv.width = 56;
    cv.height = 56;
    const cx = cv.getContext("2d");
    if (img && img.width) {
      const s = 56 / Math.max(img.width, img.height);
      cx.imageSmoothingEnabled = s < 1;
      cx.drawImage(img, (56 - img.width * s) / 2, (56 - img.height * s) / 2, img.width * s, img.height * s);
    } else {
      cx.fillStyle = "#ff8844";
      cx.fillRect(7, 7, 42, 42);
    }
    card.appendChild(cv);

    const nama = document.createElement("div");
    nama.className = "nama-karakter";
    const lvl = typeof levelKarakter === "function" ? levelKarakter(kar.kunci) : 0;
    nama.textContent = kar.nama + " LV" + lvl;
    card.appendChild(nama);

    card.addEventListener("click", () => {
      karakterUpgrade = kar.kunci;
      if (typeof sfxKlik === "function") sfxKlik();
      buatPilihanUpgrade();
    });
    card.addEventListener("pointerenter", () => sfxKlik && sfxKlik());
    daftar.appendChild(card);
  });

  const kar = KARAKTER.find((k) => k.kunci === karakterUpgrade) || KARAKTER[0];
  if (!kar) return;

  const lv = typeof levelKarakter === "function" ? levelKarakter(kar.kunci) : 0;
  const bon = typeof bonusStatKarakter === "function" ? bonusStatKarakter(kar.kunci) : { hp: 1, damage: 1, kecepatan: 1, lv: 0 };
  const hp = Math.round(kar.hp * bon.hp);
  const dmg = Math.round(kar.damage * bon.damage);
  const spd = Math.round(kar.kecepatan * bon.kecepatan);
  const em = typeof atributElement === "function" ? Math.round(atributElement(kar.kunci)) : 0;
  const max = KARAKTER_LEVEL_MAX;
  const biaya = typeof biayaNaikLevelKarakter === "function" ? biayaNaikLevelKarakter(lv) : Infinity;
  const cukup = typeof progres === "object" && progres && progres.koinSaldo >= biaya;
  const penuh = lv >= max;

  const statEl = document.getElementById("statKarakterIsi");
  if (statEl) {
    const tipe = kar.tipe === "jarak" ? "JARAK JAUH" : "JARAK DEKAT";
    const stats = [
      { lbl: "ATTACK", nilai: dmg },
      { lbl: "HP", nilai: hp },
      { lbl: "SPEED", nilai: spd },
      { lbl: "CRIT RATE", nilai: "5%" },
      { lbl: "CRIT DMG", nilai: "150%" },
      { lbl: "TYPE", nilai: tipe, ikon: ikonTipeSVG(kar) },
      { lbl: "ATRIBUT ELEMENT", nilai: em, ikon: ikonElemenSVG(kar.element) }
    ];
    statEl.innerHTML = "";
    stats.forEach((s) => {
      const baris = document.createElement("div");
      baris.className = "stat-baris";
      const lbl = document.createElement("span");
      lbl.className = "stat-lbl";
      lbl.textContent = s.lbl;
      const val = document.createElement("span");
      val.className = "stat-val";
      if (s.ikon) {
        const wadah = document.createElement("span");
        wadah.className = "stat-val-ikon";
        wadah.appendChild(document.createTextNode(s.nilai + " "));
        wadah.innerHTML += s.ikon;
        val.appendChild(wadah);
      } else {
        val.textContent = s.nilai;
      }
      baris.appendChild(lbl);
      baris.appendChild(val);
      statEl.appendChild(baris);
    });
  }

  const skillEl = document.getElementById("daftarSkill");
  if (skillEl) {
    skillEl.innerHTML = "";

    const jarak = kar.tipe === "jarak";
    const aksen = kar.warnaDash || (jarak ? "#7dd3fc" : "#ff4d4d");
    const svg = (isi) =>
      '<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke-linecap="round" stroke-linejoin="round">' + isi + '</svg>';

    const ikonSkill = jarak ? [

      svg('<path d="M5 19L16 8" stroke="' + aksen + '" stroke-width="2.2"/>' +
        '<path d="M13 5l6 6" stroke="' + aksen + '" stroke-width="2.2"/>' +
        '<path d="M15 5h4v4" stroke="' + aksen + '" stroke-width="2.2"/>' +
        '<path d="M5 19l1.5-3.5L10 17z" fill="' + aksen + '"/>'),

      svg('<path d="M3 16a9 9 0 0 1 18 0" stroke="#b3e5fc" stroke-width="2.4"/>' +
        '<path d="M6 16a6 6 0 0 1 12 0" stroke="' + aksen + '" stroke-width="1.8"/>' +
        '<path d="M9 16a3 3 0 0 1 6 0" stroke="#e1f5fe" stroke-width="1.4"/>' +
        '<path d="M8 18v2.5M12 18.5v2.5M16 18v2.5" stroke="#b3e5fc" stroke-width="1.4"/>'),
      svg('<path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z" stroke="' + aksen + '" stroke-width="1.8"/>'),
      svg('<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" stroke="' + aksen + '" stroke-width="1.8"/>'),
      svg('<path d="M13 2L5 14h6l-1 8 8-12h-6z" stroke="' + aksen + '" stroke-width="1.8"/>')
    ] : [

      svg('<path d="M4 18C8 14 14 8 20 4" stroke="' + aksen + '" stroke-width="2.4"/>' +
        '<path d="M4 18l.5-3M4 18l3-.5" stroke="' + aksen + '" stroke-width="1.6"/>'),

      svg('<path d="M3 17a9 9 0 0 1 18 0" stroke="#ff3d00" stroke-width="2.6"/>' +
        '<path d="M6 17a6 6 0 0 1 12 0" stroke="#ff9100" stroke-width="1.8"/>' +
        '<path d="M9 17a3 3 0 0 1 6 0" stroke="#ffee58" stroke-width="1.4"/>'),
      svg('<path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z" stroke="' + aksen + '" stroke-width="1.8"/>'),
      svg('<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" stroke="' + aksen + '" stroke-width="1.8"/>'),
      svg('<path d="M13 2L5 14h6l-1 8 8-12h-6z" stroke="' + aksen + '" stroke-width="1.8"/>')
    ];

    const ikonTerkunci = svg('<rect x="5" y="10" width="14" height="10" rx="2" stroke="#8a93a5" stroke-width="1.8"/>' +
      '<path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="#8a93a5" stroke-width="1.8"/>' +
      '<circle cx="12" cy="15" r="1.4" fill="#8a93a5"/>');
    const lv = levelKarakter(kar.kunci);
    const dipakai = skillPakai(kar.kunci);
    const daftar = daftarSkill(kar.kunci);

    daftar.forEach((s, i) => {
      const terbuka = lv >= s.level;
      const terpakai = s.slot === dipakai;
      const baris = document.createElement("div");
      baris.className = "kartu-note";
      if (!terbuka) baris.classList.add("skill-terkunci");
      else if (terpakai) {
        baris.classList.add("skill-dipakai");
        baris.style.background = aksen + "1f";
        baris.style.boxShadow = "inset 0 0 0 2px " + aksen + "55";
      } else if (s.bisaPakai) baris.classList.add("skill-bisa-pakai");

      const bulat = document.createElement("div");
      bulat.className = "kartu-note-bulat";
      bulat.style.background = terbuka ? aksen + "2b" : "rgba(138,147,165,0.15)";
      bulat.innerHTML = terbuka ? (ikonSkill[i] || ikonTerkunci) : ikonTerkunci;

      const teks = document.createElement("span");
      teks.className = "nama-karakter";
      teks.textContent = !terbuka ? s.nama + "  ·  BUKA LV " + s.level
        : terpakai ? s.nama + "  ·  DIPAKAI" : s.nama;

      baris.appendChild(bulat);
      baris.appendChild(teks);
      skillEl.appendChild(baris);

      if (terbuka && s.bisaPakai && !terpakai) {
        baris.onclick = () => {
          if (pasangSkill(kar.kunci, s.slot)) {
            if (typeof sfxKlik === "function") sfxKlik();
            buatPilihanUpgrade();
          }
        };
      }
    });
  }

  gambarArtefakKarakter(kar);
  gambarInfoSetArtefak(kar);


const btn = document.getElementById("tombolNaikLevel");
if (btn) {
    if (penuh) {
      btn.textContent = "LEVEL MAKS";
      btn.disabled = true;
    } else {
      btn.textContent = "NAIK LEVEL - " + biaya + " KOIN";
      btn.disabled = !cukup;
    }

    btn.classList.toggle("tombol-hijau", cukup && !penuh);
    btn.classList.toggle("tombol-abu", !cukup || penuh);
    btn.classList.toggle("terkunci", !cukup && !penuh);
    btn.onclick = () => {
      if (typeof naikkanLevelKarakter === "function" && naikkanLevelKarakter(kar.kunci)) {
        if (typeof sfxKlik === "function") sfxKlik();
        buatPilihanUpgrade();
      } else if (typeof sfxKlik === "function") sfxKlik();
    };
  }
  const lvlTampil = document.getElementById("levelKarakterTampil");
  if (lvlTampil) lvlTampil.textContent = "LV " + lv + "/" + max;
}

function tampilkanLevel() {
  sembunyiSemua();
  statusGame = "level";
  layarLevel.classList.remove("hidden");
  buatPilihanLevel();
  aturTombolPause();
  if (typeof setMusik === "function") setMusik("lobby");
}

function tampilkanPilih() {
  sembunyiSemua();
  statusGame = "select";

  sinkronSfxTerjeda();
  layarPilih.classList.remove("hidden");
  buatPilihanKarakter();
  aturTombolPause();
  if (typeof setMusik === "function") setMusik("lobby");
}

function tampilkanGameOver() {
  sembunyiSemua();
  statusGame = "over";
  judulAkhirEl.textContent = "GAME OVER";
  koinAkhirEl.textContent = "KOIN: " + koin;
  if (typeof catatKoinTertinggi === "function") catatKoinTertinggi(koin);
  if (typeof tambahKoinSaldo === "function") tambahKoinSaldo(koin);
  layarGameOver.classList.remove("hidden");
  if (typeof setSfxTerjeda === "function") setSfxTerjeda(false);
  if (typeof setMusik === "function") setMusik(null);
  if (typeof sfxGameOver === "function") sfxGameOver();
  aturTombolPause();
  if (typeof _jedaMusikLobby === "function") _jedaMusikLobby("gameover");
}

function tampilkanMenang() {
  sembunyiSemua();
  statusGame = "menang";
  koinMenangEl.textContent = "KOIN: " + koin;

  if (typeof tandaiLevelSelesai === "function") tandaiLevelSelesai(levelPilihan, koin);
  if (typeof tambahKoinSaldo === "function") tambahKoinSaldo(koin);
  const teksBaru = document.getElementById("teksLevelBaru");
  const tombolNext = document.getElementById("tombolLevelBerikut");
  const nextIdx = levelPilihan + 1;
  const adaLevelBaru = DAFTAR_LEVEL[nextIdx]
    && (typeof apakahLevelTerbuka !== "function" || apakahLevelTerbuka(nextIdx));
  if (teksBaru) {
    teksBaru.textContent = adaLevelBaru
      ? ("LEVEL BARU TERBUKA: " + (DAFTAR_LEVEL[nextIdx].nama || ("Level " + (nextIdx + 1))))
      : "";
  }

  if (tombolNext) tombolNext.classList.toggle("hidden", !adaLevelBaru);
  layarMenang.classList.remove("hidden");
  if (typeof mulaiKonfeti === "function") mulaiKonfeti(90, 3.5);
  aturTombolPause();
  if (typeof _jedaMusikLobby === "function") _jedaMusikLobby("menang");
}

function segarkanUISuara() {
  const set = (slId, nilId, v) => {
    const sl = document.getElementById(slId);
    if (sl) sl.value = Math.round(v * 100);
    const n = document.getElementById(nilId);
    if (n) n.textContent = Math.round(v * 100);
  };
  set("slUmum", "nilUmum", typeof _volUmum === "number" ? _volUmum : 0.9);
  set("slSfx", "nilSfx", typeof _volSfx === "number" ? _volSfx : 1);
  set("slMusik", "nilMusik", typeof _volMusik === "number" ? _volMusik : 1);
}

function tampilkanPause() {
  if (statusGame !== "main" || animMati) return;
  statusGame = "pause";
  sinkronSfxTerjeda();
  segarkanUISuara();
  layarPause.classList.remove("hidden");
  aturTombolPause();
}

function lanjutDariPause() {
  if (statusGame !== "pause") return;
  statusGame = "main";
  sinkronSfxTerjeda();
  layarPause.classList.add("hidden");
  aturTombolPause();
}

function mulaiGameBaru() {
  sfxResume();
  resetArena({ koinBaru: true });
  statusGame = "main";
  sinkronSfxTerjeda();
  sembunyiSemua();
  aturTombolPause();
  if (typeof pasangIkonSentuh === "function") pasangIkonSentuh();
  if (typeof setMusik === "function") setMusik("game");
}

function ulangDenganKarakter() {
  resetArena({ koinBaru: true });
  statusGame = "main";
  sinkronSfxTerjeda();
  sembunyiSemua();
  aturTombolPause();
  if (typeof pasangIkonSentuh === "function") pasangIkonSentuh();
  if (typeof setMusik === "function") setMusik("game");
}

let tombolTerpasang = false;

function pasangTombol() {
  if (tombolTerpasang) return;
  tombolTerpasang = true;
  document.getElementById("tombolPlay").addEventListener("click", tampilkanLevel);
  document.getElementById("tombolKarakter").addEventListener("click", tampilkanKarakter);
  document.getElementById("tombolKembaliKarakter").addEventListener("click", tampilkanJudul);
  pasangTabKarakter();
  document.getElementById("tombolKembaliJudul").addEventListener("click", tampilkanJudul);
  document.getElementById("tombolUlang").addEventListener("click", ulangDenganKarakter);

  document.getElementById("tombolMenu").addEventListener("click", tampilkanPilih);
  tombolPause.addEventListener("click", tampilkanPause);
  document.getElementById("tombolLanjut").addEventListener("click", lanjutDariPause);
  document.getElementById("tombolMenuPause").addEventListener("click", tampilkanPilih);
  document.getElementById("tombolJudulPause").addEventListener("click", tampilkanJudul);
  document.getElementById("tombolJudul").addEventListener("click", tampilkanJudul);
  document.getElementById("tombolLevelBerikut").addEventListener("click", () => {
    const nextIdx = levelPilihan + 1;
    if (!DAFTAR_LEVEL[nextIdx]) return;
    levelPilihan = nextIdx;
    tampilkanPilih();
  });
  document.getElementById("tombolUlangMenang").addEventListener("click", tampilkanLevel);
  document.getElementById("tombolMenuMenang").addEventListener("click", tampilkanJudul);

  document.querySelectorAll(".tombol-play, .tombol-hijau, .tombol-abu, .tombol-pause")
    .forEach((el) => el.addEventListener("click", sfxKlik));

  daftarKarakter.addEventListener("click", sfxKlik);

  const pasangSlider = (slId, nilId, fn) => {
    const sl = document.getElementById(slId);
    if (!sl) return;
    sl.addEventListener("input", () => {
      fn(sl.value / 100);
      const n = document.getElementById(nilId);
      if (n) n.textContent = sl.value;
    });
  };
  if (typeof aturVolumeUmum === "function") {
    pasangSlider("slUmum", "nilUmum", aturVolumeUmum);
    pasangSlider("slSfx", "nilSfx", aturVolumeSfx);
    pasangSlider("slMusik", "nilMusik", aturVolumeMusik);
  }
}

function buatPilihanKarakter() {
  daftarKarakter.innerHTML = "";

  KARAKTER.forEach((kar, idx) => {
    const img = tekstur[kar.kunci];
    const card = document.createElement("button");
    card.className = "kartu-karakter";

    const cv = document.createElement("canvas");
    cv.width = 56;
    cv.height = 56;
    const c = cv.getContext("2d");
    if (img && img.width) {
      const s = 56 / Math.max(img.width, img.height);
      const w = img.width * s;
      const h = img.height * s;

      c.imageSmoothingEnabled = s < 1;
      c.drawImage(img, (56 - w) / 2, (56 - h) / 2, w, h);
    } else {
      c.fillStyle = "#ff8844";
      c.fillRect(7, 7, 42, 42);
    }
    card.appendChild(cv);

    const nama = document.createElement("div");
    nama.className = "nama-karakter";
    nama.textContent = (idx + 1) + ". " + kar.nama;
    card.appendChild(nama);

    card.addEventListener("click", () => {
      karakter = kar;
      mulaiGameBaru();
    });

    card.addEventListener("pointerenter", () => tampilInfoKarakter(kar));
    card.addEventListener("pointerleave", sembunyiInfoKarakter);

    daftarKarakter.appendChild(card);
  });

  daftarKarakter.addEventListener("pointerleave", sembunyiInfoKarakter);
}

function buatPilihanLevel() {
  const daftar = document.getElementById("daftarLevel");
  if (!daftar) return;
  daftar.innerHTML = "";

  DAFTAR_LEVEL.forEach((lvl, idx) => {
    const card = document.createElement("button");
    card.className = "kartu-level";
    card.style.setProperty("--warna-level", lvl.warna || "#4ade80");

    const terbuka = typeof apakahLevelTerbuka === "function"
      ? apakahLevelTerbuka(idx)
      : idx === 0;
    if (!terbuka) card.classList.add("terkunci");

    const nama = document.createElement("div");
    nama.className = "judul-level";
    nama.textContent = terbuka
      ? (lvl.nama || ("Level " + (idx + 1)))
      : "???";
    if (!terbuka) nama.textContent += " ??";

    const tempat = document.createElement("div");
    tempat.className = "nama-level";
    tempat.textContent = terbuka ? (lvl.judul || "") : "Tamatkan level sebelumnya";

    card.appendChild(nama);
    card.appendChild(tempat);

    card.addEventListener("click", () => {
      if (!terbuka) {
        if (typeof sfxKlik === "function") sfxKlik();
        return;
      }
      levelPilihan = idx;
      tampilkanPilih();
    });
    card.addEventListener("pointerenter", () => sfxKlik && sfxKlik());
    daftar.appendChild(card);
  });
}

function tampilInfoKarakter(kar) {
  const info = document.getElementById("infoKarakter");
  if (!info) return;
  info.innerHTML = "";
  const emAngka = typeof atributElement === "function"
    ? Math.round(atributElement(kar.kunci))
    : (kar.atributElement || 0);
  const parts = [
    { lbl: "HP", nilai: kar.hp },

    { lbl: "TIPE", ikon: ikonTipeSVG(kar) },
    { lbl: "ATRIBUT ELEMENT", nilai: emAngka }
  ];

  parts.forEach((p) => {
    const baris = document.createElement("div");
    baris.className = "info-baris";
    const lbl = document.createElement("span");
    lbl.className = "info-lbl";
    lbl.textContent = p.lbl + ": ";
    const val = document.createElement("span");
    val.className = "info-val";
    if (p.ikon) {
      val.innerHTML = p.ikon;
    } else {
      val.textContent = p.nilai;
    }
    baris.appendChild(lbl);
    baris.appendChild(val);
    info.appendChild(baris);
  });
  info.classList.remove("hidden");
}

function sembunyiInfoKarakter() {
  const info = document.getElementById("infoKarakter");
  if (info) info.classList.add("hidden");
}
