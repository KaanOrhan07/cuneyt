-- DiTrack Sipariş Takip — initial schema
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).

create extension if not exists "pgcrypto";

-- ============================================================
-- firmalar
-- ============================================================
create table firmalar (
  id uuid primary key default gen_random_uuid(),
  ad text not null,
  renk text not null default '#28694B',
  is_tedarikci boolean not null default false,
  is_musteri boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- urunler
-- ============================================================
create table urunler (
  id uuid primary key default gen_random_uuid(),
  ad text not null,
  fotograf_url text,
  stok_adet numeric not null default 0,
  ortalama_maliyet numeric not null default 0,
  satis_fiyati numeric not null default 0,
  kritik_stok_esigi numeric not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- siparisler
-- ============================================================
create type siparis_tip as enum ('alis', 'satis');
create type siparis_durum as enum ('beklemede', 'yolda', 'teslim_edildi');

create table siparisler (
  id uuid primary key default gen_random_uuid(),
  firma_id uuid not null references firmalar(id),
  tip siparis_tip not null,
  durum siparis_durum not null default 'beklemede',
  tarih_saat timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ============================================================
-- siparis_kalemleri
-- ============================================================
create table siparis_kalemleri (
  id uuid primary key default gen_random_uuid(),
  siparis_id uuid not null references siparisler(id) on delete cascade,
  urun_id uuid not null references urunler(id),
  adet numeric not null,
  birim_fiyat numeric not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- stok_hareketleri (auto-logged, never written directly)
-- ============================================================
create type stok_yon as enum ('giris', 'cikis');

create table stok_hareketleri (
  id uuid primary key default gen_random_uuid(),
  urun_id uuid not null references urunler(id),
  siparis_id uuid references siparisler(id),
  yon stok_yon not null,
  adet numeric not null,
  tarih timestamptz not null default now()
);

-- ============================================================
-- trigger: on siparis_kalemleri insert, update stock + weighted-avg cost
-- ============================================================
create or replace function fn_siparis_kalemi_uygula()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tip siparis_tip;
  v_eski_stok numeric;
  v_eski_maliyet numeric;
begin
  select tip into v_tip from siparisler where id = new.siparis_id;

  if v_tip = 'alis' then
    select stok_adet, ortalama_maliyet into v_eski_stok, v_eski_maliyet
    from urunler where id = new.urun_id
    for update;

    update urunler
    set
      ortalama_maliyet = case
        when (v_eski_stok + new.adet) > 0
          then ((v_eski_stok * v_eski_maliyet) + (new.adet * new.birim_fiyat)) / (v_eski_stok + new.adet)
        else v_eski_maliyet
      end,
      stok_adet = v_eski_stok + new.adet
    where id = new.urun_id;

    insert into stok_hareketleri (urun_id, siparis_id, yon, adet)
    values (new.urun_id, new.siparis_id, 'giris', new.adet);

  elsif v_tip = 'satis' then
    update urunler
    set stok_adet = stok_adet - new.adet
    where id = new.urun_id;

    insert into stok_hareketleri (urun_id, siparis_id, yon, adet)
    values (new.urun_id, new.siparis_id, 'cikis', new.adet);
  end if;

  return new;
end;
$$;

create trigger trg_siparis_kalemi_uygula
after insert on siparis_kalemleri
for each row execute function fn_siparis_kalemi_uygula();

-- ============================================================
-- Row Level Security — authenticated users get full access,
-- anon gets none. Single-tenant internal tool.
-- ============================================================
alter table firmalar enable row level security;
alter table urunler enable row level security;
alter table siparisler enable row level security;
alter table siparis_kalemleri enable row level security;
alter table stok_hareketleri enable row level security;

create policy "authenticated full access" on firmalar
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on urunler
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on siparisler
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on siparis_kalemleri
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on stok_hareketleri
  for all to authenticated using (true) with check (true);

-- ============================================================
-- indexes
-- ============================================================
create index idx_siparisler_firma_id on siparisler(firma_id);
create index idx_siparisler_tip on siparisler(tip);
create index idx_siparis_kalemleri_siparis_id on siparis_kalemleri(siparis_id);
create index idx_siparis_kalemleri_urun_id on siparis_kalemleri(urun_id);
create index idx_stok_hareketleri_urun_id on stok_hareketleri(urun_id);
