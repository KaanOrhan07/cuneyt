"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { IMPORT_EDILEBILIR } from "@/lib/yedek";
import { logla } from "@/lib/log";

export type YedekSatirSonucu = { eklenen: number; atlanan: number; idler: string[] };

async function girisliIstemci() {
  // "x-ditrack-import" başlığı, işlem kayıtları tetikleyicisinin binlerce satırı tek tek loglamasını engeller
  const supabase = await createClient({ "x-ditrack-import": "1" });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Yetkisiz erişim");
  return supabase;
}

function temizle(satir: Record<string, unknown>) {
  const cikti: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(satir)) {
    if (v === "" || v === undefined) cikti[k] = null;
    else cikti[k] = v;
  }
  return cikti;
}

/** Yedekteki satırları ekler; aynı id'ye sahip mevcut kayıtlar değiştirilmez, atlanır. */
export async function yedekSatirlariYukle(
  tablo: string,
  satirlar: Record<string, unknown>[],
): Promise<YedekSatirSonucu> {
  if (!IMPORT_EDILEBILIR.has(tablo)) throw new Error(`Bu tablo içe aktarılamaz: ${tablo}`);
  if (satirlar.length === 0) return { eklenen: 0, atlanan: 0, idler: [] };

  const supabase = await girisliIstemci();
  const temiz = satirlar.map(temizle);
  const idli = temiz.filter((s) => s.id);
  const idsiz = temiz.filter((s) => !s.id);

  let eklenen: { id: string }[] = [];
  if (idli.length) {
    const { data, error } = await supabase
      .from(tablo)
      .upsert(idli, { onConflict: "id", ignoreDuplicates: true })
      .select("id");
    if (error) throw new Error(`${tablo}: ${error.message}`);
    eklenen = (data ?? []) as { id: string }[];
  }
  if (idsiz.length) {
    const { data, error } = await supabase.from(tablo).insert(idsiz).select("id");
    if (error) throw new Error(`${tablo}: ${error.message}`);
    eklenen = eklenen.concat((data ?? []) as { id: string }[]);
  }

  return {
    eklenen: eklenen.length,
    atlanan: temiz.length - eklenen.length,
    idler: eklenen.map((e) => e.id),
  };
}

/**
 * Sipariş kalemleri eklenirken stok tetikleyicileri çalışır; yeni eklenen ürünlerin stok ve maliyet
 * değerlerini yedekteki (doğru) değerlere geri döndürür.
 */
export async function yedekStokDuzelt(
  duzeltmeler: { id: string; stok_adet: number; ortalama_maliyet: number }[],
) {
  const supabase = await girisliIstemci();
  for (const d of duzeltmeler) {
    const { error } = await supabase
      .from("urunler")
      .update({ stok_adet: d.stok_adet, ortalama_maliyet: d.ortalama_maliyet })
      .eq("id", d.id);
    if (error) throw new Error(`Stok düzeltme: ${error.message}`);
  }
}

export async function yedekYuklemeBitti(dosyaAdi: string, ozet: Record<string, { eklenen: number; atlanan: number }>) {
  const toplamEklenen = Object.values(ozet).reduce((s, o) => s + o.eklenen, 0);
  const toplamAtlanan = Object.values(ozet).reduce((s, o) => s + o.atlanan, 0);
  await logla("yedek", "yedek_yukleme", dosyaAdi, {
    aciklama: `${toplamEklenen} kayıt eklendi, ${toplamAtlanan} kayıt zaten vardı (atlandı)`,
    ozet,
  });
  for (const yol of [
    "/firmalar",
    "/urunler",
    "/siparisler",
    "/teklifler",
    "/alis-teklifleri",
    "/tedarik",
    "/finans",
    "/dashboard",
    "/tablolar",
    "/stok-hareketleri",
  ]) {
    revalidatePath(yol);
  }
}
