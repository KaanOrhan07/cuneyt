"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addFirma(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("firmalar").insert({
    ad: formData.get("ad") as string,
    renk: (formData.get("renk") as string) || "#28694B",
    is_tedarikci: formData.get("is_tedarikci") === "on",
    is_musteri: formData.get("is_musteri") === "on",
  });

  if (error) throw new Error(error.message);
  revalidatePath("/firmalar");
  revalidatePath("/tablolar");
}

export async function deleteFirma(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("firmalar")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/firmalar");
  revalidatePath("/tablolar");
}

export async function bulkDeleteFirma(ids: string[]) {
  if (ids.length === 0) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("firmalar")
    .update({ deleted_at: new Date().toISOString() })
    .in("id", ids);

  if (error) throw new Error(error.message);
  revalidatePath("/firmalar");
  revalidatePath("/tablolar");
}

export async function updateFirmaField(
  id: string,
  field: "ad" | "renk" | "is_tedarikci" | "is_musteri",
  value: string | boolean,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("firmalar")
    .update({ [field]: value })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/firmalar");
  revalidatePath("/tablolar");
}
