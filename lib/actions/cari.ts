"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function yenile(firma_id?: string | null) {
  revalidatePath("/finans");
  if (firma_id) revalidatePath(`/firmalar/${firma_id}`);
}

export async function addCariHareket(formData: FormData) {
  const supabase = await createClient();

  const firma_id = formData.get("firma_id") as string;
  if (!firma_id) throw new Error("Firma seçilmedi.");
  const yon = formData.get("yon") === "verecek" ? "verecek" : "alacak";
  const para_birimi = (formData.get("para_birimi") as string) || "TL";

  const { error } = await supabase.from("cari_hareketler").insert({
    firma_id,
    tarih: (formData.get("tarih") as string) || new Date().toISOString().slice(0, 10),
    fatura_no: (formData.get("fatura_no") as string) || null,
    tutar: Number(formData.get("tutar") ?? 0),
    vade_tarihi: (formData.get("vade_tarihi") as string) || null,
    aciklama: (formData.get("aciklama") as string) || null,
    ...(yon !== "alacak" ? { yon } : {}),
    ...(para_birimi !== "TL" ? { para_birimi } : {}),
  });

  if (error) throw new Error(error.message);
  yenile(firma_id);
}

export async function deleteCariHareket(id: string, firma_id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("cari_hareketler").delete().eq("id", id);
  if (error) throw new Error(error.message);
  yenile(firma_id);
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
  yenile(firma_id);
}

export async function deleteCariOdeme(id: string, firma_id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("cari_odemeler").delete().eq("id", id);
  if (error) throw new Error(error.message);
  yenile(firma_id);
}
