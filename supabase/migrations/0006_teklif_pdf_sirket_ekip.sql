-- DiTrack Sipariş Takip — Teklif PDF formu, Şirket Profili, Ekip
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).

-- ============================================================
-- Şirket Profili — tek satırlık ayar tablosu (kendi bilgileriniz)
-- ============================================================
create table if not exists sirket_profili (
  id boolean primary key default true,
  check (id),
  sirket_adi text,
  adres text,
  telefon text,
  eposta text,
  vergi_no text,
  banka_bilgisi text,
  logo_url text,
  ozel_sablon_url text,
  varsayilan_notlar text,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Ekip — takip sistemini kullanan çalışma arkadaşları
-- ============================================================
create table if not exists ekip_uyeleri (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique,
  ad_soyad text not null,
  eposta text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Firmalara adres/iletişim bilgileri — teklif PDF'inde "ALICI" bloğu için
-- ============================================================
alter table firmalar add column if not exists adres text;
alter table firmalar add column if not exists telefon text;
alter table firmalar add column if not exists eposta text;
alter table firmalar add column if not exists vergi_no text;

-- ============================================================
-- Tekliflere PDF formu için ek alanlar
-- ============================================================
alter table teklifler add column if not exists satici text;
alter table teklifler add column if not exists termin text;
alter table teklifler add column if not exists nakliye text;
alter table teklifler add column if not exists teslimat_sekli text;
alter table teklifler add column if not exists odeme_sartlari text;
alter table teklifler add column if not exists mesaj text;
alter table teklifler add column if not exists notlar text;
alter table teklifler add column if not exists iskonto numeric not null default 0;
alter table teklifler add column if not exists kdv_orani numeric not null default 20;

-- ============================================================
-- Logo / özel şablon dosyaları için storage bucket (herkese açık okuma)
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('sirket-varliklari', 'sirket-varliklari', true, 10485760)
on conflict (id) do nothing;

-- ============================================================
-- RLS — authenticated tam erişim, anon yok (mevcut desenle aynı)
-- ============================================================
alter table sirket_profili enable row level security;
alter table ekip_uyeleri enable row level security;

create policy "authenticated full access" on sirket_profili
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on ekip_uyeleri
  for all to authenticated using (true) with check (true);
