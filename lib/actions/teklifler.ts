"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SiparisTip, TeklifDurum } from "@/lib/types";

export type TeklifKalemInput = { urun_id: string; adet: number; birim_fiyat: number };
export type TeklifState = { error?: string } | undefined;

export async function createTeklif(
  _prevState: TeklifState,
  formData: FormData,
): Promise<TeklifState> {
  const supabase = await createClient();

  const firma_id = formData.get("firma_id") as string;
  const tip = formData.get("tip") as SiparisTip;
  const satici = (formData.get("satici") as string) || null;
  const termin = (formData.get("termin") as string) || null;
  const nakliye = (formData.get("nakliye") as string) || null;
  const teslimat_sekli = (formData.get("teslimat_sekli") as string) || null;
  const odeme_sartlari = (formData.get("odeme_sartlari") as string) || null;
  const mesaj = (formData.get("mesaj") as string) || null;
  const notlar = (formData.get("notlar") as string) || null;
  const iskonto = Number(formData.get("iskonto") ?? 0);
  const kdv_orani = Number(formData.get("kdv_orani") ?? 20);
  const para_birimi = (formData.get("para_birimi") as string) || "TL";
  const kargo_bedeli = Number(formData.get("kargo_bedeli") ?? 0) || 0;
  const sablon_kullan = formData.get("sablon_kullan") === "on";
  const kalemlerRaw = formData.get("kalemler") as string;

  let kalemler: TeklifKalemInput[] = [];
  try {
    kalemler = JSON.parse(kalemlerRaw);
  } catch {
    return { error: "Ürün satırları okunamadı." };
  }

  if (!firma_id || !tip || kalemler.length === 0) {
    return { error: "Firma ve en az bir ürün satırı zorunludur." };
  }

  const { data: teklif, error: teklifError } = await supabase
    .from("teklifler")
    .insert({
      firma_id,
      tip,
      satici,
      termin,
      nakliye,
      teslimat_sekli,
      odeme_sartlari,
      mesaj,
      notlar,
      iskonto,
      kdv_orani,
      para_birimi,
      sablon_kullan,
      ...(kargo_bedeli > 0 ? { kargo_bedeli } : {}),
    })
    .select("id")
    .single();

  if (teklifError || !teklif) {
    return { error: teklifError?.message ?? "Teklif oluşturulamadı." };
  }

  const { error: kalemError } = await supabase.from("teklif_kalemleri").insert(
    kalemler.map((k) => ({
      teklif_id: teklif.id,
      urun_id: k.urun_id,
      adet: k.adet,
      birim_fiyat: k.birim_fiyat,
    })),
  );

  if (kalemError) return { error: kalemError.message };

  revalidatePath("/teklifler");
  revalidatePath("/alis-teklifleri");
  revalidatePath(`/firmalar/${firma_id}`);
  redirect(tip === "alis" ? `/alis-teklifleri/${teklif.id}` : `/teklifler/${teklif.id}`);
}

export async function updateTeklifDurum(id: string, durum: TeklifDurum) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teklifler")
    .update({ durum })
    .eq("id", id)
    .select("firma_id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/teklifler");
  revalidatePath("/alis-teklifleri");
  revalidatePath(`/teklifler/${id}`);
  revalidatePath(`/alis-teklifleri/${id}`);
  if (data?.firma_id) revalidatePath(`/firmalar/${data.firma_id}`);
}

export async function deleteTeklif(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teklifler")
    .delete()
    .eq("id", id)
    .select("firma_id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/teklifler");
  revalidatePath("/alis-teklifleri");
  if (data?.firma_id) revalidatePath(`/firmalar/${data.firma_id}`);
}
