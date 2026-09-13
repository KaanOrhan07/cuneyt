"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addCariHareket(formData: FormData) {
  const supabase = await createClient();

  const firma_id = formData.get("firma_id") as string;
  const { error } = await supabase.from("cari_hareketler").insert({
    firma_id,
    tarih: (formData.get("tarih") as string) || new Date().toISOString().slice(0, 10),
    fatura_no: (formData.get("fatura_no") as string) || null,
    tutar: Number(formData.get("tutar") ?? 0),
    vade_tarihi: (formData.get("vade_tarihi") as string) || null,
    aciklama: (formData.get("aciklama") as string) || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/firmalar/${firma_id}`);
}

export async function deleteCariHareket(id: string, firma_id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("cari_hareketler").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/firmalar/${firma_id}`);
}

export async function addCariOdeme(formData: FormData) {
  const supabase = await createClient();

  const cari_hareket_id = formData.get("cari_hareket_id") as string;
  const firma_id = formData.get("firma_id") as string;

  const { error } = await supabase.from("cari_odemeler").insert({
    cari_hareket_id,
    tarih: (formData.get("tarih") as string) || new Date().toISOString().slice(0, 10),
    tutar: Number(formData.get("tutar") ?? 0),
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/firmalar/${firma_id}`);
}

export async function deleteCariOdeme(id: string, firma_id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("cari_odemeler").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/firmalar/${firma_id}`);
}
