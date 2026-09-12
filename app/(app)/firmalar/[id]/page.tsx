import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Panel, StatusDot } from "@/components/ui";
import { formatTL } from "@/lib/format";
import type { SiparisDurum } from "@/lib/types";

export default async function FirmaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tip?: string }>;
}) {
  const { id } = await params;
  const { tip = "alis" } = await searchParams;
  const supabase = await createClient();

  const { data: firma } = await supabase.from("firmalar").select("*").eq("id", id).single();
  if (!firma) notFound();

  const { data: siparisler } = await supabase
    .from("siparisler")
    .select("id, tip, durum, tarih_saat, siparis_kalemleri(adet, birim_fiyat, urunler(ad))")
    .eq("firma_id", id)
    .eq("tip", tip)
    .order("tarih_saat", { ascending: false });

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span className="h-3 w-3 rounded-full" style={{ background: firma.renk }} />
        <div>
          <h1 className="font-display text-[22px] font-semibold">{firma.ad}</h1>
          <div className="mt-1 flex gap-1.5">
            {firma.is_tedarikci && (
              <span className="rounded-full bg-green-soft px-2 py-0.5 text-[11px] font-medium text-green">
                Tedarikçi
              </span>
            )}
            {firma.is_musteri && (
              <span className="rounded-full bg-orange-soft px-2 py-0.5 text-[11px] font-medium text-[#C74519]">
                Müşteri
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mb-5 flex gap-2">
        <Link
          href={`/firmalar/${id}?tip=alis`}
          className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium ${
            tip === "alis" ? "bg-green text-white" : "border border-border bg-card text-text-dim"
          }`}
        >
          Gelen (Alış)
        </Link>
        <Link
          href={`/firmalar/${id}?tip=satis`}
          className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium ${
            tip === "satis" ? "bg-green text-white" : "border border-border bg-card text-text-dim"
          }`}
        >
          Giden (Satış)
        </Link>
      </div>

      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-dim">
              <th className="pb-2.5 text-left font-semibold">Tarih</th>
              <th className="pb-2.5 text-left font-semibold">Ürünler</th>
              <th className="pb-2.5 text-left font-semibold">Tutar</th>
              <th className="pb-2.5 text-left font-semibold">Durum</th>
            </tr>
          </thead>
          <tbody>
            {siparisler?.map((s) => {
              const kalemler = s.siparis_kalemleri as unknown as {
                adet: number;
                birim_fiyat: number;
                urunler: { ad: string } | null;
              }[];
              const toplam = kalemler.reduce((sum, k) => sum + k.adet * k.birim_fiyat, 0);
              return (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="py-2.5 font-mono">
                    {new Date(s.tarih_saat).toLocaleString("tr-TR")}
                  </td>
                  <td className="py-2.5">
                    {kalemler.map((k) => k.urunler?.ad).join(", ")}
                  </td>
                  <td className="py-2.5 font-mono">{formatTL(toplam)}</td>
                  <td className="py-2.5">
                    <StatusDot durum={s.durum as SiparisDurum} />
                  </td>
                </tr>
              );
            })}
            {siparisler?.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-text-dim">
                  Bu firmaya ait {tip === "alis" ? "gelen" : "giden"} sipariş yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
