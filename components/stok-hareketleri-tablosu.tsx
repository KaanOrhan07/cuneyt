"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SortableHeader, XL_ROW_NUM, XL_TD, XL_TH, sortRows, type SortDir } from "@/components/tablolar/grid-ui";
import { ExportExcelButton } from "@/components/export-excel-button";
import { formatTarihSaat } from "@/lib/format";
import type { StokYon } from "@/lib/types";

export type StokHareketSatiri = {
  id: string;
  tarih: string;
  urun_ad: string;
  yon: StokYon;
  adet: number;
  firma_ad: string | null;
  firma_id: string | null;
  siparis_tip: "alis" | "satis" | null;
};

type SortKey = "tarih" | "adet";

export function StokHareketleriTablosu({ hareketler }: { hareketler: StokHareketSatiri[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("tarih");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const rows = useMemo(() => sortRows(hareketler, sortKey, sortDir), [hareketler, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const toplamGiris = rows.filter((r) => r.yon === "giris").reduce((s, r) => s + r.adet, 0);
  const toplamCikis = rows.filter((r) => r.yon === "cikis").reduce((s, r) => s + r.adet, 0);

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <ExportExcelButton
          filename="stok-hareketleri"
          sheetName="Stok Hareketleri"
          rows={rows.map((r) => ({
            Tarih: formatTarihSaat(r.tarih),
            Ürün: r.urun_ad,
            Yön: r.yon === "giris" ? "Giriş" : "Çıkış",
            Adet: r.adet,
            Firma: r.firma_ad ?? "—",
          }))}
        />
      </div>

      <div className="max-h-[70vh] overflow-auto rounded-[10px] border border-border">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr>
              <th className={XL_TH}>#</th>
              <th className={XL_TH}>
                <SortableHeader label="Tarih" active={sortKey === "tarih"} direction={sortDir} onClick={() => toggleSort("tarih")} />
              </th>
              <th className={XL_TH}>Ürün</th>
              <th className={XL_TH}>Yön</th>
              <th className={XL_TH}>
                <SortableHeader label="Adet" active={sortKey === "adet"} direction={sortDir} onClick={() => toggleSort("adet")} align="right" />
              </th>
              <th className={XL_TH}>İlgili Firma / Sipariş</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className={i % 2 === 0 ? "bg-card" : "bg-bg-elev"}>
                <td className={XL_ROW_NUM}>{i + 1}</td>
                <td className={`${XL_TD} px-1.5 py-1 font-mono`}>{formatTarihSaat(r.tarih)}</td>
                <td className={`${XL_TD} px-1.5 py-1 font-medium`}>{r.urun_ad}</td>
                <td className={`${XL_TD} px-1.5 py-1`}>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      r.yon === "giris" ? "bg-green-soft text-green" : "bg-orange-soft text-[#C74519]"
                    }`}
                  >
                    {r.yon === "giris" ? "Giriş" : "Çıkış"}
                  </span>
                </td>
                <td className={`${XL_TD} px-1.5 py-1 text-right font-mono`}>{r.adet}</td>
                <td className={`${XL_TD} px-1.5 py-1`}>
                  {r.firma_id ? (
                    <Link href={`/firmalar/${r.firma_id}`} className="text-green hover:underline">
                      {r.firma_ad} ({r.siparis_tip === "alis" ? "Alış" : "Satış"})
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="border border-border px-3 py-4 text-center text-text-dim">
                  Stok hareketi yok.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="bg-bg-elev font-semibold">
                <td className={XL_TD} />
                <td className={`${XL_TD} px-1.5 py-1`} colSpan={3}>
                  Toplam ({rows.length} hareket)
                </td>
                <td className={`${XL_TD} px-1.5 py-1 text-right font-mono`}>
                  +{toplamGiris} / -{toplamCikis}
                </td>
                <td className={XL_TD} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
