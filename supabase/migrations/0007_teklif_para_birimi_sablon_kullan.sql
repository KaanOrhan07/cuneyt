-- DiTrack Sipariş Takip — Teklif para birimi ve şablon kullanma tercihi
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).

alter table teklifler add column if not exists para_birimi text not null default 'TL';
alter table teklifler add column if not exists sablon_kullan boolean not null default true;
