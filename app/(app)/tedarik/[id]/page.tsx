import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button, Panel } from "@/components/ui";
import { SatinAlmaDurumSelect } from "@/components/satin-alma-durum-select";
import { formatParaBirimi, formatTarih } from "@/lib/format";
import type { Firma, SatinAlmaDurum } from "@/lib/types";

export default async function SatinAlmaDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: po } = await supabase
    .from("satin_almalar")
    .select("*, firmalar(id, ad, renk)")
    .eq("id", id)
    .single();
  if (!po) notFound();

  const { data: kalemler } = await supabase
    .from("satin_alma_kalemleri")
    .select("*")
    .eq("satin_alma_id", id)
    .order("sira");

  const firma = po.firmalar as unknown as Firma;
  const rows = (kalemler ?? []) as {
    id: string;
    adet: number;
    aciklama: string;
    termin: string | null;
    birim_fiyat: number;
  }[];

  const araToplam = rows.reduce((s, k) => s + k.adet * k.birim_fiyat, 0);
  const kdvTutari = araToplam * ((po.kdv_orani ?? 0) / 100);
  const kargo = po.kargo_bedeli ?? 0;
  const genelToplam = araToplam + kdvTutari + kargo;
  const fmt = (n: number) => formatParaBirimi(n, po.para_birimi);

  const bilgiler: [string, string | null][] = [
    ["İlgili Kişi", po.iletisim],
    ["Teslimat", po.teslimat],
    ["Nakliye", po.nakliye],
    ["Termin", po.termin],
    ["Ödeme Şartları", po.odeme_sartlari],
    ["Teklif Ref.", po.teklif_ref],
  ];

  return (
    <div>
      <Link href="/tedarik" className="mb-3 inline-block text-[12.5px] text-text-dim hover:text-text">
        ← Listeye dön
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-[22px] font-semibold">Satın Alma Siparişi {po.po_no ?? ""}</h1>
          <p className="text-[13px] text-text-dim">{formatTarih(po.tarih)}</p>
        </div>
        <div className="flex items-center gap-3">
          <SatinAlmaDurumSelect id={po.id} durum={po.durum as SatinAlmaDurum} />
          <a href={`/api/tedarik/${id}/pdf?dil=en`} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary">PDF (EN)</Button>
          </a>
          <a href={`/api/tedarik/${id}/pdf?dil=tr`} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary">PDF İndir (TR)</Button>
          </a>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3.5">
        <Panel>
          <div className="text-[11px] uppercase tracking-wide text-text-dim">Tedarikçi</div>
          <Link href={`/firmalar/${firma?.id}`} className="mt-1 flex items-center gap-2 font-medium text-green">
            <span className="h-2 w-2 rounded-full" style={{ background: firma?.renk }} />
            {firma?.ad}
          </Link>
        </Panel>
        {bilgiler.map(([et, val]) => (
          <Panel key={et}>
            <div className="text-[11px] uppercase tracking-wide text-text-dim">{et}</div>
            <div className="mt-1 font-medium">{val || "—"}</div>
          </Panel>
        ))}
      </div>

      <Panel title="Sipariş Kalemleri">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-dim">
              <th className="pb-2.5 text-left font-semibold">Adet</th>
              <th className="pb-2.5 text-left font-semibold">Açıklama</th>
              <th className="pb-2.5 text-left font-semibold">Termin</th>
              <th className="pb-2.5 text-right font-semibold">Birim Fiyat</th>
              <th className="pb-2.5 text-right font-semibold">Toplam</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((k) => (
              <tr key={k.id} className="border-b border-border last:border-0">
                <td className="py-2.5 font-mono font-semibold">{k.adet}</td>
                <td className="whitespace-pre-line py-2.5">{k.aciklama}</td>
                <td className="py-2.5 text-text-dim">{k.termin || "—"}</td>
                <td className="py-2.5 text-right font-mono">{fmt(k.birim_fiyat)}</td>
                <td className="py-2.5 text-right font-mono">{fmt(k.adet * k.birim_fiyat)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex flex-col items-end gap-1 text-[13px]">
          <div className="flex w-52 justify-between text-text-dim">
            <span>Ara Toplam</span>
            <span className="font-mono">{fmt(araToplam)}</span>
          </div>
          <div className="flex w-52 justify-between text-text-dim">
            <span>KDV (%{po.kdv_orani ?? 0})</span>
            <span className="font-mono">{fmt(kdvTutari)}</span>
          </div>
          {(kargo > 0 || po.kargo_notu) && (
            <div className="flex w-52 justify-between text-text-dim">
              <span>Kargo</span>
              <span className="font-mono">{kargo > 0 ? fmt(kargo) : po.kargo_notu}</span>
            </div>
          )}
          <div className="flex w-52 justify-between border-t border-border pt-1 font-semibold">
            <span>Genel Toplam</span>
            <span className="font-mono">{fmt(genelToplam)}</span>
          </div>
        </div>
      </Panel>

      {(po.mesaj || po.notlar) && (
        <div className="mt-5 grid gap-3.5">
          {po.mesaj && (
            <Panel>
              <div className="mb-1 text-[11px] uppercase tracking-wide text-text-dim">Ek Mesaj</div>
              <p className="whitespace-pre-line text-[13px]">{po.mesaj}</p>
            </Panel>
          )}
          {po.notlar && (
            <Panel>
              <div className="mb-1 text-[11px] uppercase tracking-wide text-text-dim">Alt Not</div>
              <p className="whitespace-pre-line text-[13px]">{po.notlar}</p>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}
