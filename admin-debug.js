// =============================================================================
// DEBUG: PEMILIH KARTU BEBAS (khusus admin)
// -----------------------------------------------------------------------------
// Panel berisi SEMUA kartu upgrade. Klik = langsung diberikan ke player saat
// ini (tanpa menunggu pilih 3 kartu, tanpa batas tier), supaya build apa pun
// bisa diuji cepat. Hanya aktif saat ADMIN_BUKA true (akun admin login).
// =============================================================================
(function () {
  "use strict";
  if (typeof window === "undefined") return;

  var panel = null, kotak = null, catatan = null;

  function siap() {
    return !!window.ADMIN_BUKA
      && typeof KARTU_UPGRADE !== "undefined"
      && typeof TIER_DEF !== "undefined"
      && typeof CAP_KARTU !== "undefined";
  }

  function kartuMaks(k) {
    var t = TIER_DEF[k.tier || "common"] || TIER_DEF.common;
    return t.maks;
  }

  function beriKartu(k) {
    if (typeof player === "undefined" || !player) { tulis("Mulai game dulu"); return; }
    if (!player.kartu) player.kartu = {};
    var id = k.id;
    player.kartu[id] = (player.kartu[id] || 0) + 1;
    if (k.additif) {
      for (var a in k.mult) {
        var nx = player.mult[a] + k.mult[a];
        player.mult[a] = CAP_KARTU[a] !== undefined ? Math.min(CAP_KARTU[a], nx) : nx;
      }
    } else {
      for (var b in k.mult) {
        var cur = player.mult[b] + k.mult[b] - 1;
        player.mult[b] = CAP_KARTU[b] !== undefined
          ? ((b === "atk" || b === "special") ? Math.max(CAP_KARTU[b], cur) : Math.min(CAP_KARTU[b], cur))
          : cur;
      }
    }
    if (typeof hitungStatKartu === "function") hitungStatKartu();
    if (k.mult && k.mult.hpA) player.hp = Math.min(player.maxHp, player.hp + k.mult.hpA);
    if (typeof spawnParticles === "function") spawnParticles(player.x, player.y - 40, k.warna, 18);
    if (typeof sfxKlik === "function") sfxKlik();
    if (typeof perbaruiNotaKartu === "function") perbaruiNotaKartu();
    tulis("+" + k.nama + "  (" + player.kartu[id] + "x)");
    segarkan();
  }

  function tulis(pesan) { if (catatan) catatan.textContent = pesan || ""; }

  function segarkan() {
    if (!kotak) return;
    kotak.innerHTML = "";
    for (var i = 0; i < KARTU_UPGRADE.length; i++) kotak.appendChild(tombolKartu(KARTU_UPGRADE[i]));
  }

  function tombolKartu(k) {
    var b = document.createElement("button");
    b.type = "button";
    var punya = (typeof player !== "undefined" && player && player.kartu && player.kartu[k.id]) || 0;
    var maks = kartuMaks(k);
    b.style.cssText = [
      "text-align:left", "padding:8px 10px", "border-radius:8px", "cursor:pointer",
      "border:1px solid " + k.warna + "88", "background:" + k.warna + "22",
      "color:#e8f5e9", "font:13px/1.3 system-ui,sans-serif", "display:flex",
      "flex-direction:column", "gap:2px"
    ].join(";");
    b.innerHTML =
      '<span style="font-weight:700;color:' + k.warna + '">' + (k.ikon || "") + " " + k.nama +
      ' <span style="opacity:.7;font-weight:400">(' + punya + "/" + maks + ")</span></span>" +
      '<span style="font-size:11px;opacity:.8">' + (k.ket || "") + "</span>";
    b.onclick = function () { beriKartu(k); };
    return b;
  }

  function buka() {
    if (!siap()) return;
    if (panel) { panel.style.display = "flex"; segarkan(); return; }
    panel = document.createElement("div");
    panel.id = "panelDebugKartu";
    panel.style.cssText = [
      "position:fixed", "inset:0", "z-index:99997", "background:rgba(0,0,0,0.82)",
      "color:#e8f5e9", "font:14px/1.4 system-ui,sans-serif", "display:flex",
      "flex-direction:column", "padding:16px", "gap:10px"
    ].join(";");

    var kepala = document.createElement("div");
    kepala.style.cssText = "display:flex;align-items:center;gap:12px;flex-wrap:wrap";
    kepala.innerHTML =
      '<b style="font-size:18px;color:#fbbf24">PEMILIH KARTU BEBAS</b>' +
      '<span style="opacity:.75">Klik kartu = langsung diberikan (bebas pilih berapa pun)</span>';
    var tutup = document.createElement("button");
    tutup.type = "button";
    tutup.textContent = "TUTUP";
    tutup.style.cssText = "margin-left:auto;padding:6px 14px;cursor:pointer";
    tutup.onclick = tutupPanel;
    kepala.appendChild(tutup);
    panel.appendChild(kepala);

    kotak = document.createElement("div");
    kotak.id = "panelDebugKartuDaftar";
    kotak.style.cssText =
      "overflow:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));" +
      "gap:8px;flex:1;align-content:start";
    panel.appendChild(kotak);

    catatan = document.createElement("div");
    catatan.style.cssText = "font-size:12px;color:#8a93a5;min-height:16px";
    panel.appendChild(catatan);

    document.body.appendChild(panel);
    segarkan();
  }

  function tutupPanel() { if (panel) panel.style.display = "none"; }

  function pasangBar() {
    if (!window.ADMIN_BUKA || document.getElementById("barDebugKartu")) return;
    var bar = document.createElement("div");
    bar.id = "barDebugKartu";
    bar.style.cssText = "position:fixed;right:8px;bottom:8px;z-index:99998;display:flex;gap:6px";
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = "KARTU BEBAS";
    b.style.cssText =
      "padding:6px 12px;cursor:pointer;border-radius:8px;border:1px solid #fbbf24;" +
      "background:rgba(6,8,16,0.92);color:#fbbf24;font:600 12px system-ui,sans-serif;";
    b.onclick = buka;
    bar.appendChild(b);
    document.body.appendChild(bar);
  }

  function lepasBar() {
    var bar = document.getElementById("barDebugKartu");
    if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
    if (panel) tutupPanel();
  }

  function jaga() {
    if (window.ADMIN_BUKA) pasangBar();
    else lepasBar();
    setTimeout(jaga, 1200);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", jaga);
  else jaga();
})();
