import { createClient } from "@/lib/supabase/server";
import { SatinAlmaForm } from "@/components/satin-alma-form";
import { istanbulDayKey } from "@/lib/tr-time";
import type { Firma } from "@/lib/types";

export default async function YeniSatinAlmaPage({
  searchParams,
}: {
  searchParams: Promise<{ firma_id?: string }>;
}) {
  const { firma_id } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: firmalar }, { data: mevcut }, { data: ekip }] = await Promise.all([
    supabase.from("firmalar").select("*").is("deleted_at", null).order("ad"),
    supabase.from("satin_almalar").select("po_no"),
    user
      ? supabase.from("ekip_uyeleri").select("ad_soyad").eq("auth_user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const sayilar = (mevcut ?? [])
    .map((m) => parseInt(String(m.po_no ?? ""), 10))
    .filter((n) => Number.isFinite(n));
  const onerilenPoNo = String(sayilar.length ? Math.max(...sayilar) + 1 : 1001);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-[22px] font-semibold">Yeni Satın Alma Siparişi</h1>
        <p className="mt-0.5 text-[13px] text-text-dim">
          Tedarikçiye gönderilecek sipariş formu — kalemleri serbest yazın, PDF Türkçe veya İngilizce indirilir
        </p>
      </div>
      <SatinAlmaForm
        firmalar={(firmalar as Firma[]) ?? []}
        varsayilanFirmaId={firma_id}
        varsayilanTarih={istanbulDayKey(new Date())}
        onerilenPoNo={onerilenPoNo}
        varsayilanIletisim={ekip?.ad_soyad ?? ""}
      />
    </div>
  );
}
