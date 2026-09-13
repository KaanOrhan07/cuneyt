import { CariHareketForm } from "./cari-hareket-form";
import { CariHareketRow } from "./cari-hareket-row";
import { Panel, StatCard } from "@/components/ui";
import { formatTL } from "@/lib/format";
import type { CariHareket, CariOdeme } from "@/lib/types";

export function CariHesapPanel({
  firmaId,
  hareketler,
  odemelerByHareket,
}: {
  firmaId: string;
  hareketler: CariHareket[];
  odemelerByHareket: Map<string, CariOdeme[]>;
}) {
  const toplamBorc = hareketler.reduce((s, h) => {
    const odenen = (odemelerByHareket.get(h.id) ?? []).reduce((os, o) => os + o.tutar, 0);
    return s + (h.tutar - odenen);
  }, 0);

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-3.5">
        <StatCard
          label="Toplam Bakiye"
          value={formatTL(toplamBorc)}
          valueColor={toplamBorc > 0 ? "var(--orange)" : undefined}
        />
        <StatCard label="Kayıt Sayısı" value={hareketler.length} />
      </div>

      <div className="mb-4">
        <CariHareketForm firmaId={firmaId} />
      </div>

      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-dim">
              <th className="pb-2.5 text-left font-semibold">Tarih</th>
              <th className="pb-2.5 text-left font-semibold">Fatura No</th>
              <th className="pb-2.5 text-left font-semibold">Açıklama</th>
              <th className="pb-2.5 text-left font-semibold">Tutar</th>
              <th className="pb-2.5 text-left font-semibold">Ödenen</th>
              <th className="pb-2.5 text-left font-semibold">Kalan</th>
              <th className="pb-2.5 text-left font-semibold">Vade</th>
              <th className="pb-2.5 text-left font-semibold">Durum</th>
              <th className="pb-2.5 text-left font-semibold" />
            </tr>
          </thead>
          <tbody>
            {hareketler.map((h) => (
              <CariHareketRow
                key={h.id}
                hareket={h}
                odemeler={odemelerByHareket.get(h.id) ?? []}
                firmaId={firmaId}
              />
            ))}
            {hareketler.length === 0 && (
              <tr>
                <td colSpan={9} className="py-4 text-text-dim">
                  Bu firmaya ait cari hareket yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
