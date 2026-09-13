-- DiTrack Sipariş Takip — teklifler, cari hesap (borç takibi) ve teslimat tarihi
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).

-- ============================================================
-- siparişlere son teslim tarihi
-- ============================================================
alter table siparisler add column if not exists son_teslim_tarihi timestamptz;

-- ============================================================
-- teklifler (verilen/alınan teklifler)
-- ============================================================
create type teklif_durum as enum ('beklemede', 'kabul_edildi', 'reddedildi');

create table teklifler (
  id uuid primary key default gen_random_uuid(),
  firma_id uuid not null references firmalar(id),
  tip siparis_tip not null,
  durum teklif_durum not null default 'beklemede',
  tarih_saat timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table teklif_kalemleri (
  id uuid primary key default gen_random_uuid(),
  teklif_id uuid not null references teklifler(id) on delete cascade,
  urun_id uuid not null references urunler(id),
  adet numeric not null,
  birim_fiyat numeric not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- cari hesap: borç kayıtları (faturalar) ve ödemeler
-- ============================================================
create table cari_hareketler (
  id uuid primary key default gen_random_uuid(),
  firma_id uuid not null references firmalar(id),
  tarih date not null default current_date,
  fatura_no text,
  tutar numeric not null,
  vade_tarihi date,
  aciklama text,
  created_at timestamptz not null default now()
);

create table cari_odemeler (
  id uuid primary key default gen_random_uuid(),
  cari_hareket_id uuid not null references cari_hareketler(id) on delete cascade,
  tarih date not null default current_date,
  tutar numeric not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- RLS — authenticated tam erişim, anon yok (mevcut desenle aynı)
-- ============================================================
alter table teklifler enable row level security;
alter table teklif_kalemleri enable row level security;
alter table cari_hareketler enable row level security;
alter table cari_odemeler enable row level security;

create policy "authenticated full access" on teklifler
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on teklif_kalemleri
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on cari_hareketler
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on cari_odemeler
  for all to authenticated using (true) with check (true);

-- ============================================================
-- indexes
-- ============================================================
create index idx_teklifler_firma_id on teklifler(firma_id);
create index idx_teklif_kalemleri_teklif_id on teklif_kalemleri(teklif_id);
create index idx_cari_hareketler_firma_id on cari_hareketler(firma_id);
create index idx_cari_odemeler_cari_hareket_id on cari_odemeler(cari_hareket_id);
create index idx_siparisler_son_teslim_tarihi on siparisler(son_teslim_tarihi);
