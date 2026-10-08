"use strict";
// Salin aset game (folder induk) ke www/ untuk dibungkus Capacitor.
// Ini BUKAN pengganti permainan — hanya menyiapkan isi aplikasi Android.
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const OUT = path.resolve(__dirname, "..", "www");

const EKSTENSI_BOLEH = new Set([
  ".html", ".css", ".js", ".json", ".ico", ".png", ".jpg", ".jpeg",
  ".gif", ".webp", ".svg", ".mp3", ".wav", ".ogg", ".m4a", ".woff2", ".woff", ".ttf"
]);

const LEWATI_AKAR = new Set([
  ".git", "mobile", "node_modules", "tools",
  "README.md", "package.json", "package-lock.json",
  "server.js", "start-app.bat",
  "admin-akses.js", "admin-artefak.js", "test-wave-select.js"
]);

function salin(asal, tujuan) {
  const nama = path.basename(asal);
  if (!fs.existsSync(asal)) return 0;
  const stats = fs.statSync(asal);
  if (stats.isDirectory()) {
    if (!fs.existsSync(tujuan)) fs.mkdirSync(tujuan, { recursive: true });
    let n = 0;
    for (const entri of fs.readdirSync(asal)) {
      n += salin(path.join(asal, entri), path.join(tujuan, entri));
    }
    return n;
  }
  const ekst = path.extname(nama).toLowerCase();
  if (!EKSTENSI_BOLEH.has(ekst)) return 0;
  if (nama.charAt(0) === ".") return 0;
  fs.copyFileSync(asal, tujuan);
  return 1;
}

if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

let total = 0;
for (const entri of fs.readdirSync(ROOT)) {
  if (LEWATI_AKAR.has(entri)) continue;
  total += salin(path.join(ROOT, entri), path.join(OUT, entri));
}

console.log("www/ siap: " + total + " aset disalin ke " + OUT);

// Verifikasi rilis: sw.js BUILD harus sama dengan manifest build, kalau tidak
// browser tidak akan update service worker dan pemain tetap dapat file lama.
try {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.json"), "utf8"));
  const swSrc = fs.readFileSync(path.join(ROOT, "sw.js"), "utf8");
  const m = swSrc.match(/const BUILD = (\d+)/);
  const swBuild = m ? Number(m[1]) : null;
  if (swBuild !== manifest.build) {
    console.error("GAGAL: sw.js BUILD (" + swBuild + ") != manifest.json build (" + manifest.build + ").");
    console.error("Ubah 'const BUILD' di sw.js agar sama, lalu jalankan ulang script ini.");
    process.exit(1);
  }
  console.log("Verifikasi ok: build " + manifest.build + " (manifest == sw.js)");
} catch (err) {
  console.error("GAGAL verifikasi build: " + err.message);
  process.exit(1);
}