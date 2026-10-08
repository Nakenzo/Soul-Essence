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
- `save.js` — progres (level, koin, artefak) di `localStorage`, terenkripsi XOR + checksum FNV; kode save, 3 slot cadangan, riwayat otomatis
- `akun-konfig.js` — konfigurasi akun/server (sudah aktif; set `aktif: false` untuk kembali 100% lokal)
- `akun.js` — login/daftar + sinkron progres ke server (Supabase), gabung progres saat bentrok
- `akun-ui.js` — panel AKUN di dalam layar AKUN (di bawah SETTINGS)
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

## Struktur menu

Menu utama (layar judul) punya: PLAY, KARAKTER, SETTINGS, ADMIN. Layar **AKUN** bukan anak langsung dari judul — harus lewat **SETTINGS**:

```
JUDUL -> SETTINGS -> AKUN (kode save, slot cadangan, riwayat, akun & sync)
```

Tiap layar punya tombol `X`, dan `ESC` naik satu jenjang: AKUN -> SETTINGS -> JUDUL. Jangan buka `layarAkun` langsung dari menu utama; `tutupAkun()` selalu balik ke SETTINGS kalau layar itu ada.

## Layar SETTINGS

Pengaturan in-game, disimpan di localStorage kunci `soul-essence-settings` (`settings.js`):

- **SUARA** - tiga slider (umum/efek/musik). Nilainya tidak punya penyimpanan sendiri: slider membaca dan menulis `_volUmum/_volSfx/_volMusik` milik `audio.js` (kunci `soul-essence-volume`), jadi sama persis dengan slider di layar Pause.
- **GAMEPLAY** - saklar *Goyang kamera* (dipakai di `draw.js`) dan *Layar penuh*. Status layar penuh selalu disinkronkan dengan kenyataan lewat event `fullscreenchange`, karena browser keluar dari fullscreen saat reload.
- **KONTROL** - ikatan tombol, hanya tampil di perangkat non-sentuh. Enam aksi: maju/mundur/kiri/kanan/jurus/ultimate. Panah arah tetap aktif sebagai cadangan, dan `Q` tetap cadangan skill (`Q/K`) sehingga tidak bisa dipakai aksi lain. Tombol yang dipakai menu game (angka, Enter, Esc, F11/F12, modifier) ditolak, begitu juga tombol yang sudah dipakai aksi lain.

Saat menunggu tombol baru, `sedangTangkap()` membuat `input.js` mengabaikan seluruh keyboard - kalau tidak, `W` yang ditekan untuk memindahkan ikatan ikut menggerakkan karakter. Tangkapan otomatis dibatalkan kalau layar ditutup.

Penyimpanan yang rusak dinormalisasi diam-diam (`pengaturanNormalkan`): nilai bukan-boolean, string multi-karakter, dan duplikat tombol kembali ke bawaan.

## Akun & sync server (opsional)

Fitur ini **sudah aktif** di rilis ini: `AKUN_KONFIG.aktif` di `akun-konfig.js` sudah `true` dan menunjuk ke project Supabase. Putar sebagai tamu tetap 100% lokal — tidak ada request jaringan sampai pemain membuat akun atau masuk. Set `aktif: false` untuk mematikan seluruh fitur ini.

Kalau perlu project sendiri (mis. untuk build pribadi), langkahnya:

1. Buat project di [supabase.com](https://supabase.com) (gratis).
2. SQL Editor → jalankan seluruh isi `sql/supabase.sql` (tabel `saves` + policies RLS).
3. **Settings → API Keys** → tab **Publishable and secret API keys** → salin **Project URL** dan **Publishable key** (`sb_publishable_...`). Kunci `anon`/`eyJ...` yang lama sekarang disebut *legacy* dan tidak lagi muncul sebagai pilihan utama.
4. Tempel ke `akun-konfig.js`. **Project URL harus URL dasar saja** — tanpa `/rest/v1/` di belakang, karena `supabase-js` menambahkannya sendiri.
5. Matikan **Confirm email** di Authentication → Sign In / Providers. Versi ini tidak punya pemulihan/lupa password, jadi konfirmasi email tidak ada gunanya (dan kuota email gratis Supabase sangat tipis).

Publishable key memang dirancang untuk ditaruh di kode publik; yang melindungi data adalah policies RLS di `sql/supabase.sql` (setiap akun hanya bisa membaca/menulis barisnya sendiri). **Jangan pernah** menaruh `sb_secret_` atau `service_role` key di kode game.

Perilaku sinkron:
- Progres lokal selalu ditulis dulu ke `localStorage`, baru diunggah ke server (jeda 8 detik setelah perubahan terakhir) — jadi internet mati tidak menghilangkan progres.
- Saat masuk, versi lokal dan server dibandingkan lewat timestamp. Kalau server jelas lebih baru, progres lokal diganti (versi lama masuk riwayat otomatis). Kalau lokal lebih baru atau hampir sama, keduanya **digabung**: level & bos union, koin/level karakter/artefak ambil yang tertinggi.
- Tidak ada pemulihan/lupa password di versi ini.

## Rilis / PWA cache

Game cache-first via service worker (`sw.js`). Versi cache diambil dari field `build` di `manifest.json`. **Setiap rilis, naikkan angka `build`** (2 -> 3 -> ...). Kalau lupa naikkan, pemain terus dilayani file versi lama.

Pertahankan urutan ini sebelum commit fitur:

1. Ubah kode + aset.
2. Naikkan `build` di `manifest.json`.
3. Tambahkan aset baru yang wajib tersedia offline ke `ASSETS_TO_CACHE` di `sw.js` (daftar ini harus sinkron dengan file yang di-`<script>`-kan `index.html` dan aset yang di-load `main.js`).

## File yang tidak ikut ke GitHub

Dijaga lewat `.gitignore` (jangan dihapus tanpa alasan):

- `admin-akses.js` + `admin-artefak.js` + `test-wave-select.js` — alat admin/testing (F9 = pilih wave, panel debug artefak/koin). Diakses lewat tombol `ADMIN` di layar judul `index.html`, dibuka dengan password (lihat `ADMIN_PASSWORD` di `admin-akses.js`). Skrip hanya dimuat setelah password benar, jadi versi rilis tidak terpengaruh.
- `test-wave-select.js` — lompat wave untuk uji.
- `artefak.js` — sistem artefak masih belum stabil, dikecualikan sampai siap rilis.