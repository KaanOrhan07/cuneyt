-- DiTrack Sipariş Takip — sipariş iptal desteği
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).

alter type siparis_durum add value if not exists 'iptal_edildi';

-- ============================================================
-- trigger: sipariş "iptal_edildi" durumuna geçince stok etkisini
-- geri al; iptalden geri dönülürse etkiyi tekrar uygula.
-- ============================================================
create or replace function fn_siparis_durum_degisti()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  kalem record;
begin
  if new.durum = 'iptal_edildi' and old.durum != 'iptal_edildi' then
    for kalem in select * from siparis_kalemleri where siparis_id = new.id loop
      if new.tip = 'alis' then
        update urunler set stok_adet = stok_adet - kalem.adet where id = kalem.urun_id;
        insert into stok_hareketleri (urun_id, siparis_id, yon, adet)
        values (kalem.urun_id, new.id, 'cikis', kalem.adet);
      else
        update urunler set stok_adet = stok_adet + kalem.adet where id = kalem.urun_id;
        insert into stok_hareketleri (urun_id, siparis_id, yon, adet)
        values (kalem.urun_id, new.id, 'giris', kalem.adet);
      end if;
    end loop;
  elsif old.durum = 'iptal_edildi' and new.durum != 'iptal_edildi' then
    for kalem in select * from siparis_kalemleri where siparis_id = new.id loop
      if new.tip = 'alis' then
        update urunler set stok_adet = stok_adet + kalem.adet where id = kalem.urun_id;
        insert into stok_hareketleri (urun_id, siparis_id, yon, adet)
        values (kalem.urun_id, new.id, 'giris', kalem.adet);
      else
        update urunler set stok_adet = stok_adet - kalem.adet where id = kalem.urun_id;
        insert into stok_hareketleri (urun_id, siparis_id, yon, adet)
        values (kalem.urun_id, new.id, 'cikis', kalem.adet);
      end if;
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_siparis_durum_degisti on siparisler;
create trigger trg_siparis_durum_degisti
after update on siparisler
for each row execute function fn_siparis_durum_degisti();
