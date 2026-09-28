import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TeklifOlusturForm } from "@/components/teklif-olustur-form";
import type { Firma, Urun } from "@/lib/types";

export async function TeklifDuzenleSayfasi({ id, tip }: { id: string; tip: "alis" | "satis" }) {
  const supabase = await createClient();

  const { data: teklif } = await supabase.from("teklifler").select("*").eq("id", id).single();
  if (!teklif) notFound();

  const [{ data: firmalar }, { data: urunler }, { data: kalemler }, { data: sirket }] = await Promise.all([
    supabase.from("firmalar").select("*").is("deleted_at", null).order("ad"),
    supabase.from("urunler").select("*").is("deleted_at", null).order("ad"),
    supabase.from("teklif_kalemleri").select("urun_id, adet, birim_fiyat").eq("teklif_id", id),
    supabase
      .from("sirket_profili")
      .select("ozel_sablon_url, alis_teklif_sablon_url")
      .eq("id", true)
      .maybeSingle(),
  ]);

  const kalemRows = ((kalemler ?? []) as { urun_id: string; adet: number; birim_fiyat: number }[]).map(
    (k) => ({ urun_id: k.urun_id, adet: String(k.adet), birim_fiyat: String(k.birim_fiyat) }),
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-[22px] font-semibold">
          {teklif.teklif_no || "Teklif"} — Düzenle
        </h1>
        <p className="mt-0.5 text-[13px] text-text-dim">
          Alanları düzeltip kaydedin — teklif numarası ve tarih değişmez
        </p>
      </div>
      <TeklifOlusturForm
        firmalar={(firmalar as Firma[]) ?? []}
        urunler={(urunler as Urun[]) ?? []}
        tip={tip}
        sirketSablonVarMi={tip === "alis" ? !!sirket?.alis_teklif_sablon_url : !!sirket?.ozel_sablon_url}
        duzenlemeId={id}
        baslangic={{
          firma_id: teklif.firma_id,
          satici: teklif.satici ?? "",
          termin: teklif.termin ?? "",
          nakliye: teklif.nakliye ?? "",
          teslimat_sekli: teklif.teslimat_sekli ?? "",
          odeme_sartlari: teklif.odeme_sartlari ?? "",
          mesaj: teklif.mesaj ?? "",
          notlar: teklif.notlar ?? "",
          iskonto: String(teklif.iskonto ?? 0),
          kdv_orani: String(teklif.kdv_orani ?? 20),
          para_birimi: teklif.para_birimi ?? "TL",
          kargo_bedeli: String(teklif.kargo_bedeli ?? 0),
          sablon_kullan: teklif.sablon_kullan !== false,
          kalemler: kalemRows.length > 0 ? kalemRows : [{ urun_id: "", adet: "", birim_fiyat: "" }],
        }}
      />
    </div>
  );
}
