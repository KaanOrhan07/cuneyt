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
  revalidatePath("/dashboard", "layout");
}

export async function updateUrun(id: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("urunler")
    .update({
      ad: formData.get("ad") as string,
      fotograf_url: (formData.get("fotograf_url") as string) || null,
      stok_adet: Number(formData.get("stok_adet") ?? 0),
      ortalama_maliyet: Number(formData.get("ortalama_maliyet") ?? 0),
      satis_fiyati: Number(formData.get("satis_fiyati") ?? 0),
      kritik_stok_esigi: Number(formData.get("kritik_stok_esigi") ?? 0),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/urunler");
  revalidatePath("/dashboard", "layout");
}

export async function deleteUrun(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("urunler")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/urunler");
  revalidatePath("/dashboard", "layout");
}

export async function bulkDeleteUrun(ids: string[]) {
  if (ids.length === 0) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("urunler")
    .update({ deleted_at: new Date().toISOString() })
    .in("id", ids);

  if (error) throw new Error(error.message);
  revalidatePath("/urunler");
  revalidatePath("/dashboard", "layout");
}

export type UrunImportSatiri = {
  ad: string;
  fotograf_url?: string | null;
  stok_adet?: number;
  ortalama_maliyet?: number;
  satis_fiyati?: number;
  kritik_stok_esigi?: number;
};

export async function bulkImportUrunler(rows: UrunImportSatiri[]) {
  const gecerli = rows.filter((r) => r.ad?.trim());
  if (gecerli.length === 0) return { eklenen: 0 };

  const supabase = await createClient();
  const { error } = await supabase.from("urunler").insert(
    gecerli.map((r) => ({
      ad: r.ad.trim(),
      fotograf_url: r.fotograf_url || null,
      stok_adet: r.stok_adet ?? 0,
      ortalama_maliyet: r.ortalama_maliyet ?? 0,
      satis_fiyati: r.satis_fiyati ?? 0,
      kritik_stok_esigi: r.kritik_stok_esigi ?? 0,
    })),
  );

  if (error) throw new Error(error.message);
  revalidatePath("/urunler");
  revalidatePath("/tablolar");
  revalidatePath("/dashboard", "layout");
  return { eklenen: gecerli.length };
}

export async function updateUrunField(
  id: string,
  field: "ad" | "stok_adet" | "ortalama_maliyet" | "satis_fiyati" | "kritik_stok_esigi",
  value: string | number,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("urunler")
    .update({ [field]: value })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/urunler");
  revalidatePath("/dashboard", "layout");
}
