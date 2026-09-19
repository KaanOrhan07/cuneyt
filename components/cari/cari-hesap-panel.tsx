import { CariHareketForm } from "./cari-hareket-form";
import { CariHareketRow } from "./cari-hareket-row";
import { Panel, StatCard } from "@/components/ui";
import { formatParaBirimi } from "@/lib/format";
import { istanbulDayKey } from "@/lib/tr-time";
import type { CariHareket, CariOdeme } from "@/lib/types";

function bakiyeMetni(harita: Map<string, number>) {
  const parcalar = [...harita.entries()]
    .filter(([, n]) => n > 0)
    .map(([pb, n]) => formatParaBirimi(n, pb));
  return parcalar.length ? parcalar.join(" + ") : "—";
}

export function CariHesapPanel({
  firmaId,
  hareketler,
  odemelerByHareket,
}: {
  firmaId: string;
  hareketler: CariHareket[];
  odemelerByHareket: Map<string, CariOdeme[]>;
}) {
  const bugun = istanbulDayKey(new Date());
  const alacak = new Map<string, number>();
  const verecek = new Map<string, number>();
  for (const h of hareketler) {
    const odenen = (odemelerByHareket.get(h.id) ?? []).reduce((os, o) => os + o.tutar, 0);
    const hedef = (h.yon ?? "alacak") === "alacak" ? alacak : verecek;
    const pb = h.para_birimi ?? "TL";
    hedef.set(pb, (hedef.get(pb) ?? 0) + (h.tutar - odenen));
  }
  const alacakVar = [...alacak.values()].some((n) => n > 0);

  return (
    <div>
      <div className="mb-4 grid grid-cols-3 gap-3.5">
        <StatCard
          label="Firmanın Bize Borcu (Alacak)"
          value={bakiyeMetni(alacak)}
          valueColor={alacakVar ? "var(--orange)" : undefined}
        />
        <StatCard label="Bizim Firmaya Borcumuz (Verecek)" value={bakiyeMetni(verecek)} />
        <StatCard label="Kayıt Sayısı" value={hareketler.length} />
      </div>

      <div className="mb-4">
        <CariHareketForm firmaId={firmaId} />
      </div>

      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-dim">
              <th className="pb-2.5 text-left font-semibold">Yön</th>
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
                bugun={bugun}
              />
            ))}
            {hareketler.length === 0 && (
              <tr>
                <td colSpan={10} className="py-4 text-text-dim">
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
