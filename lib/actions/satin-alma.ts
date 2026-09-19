"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SatinAlmaDurum } from "@/lib/types";

export type SatinAlmaKalemInput = {
  adet: number;
  aciklama: string;
  termin: string;
  birim_fiyat: number;
};
export type SatinAlmaState = { error?: string } | undefined;

const bos = (v: FormDataEntryValue | null) => ((v as string | null)?.trim() ? (v as string).trim() : null);

export async function createSatinAlma(
  _prev: SatinAlmaState,
  formData: FormData,
): Promise<SatinAlmaState> {
  const supabase = await createClient();

  const firma_id = formData.get("firma_id") as string;
  const kalemlerRaw = formData.get("kalemler") as string;

  let kalemler: SatinAlmaKalemInput[] = [];
  try {
    kalemler = JSON.parse(kalemlerRaw);
  } catch {
    return { error: "Sipariş kalemleri okunamadı." };
  }
  kalemler = kalemler.filter((k) => k.aciklama?.trim() && Number(k.adet) > 0);

  if (!firma_id || kalemler.length === 0) {
    return { error: "Tedarikçi ve en az bir sipariş kalemi (açıklama + adet) zorunludur." };
  }

  const kargo_bedeli = Number(formData.get("kargo_bedeli") ?? 0) || 0;

  const { data: po, error: poHata } = await supabase
    .from("satin_almalar")
    .insert({
      firma_id,
      po_no: bos(formData.get("po_no")),
      tarih: bos(formData.get("tarih")) ?? undefined,
      teklif_ref: bos(formData.get("teklif_ref")),
      iletisim: bos(formData.get("iletisim")),
      teslimat: bos(formData.get("teslimat")),
      nakliye: bos(formData.get("nakliye")),
      termin: bos(formData.get("termin")),
      odeme_sartlari: bos(formData.get("odeme_sartlari")),
      mesaj: bos(formData.get("mesaj")),
      notlar: bos(formData.get("notlar")),
      para_birimi: (formData.get("para_birimi") as string) || "EUR",
      kdv_orani: Number(formData.get("kdv_orani") ?? 0) || 0,
      kargo_bedeli,
      kargo_notu: bos(formData.get("kargo_notu")),
    })
    .select("id")
    .single();

  if (poHata || !po) return { error: poHata?.message ?? "Sipariş oluşturulamadı." };

  const { error: kalemHata } = await supabase.from("satin_alma_kalemleri").insert(
    kalemler.map((k, i) => ({
      satin_alma_id: po.id,
      sira: i,
      adet: Number(k.adet),
      aciklama: k.aciklama.trim(),
      termin: k.termin?.trim() || null,
      birim_fiyat: Number(k.birim_fiyat) || 0,
    })),
  );
  if (kalemHata) {
    await supabase.from("satin_almalar").delete().eq("id", po.id);
    return { error: kalemHata.message };
  }

  revalidatePath("/tedarik");
  redirect(`/tedarik/${po.id}`);
}

export async function updateSatinAlmaDurum(id: string, durum: SatinAlmaDurum) {
  const supabase = await createClient();
  const { error } = await supabase.from("satin_almalar").update({ durum }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tedarik");
  revalidatePath(`/tedarik/${id}`);
}

export async function deleteSatinAlma(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("satin_almalar").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tedarik");
}
