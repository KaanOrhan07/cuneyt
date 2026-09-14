"use client";

import { EditableCell } from "@/components/tablolar/editable-cell";
import { updateTeslimEdilenAdet } from "@/lib/actions/siparisler";
import { formatTL } from "@/lib/format";

export function SiparisKalemSatiri({
  kalemId,
  siparisId,
  urunAd,
  adet,
  birimFiyat,
  teslimEdilenAdet,
}: {
  kalemId: string;
  siparisId: string;
  urunAd: string;
  adet: number;
  birimFiyat: number;
  teslimEdilenAdet: number;
}) {
  const kalan = adet - teslimEdilenAdet;

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
      <td className="py-2.5 text-right font-mono">{formatTL(birimFiyat)}</td>
      <td className="py-2.5 text-right font-mono">{formatTL(adet * birimFiyat)}</td>
    </tr>
  );
}
