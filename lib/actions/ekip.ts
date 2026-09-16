"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type EkipState = { error?: string } | undefined;

export async function ekipUyesiEkle(
  _prevState: EkipState,
  formData: FormData,
): Promise<EkipState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Yetkisiz erişim" };

  const ad_soyad = (formData.get("ad_soyad") as string)?.trim();
  const eposta = (formData.get("eposta") as string)?.trim();
  const sifre = formData.get("sifre") as string;

  if (!ad_soyad || !eposta || !sifre) {
    return { error: "Ad soyad, e-posta ve şifre zorunludur." };
  }
  if (sifre.length < 6) {
    return { error: "Şifre en az 6 karakter olmalı." };
  }

  const admin = createAdminClient();
  const { data: yeniKullanici, error: olusturmaHata } = await admin.auth.admin.createUser({
    email: eposta,
    password: sifre,
    email_confirm: true,
  });

  if (olusturmaHata || !yeniKullanici.user) {
    return { error: olusturmaHata?.message ?? "Kullanıcı oluşturulamadı." };
  }

  const { error: kayitHata } = await supabase.from("ekip_uyeleri").insert({
    auth_user_id: yeniKullanici.user.id,
    ad_soyad,
    eposta,
  });

  if (kayitHata) {
    await admin.auth.admin.deleteUser(yeniKullanici.user.id);
    return { error: kayitHata.message };
  }

  revalidatePath("/biz");
  return undefined;
}

export async function ekipUyesiSil(id: string, authUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Yetkisiz erişim");
  if (user.id === authUserId) throw new Error("Kendi hesabınızı buradan silemezsiniz.");

  const { error } = await supabase.from("ekip_uyeleri").delete().eq("id", id);
  if (error) throw new Error(error.message);

  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(authUserId);

  revalidatePath("/biz");
}
