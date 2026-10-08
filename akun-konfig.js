// Config akun + hosting. Selama AKUN_KONFIG belum diisi, game tetap jalan
// 100% lokal seperti sekarang (tidak ada request ke jaringan sama sekali).
//
// CARA PAKAI (satu kali):
// 1. Buka https://supabase.com -> buat project baru (gratis).
// 2. SQL Editor -> salin & jalankan isi file sql/supabase.sql.
// 3. Settings -> API -> salin "Project URL" dan "anon public" key.
// 4. Isi AKUN_KONFIG di bawah, lalu ubah aktif: true.
//
// Catatan:
// - Kunci "anon public" AMAN untuk ditaruh di kode (itu memang dirancang publik).
//   Yang menentukan keamanan adalah policies RLS di sql/supabase.sql.
// - Tidak ada pemulihan/lupa password di versi ini, jadi Email Auth boleh
//   dimatikan di "Settings -> Authentication" supaya pendaftaran langsung aktif.

const AKUN_KONFIG = {
  aktif: true,
  // URL DASAR saja tanpa /rest/v1/ -- supabase-js menambahkannya sendiri.
  url: "https://zsprflefrgdjzoehjcio.supabase.co",
  // Publishable key (pengganti anon key lama). Aman ditaruh di kode publik.
  anonKey: "sb_publishable_ffNuwg6guxDlZoXpE0iItg_xZhmwedh",
  namaTabel: "saves",
  jedaUnggahMs: 8000,
  // Versi major dipakai supaya tidak hardcode rilis minor yang bisa hilang.
  cdnSupabase: "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
};