-- DiTrack — Finans, Tedarik (satın alma), Kargo, Alış teklifi şablonu, İşlem Kayıtları
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).

-- ============================================================
-- Kargo bedeli (kullanıcı girer)
-- ============================================================
alter table siparisler add column if not exists kargo_bedeli numeric not null default 0;
alter table teklifler add column if not exists kargo_bedeli numeric not null default 0;

-- ============================================================
-- Alış teklifi için ayrı özel şablon
-- ============================================================
alter table sirket_profili add column if not exists alis_teklif_sablon_url text;

-- ============================================================
-- Cari hareketler: yön (alacak = bize borcu var, verecek = bizim borcumuz) + para birimi
-- ============================================================
alter table cari_hareketler add column if not exists yon text not null default 'alacak';
alter table cari_hareketler drop constraint if exists cari_hareketler_yon_check;
alter table cari_hareketler add constraint cari_hareketler_yon_check check (yon in ('alacak', 'verecek'));
alter table cari_hareketler add column if not exists para_birimi text not null default 'TL';

-- ============================================================
-- Giderler
-- ============================================================
create table if not exists giderler (
  id uuid primary key default gen_random_uuid(),
  tarih date not null default current_date,
  kategori text,
  aciklama text not null,
  tutar numeric not null,
  para_birimi text not null default 'TL',
  created_at timestamptz not null default now()
);

-- ============================================================
-- Tedarik: satın alma siparişleri (Purchase Order)
-- ============================================================
create table if not exists satin_almalar (
  id uuid primary key default gen_random_uuid(),
  firma_id uuid not null references firmalar(id),
  po_no text,
  tarih date not null default current_date,
  teklif_ref text,
  iletisim text,
  teslimat text,
  nakliye text,
  termin text,
  odeme_sartlari text,
  mesaj text,
  notlar text,
  para_birimi text not null default 'EUR',
  kdv_orani numeric not null default 0,
  kargo_bedeli numeric not null default 0,
  kargo_notu text,
  durum text not null default 'taslak',
  created_at timestamptz not null default now(),
  constraint satin_almalar_durum_check check (durum in ('taslak', 'gonderildi', 'teslim_alindi', 'iptal_edildi'))
);

create table if not exists satin_alma_kalemleri (
  id uuid primary key default gen_random_uuid(),
  satin_alma_id uuid not null references satin_almalar(id) on delete cascade,
  sira int not null default 0,
  adet numeric not null,
  aciklama text not null,
  termin text,
  birim_fiyat numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_satin_almalar_firma_id on satin_almalar(firma_id);
create index if not exists idx_satin_alma_kalemleri_sa_id on satin_alma_kalemleri(satin_alma_id);
create index if not exists idx_giderler_tarih on giderler(tarih);

-- ============================================================
-- İşlem kayıtları (log) — kim, ne zaman, ne yaptı
-- ============================================================
create table if not exists islem_kayitlari (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kullanici_id uuid,
  kullanici_ad text,
  modul text not null,
  islem text not null,
  kayit_id text,
  baslik text,
  detay jsonb
);

create index if not exists idx_islem_kayitlari_created_at on islem_kayitlari(created_at desc);

create or replace function fn_islem_kaydi()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_ad text;
  v_islem text;
  v_row jsonb;
  v_eski jsonb;
  v_diff jsonb := '{}'::jsonb;
  v_key text;
  v_val jsonb;
  v_baslik text;
  v_hdr text;
begin
  -- başka bir tetikleyicinin (ör. stok tetikleyicisi) yan etkisiyse kaydetme
  if pg_trigger_depth() > 1 then
    return coalesce(new, old);
  end if;

  -- yedek içe aktarma sırasında binlerce satırlık log gürültüsünü atla
  begin
    v_hdr := (current_setting('request.headers', true)::jsonb) ->> 'x-ditrack-import';
  exception when others then
    v_hdr := null;
  end;
  if v_hdr = '1' then
    return coalesce(new, old);
  end if;

  if v_uid is not null then
    select ad_soyad into v_ad from ekip_uyeleri where auth_user_id = v_uid;
    if v_ad is null then
      select email into v_ad from auth.users where id = v_uid;
    end if;
  end if;

  v_row := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;

  v_baslik := case tg_table_name
    when 'firmalar' then v_row ->> 'ad'
    when 'urunler' then v_row ->> 'ad'
    when 'siparisler' then coalesce(v_row ->> 'siparis_no', v_row ->> 'tip')
    when 'teklifler' then v_row ->> 'teklif_no'
    when 'cari_hareketler' then coalesce(v_row ->> 'fatura_no', v_row ->> 'aciklama')
    when 'cari_odemeler' then v_row ->> 'tutar'
    when 'giderler' then v_row ->> 'aciklama'
    when 'satin_almalar' then v_row ->> 'po_no'
    when 'sirket_profili' then v_row ->> 'sirket_adi'
    when 'ekip_uyeleri' then v_row ->> 'ad_soyad'
    else null
  end;

  if tg_op = 'INSERT' then
    v_islem := 'ekleme';
    v_diff := v_row;
  elsif tg_op = 'DELETE' then
    v_islem := 'silme';
    v_diff := v_row;
  else
    v_islem := 'guncelleme';
    v_eski := to_jsonb(old);
    for v_key, v_val in select * from jsonb_each(v_row) loop
      if v_key <> 'updated_at' and (v_eski -> v_key) is distinct from v_val then
        v_diff := v_diff || jsonb_build_object(v_key, jsonb_build_array(v_eski -> v_key, v_val));
      end if;
    end loop;
    if v_diff = '{}'::jsonb then
      return new;
    end if;
    if tg_table_name = 'siparis_kalemleri' then
      v_diff := v_diff || jsonb_build_object('siparis_id', new.siparis_id);
    end if;
  end if;

  insert into islem_kayitlari (kullanici_id, kullanici_ad, modul, islem, kayit_id, baslik, detay)
  values (v_uid, v_ad, tg_table_name, v_islem, v_row ->> 'id', v_baslik, v_diff);

  return coalesce(new, old);
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'firmalar', 'urunler', 'siparisler', 'teklifler', 'cari_hareketler',
    'cari_odemeler', 'giderler', 'satin_almalar', 'sirket_profili', 'ekip_uyeleri'
  ]
  loop
    execute format('drop trigger if exists trg_islem_kaydi on %I', t);
    execute format(
      'create trigger trg_islem_kaydi after insert or update or delete on %I for each row execute function fn_islem_kaydi()',
      t
    );
  end loop;
end;
$$;

-- sipariş kalemlerinde sadece güncellemeleri (ör. teslim edilen adet) kaydet
drop trigger if exists trg_islem_kaydi on siparis_kalemleri;
create trigger trg_islem_kaydi
after update on siparis_kalemleri
for each row execute function fn_islem_kaydi();

-- ============================================================
-- RLS
-- ============================================================
alter table giderler enable row level security;
alter table satin_almalar enable row level security;
alter table satin_alma_kalemleri enable row level security;
alter table islem_kayitlari enable row level security;

create policy "authenticated full access" on giderler
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on satin_almalar
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on satin_alma_kalemleri
  for all to authenticated using (true) with check (true);

-- log tablosu: okunabilir ve eklenebilir, ama değiştirilemez/silinemez
create policy "authenticated read" on islem_kayitlari
  for select to authenticated using (true);
create policy "authenticated insert" on islem_kayitlari
  for insert to authenticated with check (true);
