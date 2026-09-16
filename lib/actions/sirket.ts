"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "sirket-varliklari";

async function girisYapmisMi() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Yetkisiz erişim");
}

export async function updateSirketProfili(formData: FormData) {
  await girisYapmisMi();
  const supabase = await createClient();

  const { error } = await supabase.from("sirket_profili").upsert({
    id: true,
    sirket_adi: (formData.get("sirket_adi") as string) || null,
    adres: (formData.get("adres") as string) || null,
    telefon: (formData.get("telefon") as string) || null,
    eposta: (formData.get("eposta") as string) || null,
    vergi_no: (formData.get("vergi_no") as string) || null,
    banka_bilgisi: (formData.get("banka_bilgisi") as string) || null,
    varsayilan_notlar: (formData.get("varsayilan_notlar") as string) || null,
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
  revalidatePath("/biz");
}

export async function uploadLogo(formData: FormData) {
  await girisYapmisMi();
  const file = formData.get("logo") as File | null;
  if (!file || file.size === 0) throw new Error("Dosya seçilmedi.");
  if (!file.type.startsWith("image/")) throw new Error("Logo bir resim dosyası olmalı.");

  const admin = createAdminClient();
  const uzanti = file.name.split(".").pop() || "png";
  const yol = `logo.${uzanti}`;

  const { error: yuklemeHata } = await admin.storage
    .from(BUCKET)
    .upload(yol, file, { upsert: true, contentType: file.type });
  if (yuklemeHata) throw new Error(yuklemeHata.message);

  const { data: publicUrl } = admin.storage.from(BUCKET).getPublicUrl(yol);
  const supabase = await createClient();
  const { error } = await supabase.from("sirket_profili").upsert({
    id: true,
    logo_url: `${publicUrl.publicUrl}?v=${Date.now()}`,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/biz");
}

export async function removeLogo() {
  await girisYapmisMi();
  const supabase = await createClient();
  const { error } = await supabase
    .from("sirket_profili")
    .upsert({ id: true, logo_url: null, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  revalidatePath("/biz");
}

export async function uploadOzelSablon(formData: FormData) {
  await girisYapmisMi();
  const file = formData.get("sablon") as File | null;
  if (!file || file.size === 0) throw new Error("Dosya seçilmedi.");
  if (file.type !== "application/pdf") throw new Error("Şablon bir PDF dosyası olmalı.");

  const admin = createAdminClient();
  const yol = `ozel-sablon.pdf`;

  const { error: yuklemeHata } = await admin.storage
    .from(BUCKET)
    .upload(yol, file, { upsert: true, contentType: "application/pdf" });
  if (yuklemeHata) throw new Error(yuklemeHata.message);

  const { data: publicUrl } = admin.storage.from(BUCKET).getPublicUrl(yol);
  const supabase = await createClient();
  const { error } = await supabase.from("sirket_profili").upsert({
    id: true,
    ozel_sablon_url: `${publicUrl.publicUrl}?v=${Date.now()}`,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/biz");
}

export async function removeOzelSablon() {
  await girisYapmisMi();
  const supabase = await createClient();
  const { error } = await supabase
    .from("sirket_profili")
    .upsert({ id: true, ozel_sablon_url: null, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  revalidatePath("/biz");
}
