"use client";

import { EditableCell } from "@/components/tablolar/editable-cell";
import { updateBirimMaliyet, updateTeslimEdilenAdet } from "@/lib/actions/siparisler";
import { formatParaBirimi } from "@/lib/format";
import type { SiparisTip } from "@/lib/types";

export function SiparisKalemSatiri({
  kalemId,
  siparisId,
  urunAd,
  adet,
  birimFiyat,
  birimMaliyet,
  teslimEdilenAdet,
  paraBirimi,
  tip,
}: {
  kalemId: string;
  siparisId: string;
  urunAd: string;
  adet: number;
  birimFiyat: number;
  birimMaliyet: number;
  teslimEdilenAdet: number;
  paraBirimi: string;
  tip: SiparisTip;
}) {
  const kalan = adet - teslimEdilenAdet;
  const fmt = (n: number) => formatParaBirimi(n, paraBirimi);

  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-2.5 font-medium">{urunAd}</td>
      <td className="py-2.5 text-right font-mono">{adet}</td>
      <td className="py-2.5 text-right">
        <EditableCell
          value={teslimEdilenAdet}
          type="number"
          align="right"
          onSave={(v) => updateTeslimEdilenAdet(kalemId, siparisId, Number(v))}
        />
      </td>
      <td className={`py-2.5 text-right font-mono ${kalan > 0 ? "font-semibold text-orange" : "text-green"}`}>
        {kalan}
      </td>
      <td className="py-2.5 text-right font-mono">{fmt(birimFiyat)}</td>
      {tip === "satis" && (
        <td className="py-2.5 text-right font-mono text-text-dim">
          <EditableCell
            value={birimMaliyet}
            type="number"
            align="right"
            onSave={(v) => updateBirimMaliyet(kalemId, siparisId, Number(v))}
          />
        </td>
      )}
      <td className="py-2.5 text-right font-mono">{fmt(adet * birimFiyat)}</td>
    </tr>
  );
}
