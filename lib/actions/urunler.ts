"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addUrun(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("urunler").insert({
    ad: formData.get("ad") as string,
    fotograf_url: (formData.get("fotograf_url") as string) || null,
    stok_adet: Number(formData.get("stok_adet") ?? 0),
    ortalama_maliyet: Number(formData.get("ortalama_maliyet") ?? 0),
    satis_fiyati: Number(formData.get("satis_fiyati") ?? 0),
    kritik_stok_esigi: Number(formData.get("kritik_stok_esigi") ?? 0),
  });

  if (error) throw new Error(error.message);
  revalidatePath("/urunler");
}

export async function deleteUrun(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("urunler")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/urunler");
}
