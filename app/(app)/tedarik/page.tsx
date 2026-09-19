import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button, Panel, Select } from "@/components/ui";
import { SatinAlmaDurumSelect } from "@/components/satin-alma-durum-select";
import { formatParaBirimi, formatTarih } from "@/lib/format";
import { SATIN_ALMA_DURUM_LABEL, type Firma, type SatinAlmaDurum } from "@/lib/types";

type Filtre = { firma_id?: string; durum?: string };

export default async function TedarikPage({ searchParams }: { searchParams: Promise<Filtre> }) {
  const filtre = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("satin_almalar")
    .select("*, firmalar(id, ad, renk), satin_alma_kalemleri(adet, aciklama, birim_fiyat)")
    .order("tarih", { ascending: false })
    .order("created_at", { ascending: false });
  if (filtre.firma_id) query = query.eq("firma_id", filtre.firma_id);
  if (filtre.durum) query = query.eq("durum", filtre.durum);

  const { data: siparisler, error: hata } = await query;
  const { data: firmalar } = await supabase
    .from("firmalar")
    .select("*")
    .is("deleted_at", null)
    .order("ad");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-[22px] font-semibold">Tedarik</h1>
          <p className="mt-0.5 text-[13px] text-text-dim">
            Tedarikçilere verdiğiniz satın alma siparişleri (Purchase Order)
          </p>
        </div>
        <Link href="/tedarik/yeni">
          <Button>+ Yeni Satın Alma Siparişi</Button>
        </Link>
      </div>

      {hata && (
        <p className="mb-4 rounded-lg bg-orange-soft px-3 py-2 text-[12.5px] text-orange">
          Veritabanı güncellemesi (migration) henüz çalıştırılmamış: {hata.message}
        </p>
      )}

      <form className="mb-5 flex flex-wrap gap-2.5">
        <Select name="firma_id" defaultValue={filtre.firma_id ?? ""}>
          <option value="">Tüm Tedarikçiler</option>
          {(firmalar as Firma[] | null)?.map((f) => (
            <option key={f.id} value={f.id}>
              {f.ad}
            </option>
          ))}
        </Select>
        <Select name="durum" defaultValue={filtre.durum ?? ""}>
          <option value="">Tüm Durumlar</option>
          {(Object.keys(SATIN_ALMA_DURUM_LABEL) as SatinAlmaDurum[]).map((d) => (
            <option key={d} value={d}>
              {SATIN_ALMA_DURUM_LABEL[d]}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="secondary">
          Filtrele
        </Button>
      </form>

      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-dim">
              <th className="pb-2.5 text-left font-semibold">PO No</th>
              <th className="pb-2.5 text-left font-semibold">Tarih</th>
              <th className="pb-2.5 text-left font-semibold">Tedarikçi</th>
              <th className="pb-2.5 text-left font-semibold">Kalemler</th>
              <th className="pb-2.5 text-left font-semibold">Toplam</th>
              <th className="pb-2.5 text-left font-semibold">Durum</th>
            </tr>
          </thead>
          <tbody>
            {siparisler?.map((s) => {
              const firma = s.firmalar as unknown as Firma | null;
              const kalemler = (s.satin_alma_kalemleri ?? []) as {
                adet: number;
                aciklama: string;
                birim_fiyat: number;
              }[];
              const ara = kalemler.reduce((t, k) => t + k.adet * k.birim_fiyat, 0);
              const toplam = ara + ara * ((s.kdv_orani ?? 0) / 100) + (s.kargo_bedeli ?? 0);
              return (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="py-2.5">
                    <Link href={`/tedarik/${s.id}`} className="font-medium text-green hover:underline">
                      {s.po_no || "Detay →"}
                    </Link>
                  </td>
                  <td className="py-2.5 font-mono">{formatTarih(s.tarih)}</td>
                  <td className="py-2.5">
                    <Link href={`/firmalar/${firma?.id}`} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: firma?.renk }} />
                      {firma?.ad}
                    </Link>
                  </td>
                  <td className="max-w-[260px] truncate py-2.5 text-text-dim">
                    {kalemler.map((k) => `${k.adet}× ${k.aciklama}`).join(", ")}
                  </td>
                  <td className="py-2.5 font-mono">{formatParaBirimi(toplam, s.para_birimi)}</td>
                  <td className="py-2.5">
                    <SatinAlmaDurumSelect id={s.id} durum={s.durum as SatinAlmaDurum} />
                  </td>
                </tr>
              );
            })}
            {siparisler?.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-text-dim">
                  Henüz satın alma siparişi yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
