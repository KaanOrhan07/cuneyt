import { createClient } from "@/lib/supabase/server";
import { TablolarClient } from "@/components/tablolar/tablolar-client";
import type { SiparisSatiri } from "@/components/tablolar/siparisler-tablosu";
import type { Firma, SiparisDurum, SiparisTip, Urun } from "@/lib/types";

export default async function TablolarPage() {
  const supabase = await createClient();

  const [{ data: siparisRows }, { data: urunler }, { data: firmalar }] = await Promise.all([
    supabase
      .from("siparisler")
      .select(
        "id, tip, durum, tarih_saat, firmalar(ad), siparis_kalemleri(adet, birim_fiyat, urunler(ad))",
      )
      .order("tarih_saat", { ascending: false }),
    supabase.from("urunler").select("*").is("deleted_at", null).order("ad"),
    supabase.from("firmalar").select("*").is("deleted_at", null).order("ad"),
  ]);

  type Kalem = { adet: number; birim_fiyat: number; urunler: { ad: string } | null };

  const siparisler: SiparisSatiri[] = (siparisRows ?? []).map((s) => {
    const kalemler = s.siparis_kalemleri as unknown as Kalem[];
    const firma = s.firmalar as unknown as { ad: string } | null;
    return {
      id: s.id,
      tarih_saat: s.tarih_saat,
      tip: s.tip as SiparisTip,
      durum: s.durum as SiparisDurum,
      firma_ad: firma?.ad ?? "—",
      urunler_ad: kalemler.map((k) => k.urunler?.ad).filter(Boolean).join(", "),
      tutar: kalemler.reduce((sum, k) => sum + k.adet * k.birim_fiyat, 0),
    };
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-[22px] font-semibold">Tablolar</h1>
        <p className="mt-0.5 text-[13px] text-text-dim">
          Excel benzeri düzenlenebilir tablo görünümü
        </p>
      </div>

      <TablolarClient
        siparisler={siparisler}
        urunler={(urunler as Urun[]) ?? []}
        firmalar={(firmalar as Firma[]) ?? []}
      />
    </div>
  );
}
