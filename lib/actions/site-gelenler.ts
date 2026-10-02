"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { epostaYapilandirildiMi, onayEpostasiGonder } from "@/lib/eposta";
import { kaydetGelen, normalizeGelen } from "@/lib/site-gelenler";
import type { GelenEpostaDurumu, GelenTip, SiteGelen } from "@/lib/types";

export type GelenSonuc = { ok: boolean; mesaj?: string; eposta?: GelenEpostaDurumu | null };

async function kullanici() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Yetkisiz erişim");
  const { data: ekip } = await supabase
    .from("ekip_uyeleri")
    .select("ad_soyad")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  return { supabase, ad: ekip?.ad_soyad ?? user.email ?? "—" };
}

function yenile() {
  revalidatePath("/siteden-gelenler");
  revalidatePath("/dashboard", "layout");
}

const EPOSTA_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function epostaGonder(supabase: SupabaseClient, g: SiteGelen) {
  let durum: GelenEpostaDurumu;
  let hata: string | null = null;

  if (!g.musteri_eposta || !EPOSTA_RE.test(g.musteri_eposta)) {
    durum = "eposta-yok";
  } else if (!epostaYapilandirildiMi()) {
    durum = "ayarlanmamis";
  } else {
    try {
      const { data: sirket } = await supabase
        .from("sirket_profili")
        .select("sirket_adi, telefon, eposta")
        .eq("id", true)
        .maybeSingle();
      await onayEpostasiGonder({
        to: g.musteri_eposta,
        bcc: sirket?.eposta ?? null,
        tip: g.tip,
        no: g.dis_no,
        musteriAd: g.musteri_ad,
        kalemler: g.kalemler,
        toplam: g.toplam,
        paraBirimi: g.para_birimi,
        sirket: {
          ad: sirket?.sirket_adi ?? null,
          telefon: sirket?.telefon ?? null,
          eposta: sirket?.eposta ?? null,
        },
      });
      durum = "gonderildi";
    } catch (e) {
      durum = "hata";
      hata = e instanceof Error ? e.message : "Bilinmeyen hata";
    }
  }

  await supabase
    .from("site_gelenler")
    .update({ eposta_durumu: durum, eposta_hata: hata, updated_at: new Date().toISOString() })
    .eq("id", g.id);
  return { durum, hata };
}

function epostaMesaji(durum: GelenEpostaDurumu, hata: string | null) {
  switch (durum) {
    case "gonderildi":
      return "Onaylandı, müşteriye e-posta gönderildi.";
    case "eposta-yok":
      return "Onaylandı ancak kayıtta geçerli bir müşteri e-postası yok, e-posta gönderilemedi.";
    case "ayarlanmamis":
      return "Onaylandı ancak e-posta ayarları (SMTP) tanımlı değil, e-posta gönderilemedi.";
    default:
      return `Onaylandı ancak e-posta gönderilemedi: ${hata ?? "bilinmeyen hata"}`;
  }
}

