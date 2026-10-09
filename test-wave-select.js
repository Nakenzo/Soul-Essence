/* ============================================================
   WAVE SELECT - ALAT ADMIN
   ------------------------------------------------------------
   Hanya dimuat saat akun admin login (lihat admin-akun.js) dan
   hanya bertindak kalau window.ADMIN_BUKA true. Tidak mengubah
   aturan game: HP, damage, dan komposisi musuh tetap persis
   seperti LEVELS. Tool ini hanya memindah wave mana yang sedang
   dimainkan, biar tidak harus main dari awal.
   ============================================================ */

const _wavePanel = { el: null, buka: false };

function _waveBersih() {
  if (typeof bosKematian !== "undefined") bosKematian = null;
  bossIntro = null;
  enemies = [];
  enemyShots = [];
  hazards = [];
  bullets = [];
  particles = [];
  rings = [];
  slashes = [];
  fires = [];
  freezes = [];
  damages = [];
  souls = [];
  flashes = [];
  hurtVig = 0;
  deathPixels = [];
  pilihanKartu = null;
  levelBanner = null;
}

// Lompat ke wave tertentu (0-based). Aturan game tidak diubah.
function lompatWave(target) {
  if (!(target >= 0 && target < LEVELS.length)) return;
  _waveBersih();
  level = target;
  levelSpawn = 0;
  spawnTimer = 0.4;
  statusGame = "main";
  layarMenang.classList.add("hidden");
  layarGameOver.classList.add("hidden");
  tampilkanBannerLevel(level);
  _wavePanelSegarkan();
}

function _waveRingkasan(lv) {
  const w = LEVELS[lv];
  if (!w) return "";
  if (w.bos) return "BOSS: " + w.bos;
  const t = Object.keys(w.campur || {})
    .sort((a, b) => w.campur[b] - w.campur[a])
    .map((k) => k + " " + Math.round(w.campur[k] * 100) + "%")
    .join("  ");
  return w.jumlah + "x  hp " + w.hp + "  " + t;
}

function _wavePanelSegarkan() {
  if (!_wavePanel.el) return;
  const lv = _wavePanel.el.querySelector(".ws-sekarang");
  if (lv) lv.textContent = "WAVE " + (level + 1) + " / " + LEVELS.length;
}

function _wavePanelBikin() {
  if (_wavePanel.el) return;
  const el = document.createElement("div");
  el.id = "waveSelectPanel";
  el.style.cssText = [
    "position:fixed", "inset:0", "z-index:99999",
    "background:rgba(0,0,0,0.82)", "color:#e8f5e9",
    "font:14px/1.5 system-ui,sans-serif",
    "display:flex", "flex-direction:column", "padding:16px", "gap:10px"
  ].join(";");

  const kepala = document.createElement("div");
  kepala.style.cssText = "display:flex;align-items:center;gap:12px;flex-wrap:wrap";
  kepala.innerHTML =
    '<b style="font-size:18px">WAVE SELECT (admin)</b>' +
    '<span class="ws-sekarang" style="color:#ffd23f;font-weight:700"></span>' +
    '<span style="opacity:.7">Aturan game tidak berubah</span>';
  const tutup = document.createElement("button");
  tutup.textContent = "Tutup (F9)";
  tutup.style.cssText = "margin-left:auto;padding:6px 14px;cursor:pointer";
  tutup.onclick = _wavePanelTutup;
  kepala.appendChild(tutup);
  el.appendChild(kepala);

  const daftar = document.createElement("div");
  daftar.style.cssText =
    "overflow:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:6px;flex:1;align-content:start";
  daftar.id = "waveSelectDaftar";

  for (const l of DAFTAR_LEVEL) {
    const judul = document.createElement("div");
    judul.style.cssText =
      "grid-column:1/-1;margin-top:8px;padding:4px 8px;border-radius:6px;" +
      "background:" + l.warna + "22;border-left:4px solid " + l.warna +
      ";font-weight:700;letter-spacing:.5px";
    judul.textContent = l.nama.toUpperCase() + " - " + l.judul;
    daftar.appendChild(judul);

    for (let i = l.mulaiWave; i < l.selesaiWave; i++) {
      const w = LEVELS[i];
      if (!w) continue;
      const b = document.createElement("button");
      b.dataset.wave = String(i);
      b.style.cssText = [
        "text-align:left", "padding:7px 9px", "border-radius:8px", "cursor:pointer",
        "border:1px solid #ffffff22", "background:#ffffff0d", "color:inherit",
        "font:inherit", "display:flex", "flex-direction:column", "gap:2px"
      ].join(";");
      b.innerHTML =
        '<span style="font-weight:700">WAVE ' + (i + 1) + (w.bos ? ' <span style="color:#ff6b6b">* BOSS</span>' : "") + "</span>" +
        '<span style="font-size:11px;opacity:.75">' + _waveRingkasan(i) + "</span>";
      b.onclick = () => lompatWave(i);
      daftar.appendChild(b);
    }
  }
  el.appendChild(daftar);
  document.body.appendChild(el);
  _wavePanel.el = el;
  _wavePanelSegarkan();
}

function _wavePanelBuka() {
  _wavePanelBikin();
  _wavePanel.el.style.display = "flex";
  _wavePanel.buka = true;
  _wavePanelSegarkan();
}

function _wavePanelTutup() {
  if (_wavePanel.el) _wavePanel.el.style.display = "none";
  _wavePanel.buka = false;
}

function _wavePanelToggle() {
  if (_wavePanel.buka) _wavePanelTutup();
  else _wavePanelBuka();
}

// F9 = buka/tutup panel.
window.addEventListener("keydown", (e) => {
  if (e.key === "F9") {
    if (!window.ADMIN_BUKA) return; // hanya saat akun admin login
    e.preventDefault();
    _wavePanelToggle();
  }
});

// Kalau halaman memang admin.html, panel langsung terbuka.
if (/\/admin\.html$/.test(location.pathname)) {
  const buka = () => _wavePanelBuka();
  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", buka);
  } else {
    buka();
  }
}

console.log("[wave-select] siap. Tekan F9 untuk buka panel lompat wave.");
