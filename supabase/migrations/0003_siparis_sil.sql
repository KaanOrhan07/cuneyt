-- DiTrack Sipariş Takip — siparişi kalıcı silme desteği
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).

-- stok_hareketleri kayıtları, sildiği sipariş kalkınca kendiliğinden silinsin
alter table stok_hareketleri drop constraint if exists stok_hareketleri_siparis_id_fkey;
alter table stok_hareketleri
  add constraint stok_hareketleri_siparis_id_fkey
  foreign key (siparis_id) references siparisler(id) on delete cascade;

-- ============================================================
-- trigger: sipariş silinmeden hemen önce, henüz iptal edilmemişse
-- stok etkisini geri al (aynı mantık: alış -> stok azalt, satış -> stok artır)
-- ============================================================
create or replace function fn_siparis_silinmeden_once()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  kalem record;
begin
  if old.durum != 'iptal_edildi' then
    for kalem in select * from siparis_kalemleri where siparis_id = old.id loop
      if old.tip = 'alis' then
        update urunler set stok_adet = stok_adet - kalem.adet where id = kalem.urun_id;
      else
        update urunler set stok_adet = stok_adet + kalem.adet where id = kalem.urun_id;
      end if;
    end loop;
  end if;
  return old;
end;
$$;

drop trigger if exists trg_siparis_silinmeden_once on siparisler;
create trigger trg_siparis_silinmeden_once
before delete on siparisler
for each row execute function fn_siparis_silinmeden_once();
