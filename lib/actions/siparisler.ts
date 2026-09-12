"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SiparisDurum, SiparisTip } from "@/lib/types";

export type KalemInput = { urun_id: string; adet: number; birim_fiyat: number };
export type SiparisState = { error?: string } | undefined;

export async function createSiparis(
  _prevState: SiparisState,
  formData: FormData,
): Promise<SiparisState> {
  const supabase = await createClient();

  const firma_id = formData.get("firma_id") as string;
  const tip = formData.get("tip") as SiparisTip;
  const durum = formData.get("durum") as SiparisDurum;
  const kalemlerRaw = formData.get("kalemler") as string;

  let kalemler: KalemInput[] = [];
  try {
    kalemler = JSON.parse(kalemlerRaw);
  } catch {
    return { error: "Ürün satırları okunamadı." };
  }

  if (!firma_id || !tip || kalemler.length === 0) {
    return { error: "Firma ve en az bir ürün satırı zorunludur." };
  }

  const { data: siparis, error: siparisError } = await supabase
    .from("siparisler")
    .insert({ firma_id, tip, durum })
    .select("id")
    .single();

  if (siparisError || !siparis) {
    return { error: siparisError?.message ?? "Sipariş oluşturulamadı." };
  }

  const { error: kalemError } = await supabase.from("siparis_kalemleri").insert(
    kalemler.map((k) => ({
      siparis_id: siparis.id,
      urun_id: k.urun_id,
      adet: k.adet,
      birim_fiyat: k.birim_fiyat,
    })),
  );

  if (kalemError) {
    return { error: kalemError.message };
  }

  revalidatePath("/siparisler");
  revalidatePath("/urunler");
  revalidatePath("/dashboard");
  revalidatePath(`/firmalar/${firma_id}`);
  redirect("/siparisler");
}

export async function updateDurum(id: string, durum: SiparisDurum) {
  const supabase = await createClient();
  const { error } = await supabase.from("siparisler").update({ durum }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/siparisler");
  revalidatePath("/dashboard");
}
