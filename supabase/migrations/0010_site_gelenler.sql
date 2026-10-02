-- Web sitesinden gelen sipariş ve teklifler (webhook veya API ile alınır).
-- Onaylanana kadar "beklemede" kalır; onay/ret kararı ve e-posta durumu burada tutulur.

create table if not exists site_gelenler (
  id uuid primary key default gen_random_uuid(),
  tip text not null check (tip in ('siparis', 'teklif')),
  dis_id text not null,
  dis_no text,
  durum text not null default 'beklemede' check (durum in ('beklemede', 'onaylandi', 'reddedildi')),
  musteri_ad text,
  musteri_firma text,
  musteri_eposta text,
  musteri_telefon text,
  toplam numeric,
  para_birimi text not null default 'TL',
  kalemler jsonb not null default '[]'::jsonb,
  notlar text,
  ham jsonb,
  dis_olusturma timestamptz,
  dis_guncelleme timestamptz,
  onay_tarihi timestamptz,
  onaylayan text,
  eposta_durumu text,
  eposta_hata text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tip, dis_id)
);

create index if not exists idx_site_gelenler_durum on site_gelenler(durum, created_at desc);

alter table site_gelenler enable row level security;

drop policy if exists "authenticated full access" on site_gelenler;
create policy "authenticated full access" on site_gelenler
  for all to authenticated using (true) with check (true);

-- Sadece onay/ret (durum) değişiklikleri kayıtlara düşsün; webhook'un tekrar yazması gürültü yapmasın.
drop trigger if exists trg_islem_kaydi on site_gelenler;
create trigger trg_islem_kaydi
after update of durum on site_gelenler
for each row execute function fn_islem_kaydi();
