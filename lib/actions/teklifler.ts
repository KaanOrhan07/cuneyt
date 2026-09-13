"use server";

import { revalidatePath } from "next/cache";
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
    .insert({ firma_id, tip })
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

  revalidatePath(`/firmalar/${firma_id}`);
  return undefined;
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
  if (data?.firma_id) revalidatePath(`/firmalar/${data.firma_id}`);
}
