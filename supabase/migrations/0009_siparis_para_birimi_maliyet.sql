-- Orders now carry their own currency, and order lines track an internal
-- cost (birim_maliyet) separate from the line price (birim_fiyat).
-- Product-level pricing (urunler.satis_fiyati / ortalama_maliyet) stays in
-- the schema (still written by the existing cost-averaging trigger) but is
-- no longer surfaced on the Ürünler screen — pricing now lives per order,
-- since unit price depends on the quantity a customer orders.

alter table siparisler add column if not exists para_birimi text not null default 'TL';
alter table siparis_kalemleri add column if not exists birim_maliyet numeric not null default 0;
