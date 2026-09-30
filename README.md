# Soul Essence

2D top-down action roguelike. Vanilla JS tanpa dependency, bisa dijalankan sebagai PWA offline.

## Menjalankan

Butuh Node.js (>= 14). Server sekaligus membuka browser otomatis:

```bash
npm start
# atau
node server.js
# atau klik dua kali start-app.bat
```

Buka `http://localhost:8080/`. Untuk install sebagai PWA, klik "Install App" di address bar.

> Servis lewat HTTP server. Kalau dibuka langsung via `file://`, dinding map (yang di-extract dari pixel PNG) tidak terbaca sehingga collision terbatas pada barrier tepi.

## Kontrol

| Aksi | Desktop | Mobile |
|---|---|---|
| Gerak | WASD / Panah | Joystick kiri |
| Serang | Klik kiri (auto-aim ke musuh terdekat) | Tombol serang |
| Dash | Klik kanan | Tombol dash |
| Skill | Q / K | Tombol skill |
| Ultimate | R | Tombol ult |
| Jeda | Esc | Tombol pause |

## Struktur kode

`index.html` memuat script global sesuai urutan — jangan ubah urutan sembarangan, beberapa file bergantung ke inisialisasi global:

- `core.js` — konstanta dunia, state global, `resetArena()`
- `save.js` — progres (level, koin, artefak) di `localStorage`, terenkripsi XOR + checksum FNV
- `audio.js` — Web Audio synth + file SFX/BGM, 3 slider volume di menu pause
- `config.js` — data karakter & artefak (single source of truth)
- `karakter.js` / `artefak.js` — sistem upgrade karakter & set artefak
- `bosses.js` — definisi data bos
- `maps.js` — collision map (grid dari pixel PNG)
- `menu.js` — UI semua layar
- `input.js` — keyboard / mouse / layar sentuh
- `levels.js` — tabel wave & transisi level
- `upgrades.js` — kartu upgrade antar wave
- `skills.js` — jurus & ultimate per karakter
- `entities.js` — simulasi: pemain, musuh, AI bos, damage
- `draw.js` — rendering utama
- `main.js` — boot: muat aset, game loop

## Aset animasi karakter

Beban aset di `main.js` bersumber dari daftar `animasi` di `config.js` per karakter (mis. `{ nama: "idle", jumlah: 12 }`). File harus bernama `<kunci>-<nama>-<index>.png` di `assets/animasi/<kunci>/`. Clip yang tidak terdaftar tidak akan diminta — jadi tidak ada 404 untuk animasi yang belum dibuat. Kalau menambah clip baru, cukup tambahkan entri di config dan taruh PNG-nya.

## Rilis / PWA cache

Game cache-first via service worker (`sw.js`). Versi cache diambil dari field `build` di `manifest.json`. **Setiap rilis, naikkan angka `build`** (2 -> 3 -> ...). Kalau lupa naikkan, pemain terus dilayani file versi lama.

Pertahankan urutan ini sebelum commit fitur:

1. Ubah kode + aset.
2. Naikkan `build` di `manifest.json`.
3. Tambahkan aset baru yang wajib tersedia offline ke `ASSETS_TO_CACHE` di `sw.js` (daftar ini harus sinkron dengan file yang di-`<script>`-kan `index.html` dan aset yang di-load `main.js`).

## File yang tidak ikut ke GitHub

Dijaga lewat `.gitignore` (jangan dihapus tanpa alasan):

- `admin.html` + `admin-artefak.js` — halaman admin untuk testing (F9 = pilih wave, panel debug artefak). Salinan admin dihasilkan manual dari `index.html`; kalau mengubah struktur `index.html`, sinkronkan juga di `admin.html`.
- `test-wave-select.js` — lompat wave untuk uji.
- `artefak.js` — sistem artefak masih belum stabil, dikecualikan sampai siap rilis.