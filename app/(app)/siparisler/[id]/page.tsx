import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge, Button, Panel, StatusDot } from "@/components/ui";
import { DurumSelect } from "@/components/durum-select";
import { SiparisKalemSatiri } from "@/components/siparis-kalem-satiri";
import { formatTL, formatTarih, formatTarihSaat } from "@/lib/format";
import type { Firma, SiparisDurum, SiparisTip } from "@/lib/types";

export default async function SiparisDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: siparis } = await supabase
    .from("siparisler")
    .select("*, firmalar(id, ad, renk)")
    .eq("id", id)
    .single();

  if (!siparis) notFound();

  const { data: kalemler, error: kalemHata } = await supabase
    .from("siparis_kalemleri")
    .select("id, adet, birim_fiyat, teslim_edilen_adet, urunler(ad)")
    .eq("siparis_id", id);

  const firma = siparis.firmalar as unknown as Firma;
  const rows = (kalemler ?? []) as unknown as {
    id: string;
    adet: number;
    birim_fiyat: number;
    teslim_edilen_adet: number;
    urunler: { ad: string } | null;
  }[];

  const araToplam = rows.reduce((s, k) => s + k.adet * k.birim_fiyat, 0);
  const kdvTutari = araToplam * (siparis.kdv_orani / 100);
  const genelToplam = araToplam + kdvTutari;

  return (
    <div>
      {kalemHata && (
        <p className="mb-4 rounded-lg bg-orange-soft px-3 py-2 text-[12.5px] text-orange">
          Veritabanı güncellemesi (migration) henüz çalıştırılmamış: {kalemHata.message}
        </p>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2.5">
            <h1 className="font-display text-[22px] font-semibold">
              {siparis.siparis_no || "Sipariş Detayı"}
            </h1>
            <Badge tip={siparis.tip as SiparisTip} />
          </div>
          <p className="text-[13px] text-text-dim">{formatTarihSaat(siparis.tarih_saat)}</p>
        </div>
        <div className="flex items-center gap-3">
          <DurumSelect id={siparis.id} durum={siparis.durum as SiparisDurum} />
          <a href={`/api/siparisler/${id}/pdf`} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary">PDF İndir</Button>
          </a>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3.5">
        <Panel>
          <div className="text-[11px] uppercase tracking-wide text-text-dim">Firma</div>
          <Link href={`/firmalar/${firma?.id}`} className="mt-1 flex items-center gap-2 font-medium text-green">
            <span className="h-2 w-2 rounded-full" style={{ background: firma?.renk }} />
            {firma?.ad}
          </Link>
        </Panel>
        <Panel>
          <div className="text-[11px] uppercase tracking-wide text-text-dim">Son Teslim Tarihi</div>
          <div className="mt-1 font-medium">
            {siparis.son_teslim_tarihi ? formatTarih(siparis.son_teslim_tarihi) : "Belirtilmemiş"}
          </div>
        </Panel>
        <Panel>
          <div className="text-[11px] uppercase tracking-wide text-text-dim">Durum</div>
          <div className="mt-1">
            <StatusDot durum={siparis.durum as SiparisDurum} />
          </div>
        </Panel>
      </div>

      <Panel title="Ürün Kalemleri">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-dim">
              <th className="pb-2.5 text-left font-semibold">Ürün</th>
              <th className="pb-2.5 text-right font-semibold">İstenen</th>
              <th className="pb-2.5 text-right font-semibold">Teslim Edilen</th>
              <th className="pb-2.5 text-right font-semibold">Kalan</th>
              <th className="pb-2.5 text-right font-semibold">Birim Fiyat</th>
              <th className="pb-2.5 text-right font-semibold">Tutar</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((k) => (
              <SiparisKalemSatiri
                key={k.id}
                kalemId={k.id}
                siparisId={id}
                urunAd={k.urunler?.ad ?? "—"}
                adet={k.adet}
                birimFiyat={k.birim_fiyat}
                teslimEdilenAdet={k.teslim_edilen_adet}
              />
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex flex-col items-end gap-1 text-[13px]">
          <div className="flex w-48 justify-between text-text-dim">
            <span>Ara Toplam</span>
            <span className="font-mono">{formatTL(araToplam)}</span>
          </div>
          <div className="flex w-48 justify-between text-text-dim">
            <span>KDV (%{siparis.kdv_orani})</span>
            <span className="font-mono">{formatTL(kdvTutari)}</span>
          </div>
          <div className="flex w-48 justify-between border-t border-border pt-1 font-semibold">
            <span>Genel Toplam</span>
            <span className="font-mono">{formatTL(genelToplam)}</span>
          </div>
        </div>

        <p className="mt-3 text-[11.5px] text-text-dim">
          İpucu: &quot;Teslim Edilen&quot; hücresine çift tıklayarak kısmi teslimat miktarını girebilirsiniz.
        </p>
      </Panel>
    </div>
  );
}
