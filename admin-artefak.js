// PANEL DEBUG ARTEFAK - hanya untuk admin.html (file ini di-ignore git).
// Dipakai buat tes cepat tanpa harus mengalahkan bos berulang-ulang.
(function () {
  "use strict";

  function siap() {
    if (typeof ARTEFAK_SET === "undefined" || typeof artefakId !== "function") {
      setTimeout(siap, 100);
      return;
    }
    if (!document.getElementById("panelDebugArtefak")) buatPanel();
  }

  function segarkanTampilan() {
    hitungDimiliki();
    if (typeof buatPilihanUpgrade === "function") {
      try { buatPilihanUpgrade(); } catch (e) { }
    }
    if (typeof sfxKlik === "function") { try { sfxKlik(); } catch (e) { } }
  }

  function stabilkan() {
    if (!progres.artefakMilik) progres.artefakMilik = {};
    if (!progres.artefakBintang) progres.artefakBintang = {};
    if (!progres.artefakSubstat) progres.artefakSubstat = {};
    if (!progres.artefakPakai) progres.artefakPakai = {};
  }

  function beriSemua(level) {
    stabilkan();
    const lv = Math.max(1, Math.min(level, ARTEFAK_LEVEL_MAX));
    let jumlah = 0;
    for (let s = 0; s < ARTEFAK_SET.length; s++) {
      for (let i = 0; i < ARTEFAK_SLOT.length; i++) {
        const id = artefakId(ARTEFAK_SET[s].kunci, ARTEFAK_SLOT[i].kunci);
        progres.artefakMilik[id] = lv;
        if (!progres.artefakBintang[id]) progres.artefakBintang[id] = 5;
        if (!progres.artefakSubstat[id]) progres.artefakSubstat[id] = acakSubstat(5);
        jumlah++;
      }
    }
    saveTulis();
    catat(`BERI ${jumlah} artefak LV${lv} 5★`);
    segarkanTampilan();
  }

  function pasangOtomatis() {
    stabilkan();
    // pasang set pertama penuh di semua slot, biar tier 4 langsung kepakai
    const set = ARTEFAK_SET[0];
    for (let i = 0; i < ARTEFAK_SLOT.length; i++) {
      const slot = ARTEFAK_SLOT[i].kunci;
      const id = artefakId(set.kunci, slot);
      if (progres.artefakMilik[id] > 0) pasangArtefak("kenzro", slot, id);
    }
    catat(`PASANG ${set.nama} lengkap ke kenzro`);
    segarkanTampilan();
  }

  function resetSemua() {
    stabilkan();
    progres.artefakMilik = {};
    progres.artefakBintang = {};
    progres.artefakSubstat = {};
    progres.artefakPakai = {};
    saveTulis();
    artefakBaruTerakhir = null;
    catat("RESET semua artefak");
    segarkanTampilan();
  }

  function koin(banyak) {
    progres.koinSaldo = (progres.koinSaldo || 0) + banyak;
    saveTulis();
    catat("KOIN +" + banyak);
    segarkanTampilan();
  }

  function catat(pesan) {
    const el = document.getElementById("debugArtefakLog");
    if (el) el.title = pesan;
    if (typeof console !== "undefined" && console.log) console.log("[debug artefak] " + pesan);
  }

  function tombol(teks, aksi) {
    const b = document.createElement("button");
    b.className = "tombol-abu";
    b.type = "button";
    b.textContent = teks;
    b.style.cssText = "font-size:calc(var(--cs,0.56)*11px);padding:4px 6px;white-space:nowrap;";
    b.onclick = aksi;
    return b;
  }

  function buatPanel() {
    const panel = document.createElement("div");
    panel.id = "panelDebugArtefak";
    // ditaruh di ATAS layar supaya mudah diakses
    panel.style.cssText =
      "position:fixed;left:50%;transform:translateX(-50%);top:6px;z-index:99999;" +
      "display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:center;" +
      "padding:8px 12px;background:rgba(6,8,16,0.96);border:2px solid #7a5cff;" +
      "border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,0.6);max-width:96vw;";

    const label = document.createElement("span");
    label.textContent = "DEBUG";
    label.style.cssText = "color:#a78bfa;font-weight:bold;font-size:13px;letter-spacing:1px;";
    panel.appendChild(label);

    panel.appendChild(tombol("RESET SKILL VENDER", () => {
      if (!progres.skillPakai) progres.skillPakai = {};
      progres.skillPakai["rin"] = 3;
      saveTulis();
      catat("SKILL VENDER → SLOT 3 (INFERNO)");
      segarkanTampilan();
    }));

    panel.appendChild(tombol("SEMUA LV1", () => beriSemua(1)));
    panel.appendChild(tombol("SEMUA LV5", () => beriSemua(5)));
    panel.appendChild(tombol("SEMUA LV MAX", () => beriSemua(ARTEFAK_LEVEL_MAX)));
    panel.appendChild(tombol("PASANG OTOMATIS", pasangOtomatis));
    panel.appendChild(tombol("KOIN +500K", () => koin(500000)));
    panel.appendChild(tombol("RESET", resetSemua));

    const log = document.createElement("span");
    log.id = "debugArtefakLog";
    log.style.cssText = "color:#8a93a5;font-size:12px;min-width:120px;text-align:center;";
    panel.appendChild(log);

    document.body.appendChild(panel);
    hitungDimiliki();
  }

  function hitungDimiliki() {
    const el = document.getElementById("debugArtefakLog");
    if (!el) return;
    const total = ARTEFAK_SET.length * ARTEFAK_SLOT.length;
    let punya = 0;
    for (const set of ARTEFAK_SET) {
      for (const slot of ARTEFAK_SLOT) {
        if (artefakLevel(artefakId(set.kunci, slot.kunci)) > 0) punya++;
      }
    }
    el.textContent = "DIMILIKI " + punya + "/" + total;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", siap);
  } else {
    siap();
  }
})();
