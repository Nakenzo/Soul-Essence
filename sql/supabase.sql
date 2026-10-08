-- ============================================================================
-- SOUL ESSENCE - SETUP DATABASE (SUPABASE)
-- ============================================================================
--
-- CARA PAKAI (sekali jalan saja, boleh diulang kapan saja):
--   1. Buka Supabase project kamu -> menu SQL Editor
--   2. Tempel seluruh isi file ini
--   3. Klik Run
--
-- Setelah Run, tidak ada lagi yang perlu disetel. Konfirmasi email sudah
-- mati, jadi pemain yang daftar langsung bisa masuk.
--
-- Isinya cuma 3 hal:
--   Tabel "saves"    -> progres game per akun
--   Tabel "profiles" -> username + gmail per akun
--   2 fungsi         -> supaya bisa MASUK pakai username (bukan email)
-- ============================================================================


-- ============================================================================
-- 1. TABEL SAVES  (progres game)
-- ----------------------------------------------------------------------------
-- Isinya string kode save yang sama persis dengan tombol SALIN di panel
-- Cadangan, jadi tidak ada format khusus.
-- ============================================================================

create table if not exists public.saves (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  kode       text not null,
  versi      integer not null default 3,
  updated_at timestamptz not null default now()
);

comment on table public.saves
  is 'Satu baris per akun: kode save + waktu terakhir disimpan.';


-- Kunci akses: tiap akun cuma boleh lihat/ganti miliknya sendiri.

alter table public.saves enable row level security;

drop policy if exists "saves_baca_milik"    on public.saves;
drop policy if exists "saves_tulis_milik"   on public.saves;
drop policy if exists "saves_perbarui_milik" on public.saves;
drop policy if exists "saves_hapus_milik"   on public.saves;

create policy "saves_baca_milik"
  on public.saves for select
  using (auth.uid() = user_id);

create policy "saves_tulis_milik"
  on public.saves for insert
  with check (auth.uid() = user_id);

create policy "saves_perbarui_milik"
  on public.saves for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "saves_hapus_milik"
  on public.saves for delete
  using (auth.uid() = user_id);


-- ============================================================================
-- 2. TABEL PROFILES  (username + gmail)
-- ----------------------------------------------------------------------------
-- Supabase Auth tetap memakai email, jadi:
--   gmail    = identitas akun di server (tempat cadangan progres dikirim)
--   username = nama yang dipakai pemain untuk MASUK ke game
-- ============================================================================

create table if not exists public.profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  username   text not null,
  gmail      text not null,
  created_at timestamptz not null default now()
);

comment on table public.profiles
  is 'Profil akun: username (kunci login) + gmail (tujuan cadangan).';

-- Username unik, huruf besar/kecil dianggap sama (Pemain == pemain).
create unique index if not exists profiles_username_unik
  on public.profiles (lower(username));


-- Kunci akses: tiap akun cuma boleh lihat/ganti profilnya sendiri.

alter table public.profiles enable row level security;

drop policy if exists "profiles_baca_milik"    on public.profiles;
drop policy if exists "profiles_tulis_milik"   on public.profiles;
drop policy if exists "profiles_perbarui_milik" on public.profiles;
drop policy if exists "profiles_hapus_milik"   on public.profiles;

create policy "profiles_baca_milik"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "profiles_tulis_milik"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "profiles_perbarui_milik"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "profiles_hapus_milik"
  on public.profiles for delete
  using (auth.uid() = user_id);


-- ============================================================================
-- 3. DUA FUNGSI UNTUK LOGIN PAKAI USERNAME
-- ----------------------------------------------------------------------------
-- Dipanggil game sebelum masuk. Pakai "security definer" supaya pemain yang
-- belum login tetap boleh mengecek username, tanpa membuka tabel ke publik.
-- ============================================================================

-- Dipakai saat DAFTAR: apakah username ini sudah dipakai orang?
create or replace function public.akun_username_terpakai(p_username text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where lower(username) = lower(trim(p_username))
  );
$$;

-- Dipakai saat MASUK: username -> gmail, lalu gmail itulah yang dikirim ke
-- Supabase Auth bersama sandinya.
create or replace function public.akun_email_dari_username(p_username text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select gmail
  from public.profiles
  where lower(username) = lower(trim(p_username))
  limit 1;
$$;

-- Hanya boleh dipakai oleh pemain game (anon / login), bukan publik leluasa.
revoke execute on function public.akun_username_terpakai(text)  from public;
revoke execute on function public.akun_email_dari_username(text) from public;
grant  execute on function public.akun_username_terpakai(text)  to anon, authenticated;
grant  execute on function public.akun_email_dari_username(text) to anon, authenticated;


-- ============================================================================
-- 4. CEK (opsional) - jalankan setelah mencoba daftar/masuk dari game
-- ============================================================================
--
--   select username, gmail, created_at from public.profiles order by created_at;
--   select user_id, versi, updated_at, length(kode) from public.saves;
--
-- Kalau muncul baris di dua query di atas, semuanya sudah jalan.
--
-- Kosongkan semua data (kalau mau mulai dari nol):
--
--   delete from public.saves;
--   delete from public.profiles;
--
-- ============================================================================
