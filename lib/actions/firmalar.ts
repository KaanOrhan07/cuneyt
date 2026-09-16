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

export type FirmaImportSatiri = {
  ad: string;
  renk?: string;
  is_tedarikci?: boolean;
  is_musteri?: boolean;
};

export async function bulkImportFirmalar(rows: FirmaImportSatiri[]) {
  const gecerli = rows.filter((r) => r.ad?.trim());
  if (gecerli.length === 0) return { eklenen: 0 };

  const supabase = await createClient();
  const { error } = await supabase.from("firmalar").insert(
    gecerli.map((r) => ({
      ad: r.ad.trim(),
      renk: r.renk || "#28694B",
      is_tedarikci: r.is_tedarikci ?? false,
      is_musteri: r.is_musteri ?? false,
    })),
  );

  if (error) throw new Error(error.message);
  revalidatePath("/firmalar");
  revalidatePath("/tablolar");
  return { eklenen: gecerli.length };
}

export async function updateFirmaField(
  id: string,
  field: "ad" | "renk" | "is_tedarikci" | "is_musteri" | "adres" | "telefon" | "eposta" | "vergi_no",
  value: string | boolean,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("firmalar")
    .update({ [field]: value })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/firmalar");
  revalidatePath(`/firmalar/${id}`);
  revalidatePath("/tablolar");
}
