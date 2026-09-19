"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addGider(formData: FormData) {
  const supabase = await createClient();

  const aciklama = ((formData.get("aciklama") as string) ?? "").trim();
  const tutar = Number(formData.get("tutar") ?? 0);
  if (!aciklama) throw new Error("Açıklama zorunludur.");
  if (!(tutar > 0)) throw new Error("Tutar sıfırdan büyük olmalı.");

  const { error } = await supabase.from("giderler").insert({
    tarih: (formData.get("tarih") as string) || new Date().toISOString().slice(0, 10),
    kategori: ((formData.get("kategori") as string) || "").trim() || null,
    aciklama,
    tutar,
    para_birimi: (formData.get("para_birimi") as string) || "TL",
  });

  if (error) throw new Error(error.message);
  revalidatePath("/finans");
}

export async function deleteGider(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("giderler").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/finans");
}
