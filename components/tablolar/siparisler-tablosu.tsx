"use client";

import { useMemo, useState } from "react";
import { BulkBar, SortableHeader, XL_ROW_NUM, XL_TD, XL_TH, sortRows, type SortDir } from "./grid-ui";
import { ExportExcelButton } from "@/components/export-excel-button";
import { DurumSelect } from "@/components/durum-select";
import { Badge } from "@/components/ui";
import { bulkDeleteSiparis, bulkUpdateDurum } from "@/lib/actions/siparisler";
import { formatTL, formatTarihSaat } from "@/lib/format";
import { DURUM_LABEL, type SiparisDurum, type SiparisTip } from "@/lib/types";

export type SiparisSatiri = {
  id: string;
  tarih_saat: string;
  tip: SiparisTip;
  durum: SiparisDurum;
  firma_ad: string;
  urunler_ad: string;
  tutar: number;
};

type SortKey = "tarih_saat" | "tutar";

export function SiparislerTablosu({ siparisler }: { siparisler: SiparisSatiri[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("tarih_saat");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hata, setHata] = useState<string | null>(null);

  const rows = useMemo(() => sortRows(siparisler, sortKey, sortDir), [siparisler, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function toggleRow(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const toplamTutar = rows.reduce((s, r) => s + r.tutar, 0);

  return (
    <div>
      {hata && (
        <p className="mb-2 rounded-lg bg-orange-soft px-3 py-2 text-[12.5px] text-orange">{hata}</p>
      )}
      <BulkBar count={selected.size} onClear={() => setSelected(new Set())}>
        {(["beklemede", "yolda", "teslim_edildi", "iptal_edildi"] as SiparisDurum[]).map((d) => (
          <button
            key={d}
            onClick={async () => {
              if (d === "iptal_edildi" && !confirm(`${selected.size} siparişi iptal etmek istediğinize emin misiniz?`)) {
                return;
              }
              await bulkUpdateDurum([...selected], d);
              setSelected(new Set());
            }}
            className="rounded-md border border-border bg-card px-2.5 py-1 text-[12px] font-medium hover:bg-bg-elev"
          >
            {DURUM_LABEL[d]} yap
          </button>
        ))}
        <button
          onClick={async () => {
            if (
              !confirm(
                `${selected.size} siparişi KALICI olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
              )
            ) {
              return;
            }
            setHata(null);
            try {
              await bulkDeleteSiparis([...selected]);
              setSelected(new Set());
            } catch (err) {
              setHata(err instanceof Error ? err.message : "Silme işlemi başarısız oldu.");
            }
          }}
          className="rounded-md border border-orange px-2.5 py-1 text-[12px] font-medium text-orange hover:bg-orange-soft"
        >
          Kalıcı Sil
        </button>
      </BulkBar>

      <div className="mb-2 flex justify-end">
        <ExportExcelButton
          filename="siparisler"
          sheetName="Siparişler"
          rows={rows.map((r) => ({
            Tarih: formatTarihSaat(r.tarih_saat),
            Firma: r.firma_ad,
            Tip: r.tip === "alis" ? "Alış" : "Satış",
            Ürünler: r.urunler_ad,
            Tutar: r.tutar,
            Durum: DURUM_LABEL[r.durum],
          }))}
        />
      </div>

      <div className="max-h-[70vh] overflow-auto rounded-[10px] border border-border">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr>
              <th className={XL_TH}>
                <input
                  type="checkbox"
                  checked={selected.size === rows.length && rows.length > 0}
                  onChange={(e) =>
                    setSelected(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())
                  }
                />
              </th>
              <th className={XL_TH}>#</th>
              <th className={XL_TH}>
                <SortableHeader label="Tarih" active={sortKey === "tarih_saat"} direction={sortDir} onClick={() => toggleSort("tarih_saat")} />
              </th>
              <th className={XL_TH}>Firma</th>
              <th className={XL_TH}>Tip</th>
              <th className={XL_TH}>Ürünler</th>
              <th className={XL_TH}>
                <SortableHeader label="Tutar" active={sortKey === "tutar"} direction={sortDir} onClick={() => toggleSort("tutar")} align="right" />
              </th>
              <th className={XL_TH}>Durum</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className={i % 2 === 0 ? "bg-card" : "bg-bg-elev"}>
                <td className={XL_TD}>
                  <div className="flex items-center justify-center py-1">
                    <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleRow(r.id)} />
                  </div>
                </td>
                <td className={XL_ROW_NUM}>{i + 1}</td>
                <td className={`${XL_TD} px-1.5 py-1 font-mono`}>{formatTarihSaat(r.tarih_saat)}</td>
                <td className={`${XL_TD} px-1.5 py-1`}>{r.firma_ad}</td>
                <td className={`${XL_TD} px-1.5 py-1`}>
                  <Badge tip={r.tip} />
                </td>
                <td className={`${XL_TD} px-1.5 py-1`}>{r.urunler_ad}</td>
                <td className={`${XL_TD} px-1.5 py-1 text-right font-mono`}>{formatTL(r.tutar)}</td>
                <td className={`${XL_TD} px-1.5 py-1`}>
                  <DurumSelect id={r.id} durum={r.durum} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="border border-border px-3 py-4 text-center text-text-dim">
                  Sipariş yok.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="bg-bg-elev font-semibold">
                <td className={XL_TD} />
                <td className={XL_TD} />
                <td className={`${XL_TD} px-1.5 py-1`} colSpan={4}>
                  Toplam ({rows.length} sipariş)
                </td>
                <td className={`${XL_TD} px-1.5 py-1 text-right font-mono`}>{formatTL(toplamTutar)}</td>
                <td className={XL_TD} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
