import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge, Button, Panel } from "@/components/ui";
import { TeklifDurumSelect } from "@/components/teklif-durum-select";
import { formatParaBirimi, formatTarihSaat } from "@/lib/format";
import type { Firma, SiparisTip, TeklifDurum } from "@/lib/types";

export async function TeklifDetay({ id, listeYolu }: { id: string; listeYolu: string }) {
  const supabase = await createClient();

  const { data: teklif } = await supabase
    .from("teklifler")
    .select("*, firmalar(id, ad, renk)")
    .eq("id", id)
    .single();

  if (!teklif) notFound();

  const { data: kalemler, error: kalemHata } = await supabase
    .from("teklif_kalemleri")
    .select("id, adet, birim_fiyat, urunler(ad)")
    .eq("teklif_id", id);

  const firma = teklif.firmalar as unknown as Firma;
  const rows = (kalemler ?? []) as unknown as {
    id: string;
    adet: number;
    birim_fiyat: number;
    urunler: { ad: string } | null;
  }[];

  const araToplam = rows.reduce((s, k) => s + k.adet * k.birim_fiyat, 0);
  const kargoBedeli = teklif.kargo_bedeli ?? 0;
  const kdvTutari = (araToplam + kargoBedeli) * ((teklif.kdv_orani ?? 20) / 100);
  const genelToplam = araToplam + kargoBedeli + kdvTutari - (teklif.iskonto ?? 0);
  const paraBirimi = teklif.para_birimi ?? "TL";
  const paraFmt = (n: number) => formatParaBirimi(n, paraBirimi);

  return (
    <div>
      {kalemHata && (
        <p className="mb-4 rounded-lg bg-orange-soft px-3 py-2 text-[12.5px] text-orange">
          Veritabanı güncellemesi (migration) henüz çalıştırılmamış: {kalemHata.message}
        </p>
      )}

      <Link href={listeYolu} className="mb-3 inline-block text-[12.5px] text-text-dim hover:text-text">
        ← Listeye dön
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2.5">
            <h1 className="font-display text-[22px] font-semibold">
              {teklif.teklif_no || "Teklif Detayı"}
            </h1>
            <Badge tip={teklif.tip as SiparisTip} />
          </div>
          <p className="text-[13px] text-text-dim">{formatTarihSaat(teklif.tarih_saat)}</p>
        </div>
        <div className="flex items-center gap-3">
          <TeklifDurumSelect id={teklif.id} durum={teklif.durum as TeklifDurum} />
          <a href={`/api/teklifler/${id}/pdf?dil=tr`} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary">PDF İndir (TR)</Button>
          </a>
          <a href={`/api/teklifler/${id}/pdf?dil=en`} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary">PDF (EN)</Button>
          </a>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3.5">
        <Panel>
          <div className="text-[11px] uppercase tracking-wide text-text-dim">
            {teklif.tip === "alis" ? "Tedarikçi" : "Firma"}
          </div>
          <Link href={`/firmalar/${firma?.id}`} className="mt-1 flex items-center gap-2 font-medium text-green">
            <span className="h-2 w-2 rounded-full" style={{ background: firma?.renk }} />
            {firma?.ad}
          </Link>
        </Panel>
        <Panel>
          <div className="text-[11px] uppercase tracking-wide text-text-dim">Satıcı</div>
          <div className="mt-1 font-medium">{teklif.satici || "—"}</div>
        </Panel>
        <Panel>
          <div className="text-[11px] uppercase tracking-wide text-text-dim">Termin / Nakliye</div>
          <div className="mt-1 font-medium">
            {[teklif.termin, teklif.nakliye].filter(Boolean).join(" · ") || "—"}
          </div>
        </Panel>
      </div>

      <Panel title="Ürün Kalemleri">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-dim">
              <th className="pb-2.5 text-left font-semibold">Ürün</th>
              <th className="pb-2.5 text-right font-semibold">Adet</th>
              <th className="pb-2.5 text-right font-semibold">Birim Fiyat</th>
              <th className="pb-2.5 text-right font-semibold">Tutar</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((k) => (
              <tr key={k.id} className="border-b border-border last:border-0">
                <td className="py-2.5 font-medium">{k.urunler?.ad ?? "—"}</td>
                <td className="py-2.5 text-right font-mono">{k.adet}</td>
                <td className="py-2.5 text-right font-mono">{paraFmt(k.birim_fiyat)}</td>
                <td className="py-2.5 text-right font-mono">{paraFmt(k.adet * k.birim_fiyat)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex flex-col items-end gap-1 text-[13px]">
          <div className="flex w-52 justify-between text-text-dim">
            <span>Ara Toplam</span>
            <span className="font-mono">{paraFmt(araToplam)}</span>
          </div>
          {kargoBedeli > 0 && (
            <div className="flex w-52 justify-between text-text-dim">
              <span>Kargo</span>
              <span className="font-mono">{paraFmt(kargoBedeli)}</span>
            </div>
          )}
          <div className="flex w-52 justify-between text-text-dim">
            <span>KDV (%{teklif.kdv_orani ?? 20})</span>
            <span className="font-mono">{paraFmt(kdvTutari)}</span>
          </div>
          {teklif.iskonto > 0 && (
            <div className="flex w-52 justify-between text-text-dim">
              <span>İskonto</span>
              <span className="font-mono">-{paraFmt(teklif.iskonto)}</span>
            </div>
          )}
          <div className="flex w-52 justify-between border-t border-border pt-1 font-semibold">
            <span>Genel Toplam</span>
            <span className="font-mono">{paraFmt(genelToplam)}</span>
          </div>
        </div>
      </Panel>

      {(teklif.mesaj || teklif.notlar || teklif.odeme_sartlari) && (
        <div className="mt-5 grid grid-cols-1 gap-3.5">
          {teklif.mesaj && (
            <Panel>
              <div className="mb-1 text-[11px] uppercase tracking-wide text-text-dim">Mesaj</div>
              <p className="text-[13px]">{teklif.mesaj}</p>
            </Panel>
          )}
          {teklif.odeme_sartlari && (
            <Panel>
              <div className="mb-1 text-[11px] uppercase tracking-wide text-text-dim">Ödeme Şartları</div>
              <p className="text-[13px]">{teklif.odeme_sartlari}</p>
            </Panel>
          )}
          {teklif.notlar && (
            <Panel>
              <div className="mb-1 text-[11px] uppercase tracking-wide text-text-dim">Alt Not</div>
              <p className="text-[13px]">{teklif.notlar}</p>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}
