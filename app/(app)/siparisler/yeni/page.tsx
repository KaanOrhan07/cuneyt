import { createClient } from "@/lib/supabase/server";
import { SiparisForm } from "@/components/siparis-form";
import type { Firma, Urun } from "@/lib/types";

export default async function YeniSiparisPage() {
  const supabase = await createClient();
  const [{ data: firmalar }, { data: urunler }] = await Promise.all([
    supabase.from("firmalar").select("*").is("deleted_at", null).order("ad"),
    supabase.from("urunler").select("*").is("deleted_at", null).order("ad"),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-[22px] font-semibold">Yeni Sipariş</h1>
        <p className="mt-0.5 text-[13px] text-text-dim">Firma seçin, ürün(ler)i ve adetlerini girin</p>
      </div>
      <SiparisForm firmalar={(firmalar as Firma[]) ?? []} urunler={(urunler as Urun[]) ?? []} />
    </div>
  );
}
