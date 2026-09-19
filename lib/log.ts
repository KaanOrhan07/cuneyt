import { createClient } from "@/lib/supabase/server";

/**
 * Veritabanı tetikleyicilerinin yakalamadığı uygulama olaylarını (ör. yedek indirme/yükleme)
 * işlem kayıtlarına yazar. Log yazılamazsa asıl işlemi bozmaz.
 */
export async function logla(modul: string, islem: string, baslik: string | null, detay?: Record<string, unknown>) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: ekip } = await supabase
      .from("ekip_uyeleri")
      .select("ad_soyad")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    await supabase.from("islem_kayitlari").insert({
      kullanici_id: user.id,
      kullanici_ad: ekip?.ad_soyad ?? user.email ?? null,
      modul,
      islem,
      baslik,
      detay: detay ?? null,
    });
  } catch {
    // log yazılamadıysa sessizce geç
  }
}
