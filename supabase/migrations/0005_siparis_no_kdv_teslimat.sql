-- DiTrack Sipariş Takip — sipariş no, KDV, kısmi teslimat, otomatik teklif no
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).

-- ============================================================
-- siparişlere: sipariş no (kullanıcı girer), KDV oranı
-- ============================================================
alter table siparisler add column if not exists siparis_no text;
alter table siparisler add column if not exists kdv_orani numeric not null default 20;

-- ============================================================
-- sipariş kalemlerine: teslim edilen adet (kısmi teslimat takibi)
-- ============================================================
alter table siparis_kalemleri add column if not exists teslim_edilen_adet numeric not null default 0;

-- ============================================================
-- tekliflere: otomatik atanan teklif no (TKF-0001, TKF-0002, ...)
-- ============================================================
create sequence if not exists teklif_no_seq;

alter table teklifler add column if not exists teklif_no text
  default ('TKF-' || lpad(nextval('teklif_no_seq')::text, 4, '0'));

-- mevcut kayıtlar varsa numarasız kalmasın
update teklifler set teklif_no = 'TKF-' || lpad(nextval('teklif_no_seq')::text, 4, '0')
  where teklif_no is null;
