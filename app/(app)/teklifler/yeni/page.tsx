import { createClient } from "@/lib/supabase/server";
import { TeklifOlusturForm } from "@/components/teklif-olustur-form";
import type { Firma, Urun } from "@/lib/types";

export default async function YeniTeklifPage({
  searchParams,
}: {
  searchParams: Promise<{ firma_id?: string }>;
}) {
  const { firma_id } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: firmalar }, { data: urunler }, { data: ekip }, { data: sirket }] = await Promise.all([
    supabase.from("firmalar").select("*").is("deleted_at", null).order("ad"),
    supabase.from("urunler").select("*").is("deleted_at", null).order("ad"),
    user
      ? supabase.from("ekip_uyeleri").select("ad_soyad").eq("auth_user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("sirket_profili").select("varsayilan_notlar, ozel_sablon_url").eq("id", true).maybeSingle(),
  ]);

  const varsayilanSatici = ekip?.ad_soyad ?? user?.email ?? "";

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-[22px] font-semibold">Yeni Teklif</h1>
        <p className="mt-0.5 text-[13px] text-text-dim">
          Firma seçin, ürün(ler)i ve adetlerini girin — kaydettiğinizde indirilebilir PDF oluşur
        </p>
      </div>
      <TeklifOlusturForm
        firmalar={(firmalar as Firma[]) ?? []}
        urunler={(urunler as Urun[]) ?? []}
        varsayilanFirmaId={firma_id}
        varsayilanSatici={varsayilanSatici}
        varsayilanNotlar={sirket?.varsayilan_notlar ?? ""}
        sirketSablonVarMi={!!sirket?.ozel_sablon_url}
      />
    </div>
  );
}
