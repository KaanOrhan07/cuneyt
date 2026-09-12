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
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/firmalar/${firma_id}`);
  revalidatePath("/tablolar");
  revalidatePath("/stok-hareketleri");
  redirect("/siparisler");
}

function revalidateSiparisEffects(firma_id?: string | null) {
  revalidatePath("/siparisler");
  revalidatePath("/urunler");
  revalidatePath("/dashboard", "layout");
  revalidatePath("/tablolar");
  revalidatePath("/stok-hareketleri");
  if (firma_id) revalidatePath(`/firmalar/${firma_id}`);
}

export async function updateDurum(id: string, durum: SiparisDurum) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("siparisler")
    .update({ durum })
    .eq("id", id)
    .select("firma_id")
    .single();
  if (error) throw new Error(error.message);
  revalidateSiparisEffects(data?.firma_id);
}

export async function bulkUpdateDurum(ids: string[], durum: SiparisDurum) {
  if (ids.length === 0) return;
  const supabase = await createClient();
  const { error } = await supabase.from("siparisler").update({ durum }).in("id", ids);
  if (error) throw new Error(error.message);
  revalidateSiparisEffects();
}