export async function onayla(id: string): Promise<GelenSonuc> {
  const { supabase, ad } = await kullanici();

  const { data: g, error } = await supabase.from("site_gelenler").select("*").eq("id", id).single();
  if (error || !g) return { ok: false, mesaj: error?.message ?? "Kayıt bulunamadı." };
  if (g.durum !== "beklemede") return { ok: false, mesaj: "Bu kayıt zaten işlenmiş." };

  const { data: guncellenen, error: guncelleHata } = await supabase
    .from("site_gelenler")
    .update({
      durum: "onaylandi",
      onay_tarihi: new Date().toISOString(),
      onaylayan: ad,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("durum", "beklemede")
    .select("id");
  if (guncelleHata) return { ok: false, mesaj: guncelleHata.message };
  if (!guncellenen || guncellenen.length === 0) return { ok: false, mesaj: "Bu kayıt zaten işlenmiş." };

  const sonuc = await epostaGonder(supabase, g as SiteGelen);
  yenile();
  return { ok: true, eposta: sonuc.durum, mesaj: epostaMesaji(sonuc.durum, sonuc.hata) };
}

export async function reddet(id: string): Promise<GelenSonuc> {
  const { supabase, ad } = await kullanici();
  const { data, error } = await supabase
    .from("site_gelenler")
    .update({
      durum: "reddedildi",
      onay_tarihi: new Date().toISOString(),
      onaylayan: ad,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("durum", "beklemede")
    .select("id");
  if (error) return { ok: false, mesaj: error.message };
  if (!data || data.length === 0) return { ok: false, mesaj: "Bu kayıt zaten işlenmiş." };
  yenile();
  return { ok: true, mesaj: "Reddedildi." };
}

export async function beklemeyeAl(id: string): Promise<GelenSonuc> {
  const { supabase } = await kullanici();
  const { data, error } = await supabase
    .from("site_gelenler")
    .update({ durum: "beklemede", onay_tarihi: null, onaylayan: null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("durum", "reddedildi")
    .select("id");
  if (error) return { ok: false, mesaj: error.message };
  if (!data || data.length === 0) return { ok: false, mesaj: "Sadece reddedilen kayıtlar beklemeye alınabilir." };
  yenile();
  return { ok: true, mesaj: "Beklemeye alındı." };
}

export async function epostaTekrarGonder(id: string): Promise<GelenSonuc> {
  const { supabase } = await kullanici();
  const { data: g, error } = await supabase.from("site_gelenler").select("*").eq("id", id).single();
  if (error || !g) return { ok: false, mesaj: error?.message ?? "Kayıt bulunamadı." };
  if (g.durum !== "onaylandi") return { ok: false, mesaj: "Sadece onaylanan kayıtlar için e-posta gönderilir." };
  const sonuc = await epostaGonder(supabase, g as SiteGelen);
  yenile();
  return {
    ok: sonuc.durum === "gonderildi",
    eposta: sonuc.durum,
    mesaj: sonuc.durum === "gonderildi" ? "E-posta gönderildi." : epostaMesaji(sonuc.durum, sonuc.hata).replace("Onaylandı ancak ", "Gönderilemedi: "),
  };
}

export async function sil(id: string): Promise<GelenSonuc> {
  const { supabase } = await kullanici();
  const { error } = await supabase.from("site_gelenler").delete().eq("id", id);
  if (error) return { ok: false, mesaj: error.message };
  yenile();
  return { ok: true };
}

function listeCikar(json: unknown): unknown[] {
  if (Array.isArray(json)) return json;
  if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    for (const k of ["data", "orders", "quotes", "items", "results"]) {
      if (Array.isArray(o[k])) return o[k] as unknown[];
    }
  }
  return [];
}

const UCLAR: { yol: string; tip: GelenTip; etiket: string }[] = [
  { yol: "orders", tip: "siparis", etiket: "siparişler" },
  { yol: "quotes", tip: "teklif", etiket: "teklifler" },
];

/** Sitenin API'sinden (updated_since ile) yeni/güncellenen sipariş ve teklifleri çeker. */
export async function sitedenCek(): Promise<GelenSonuc> {
  const { supabase } = await kullanici();

  const taban = process.env.SITE_API_TABAN_URL?.trim().replace(/\/+$/, "");
  const anahtar = process.env.SITE_API_ANAHTARI?.trim();
  if (!taban || !anahtar) {
    return { ok: false, mesaj: "Site API ayarları (SITE_API_TABAN_URL, SITE_API_ANAHTARI) tanımlı değil." };
  }
  if (!/^https:\/\//i.test(taban) && !/^http:\/\/localhost(:\d+)?$/i.test(taban)) {
    return { ok: false, mesaj: "SITE_API_TABAN_URL https:// ile başlamalı." };
  }

  const ozet: string[] = [];
  let toplamIslenen = 0;
  let hataVar = false;

  for (const u of UCLAR) {
    const { data: son } = await supabase
      .from("site_gelenler")
      .select("dis_guncelleme")
      .eq("tip", u.tip)
      .not("dis_guncelleme", "is", null)
      .order("dis_guncelleme", { ascending: false })
      .limit(1)
      .maybeSingle();

    const url = `${taban}/api/v1/${u.yol}${son?.dis_guncelleme ? `?updated_since=${encodeURIComponent(son.dis_guncelleme)}` : ""}`;

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${anahtar}`, Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) {
        hataVar = true;
        ozet.push(`${u.etiket}: HTTP ${res.status}`);
        continue;
      }
      const liste = listeCikar(await res.json());
      let adet = 0;
      for (const oge of liste) {
        const n = normalizeGelen(oge, u.tip, "api");
        if (!n) continue;
        await kaydetGelen(supabase, n);
        adet++;
      }
      toplamIslenen += adet;
      ozet.push(`${u.etiket}: ${adet}`);
    } catch (e) {
      hataVar = true;
      ozet.push(`${u.etiket}: ${e instanceof Error ? e.message : "bağlantı hatası"}`);
    }
  }

  yenile();
  return { ok: !hataVar, mesaj: `${toplamIslenen} kayıt işlendi (${ozet.join(", ")})` };
}
