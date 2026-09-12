"use client";

import { useMemo, useState } from "react";
import { EditableCell } from "./editable-cell";
import { BulkBar, SortableHeader, XL_ROW_NUM, XL_TD, XL_TH, sortRows, type SortDir } from "./grid-ui";
import { ExportExcelButton } from "@/components/export-excel-button";
import { bulkDeleteUrun, updateUrunField } from "@/lib/actions/urunler";
import type { Urun } from "@/lib/types";

type SortKey = keyof Urun;

export function UrunlerTablosu({ urunler }: { urunler: Urun[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("ad");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const rows = useMemo(() => sortRows(urunler, sortKey, sortDir), [urunler, sortKey, sortDir]);

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

  const toplamStok = rows.reduce((s, u) => s + u.stok_adet, 0);

  return (
    <div>
      <BulkBar count={selected.size} onClear={() => setSelected(new Set())}>
        <button
          onClick={async () => {
            if (!confirm(`${selected.size} ürünü silmek istediğinize emin misiniz?`)) return;
            await bulkDeleteUrun([...selected]);
            setSelected(new Set());
          }}
          className="rounded-md border border-orange px-2.5 py-1 text-[12px] font-medium text-orange hover:bg-orange-soft"
        >
          Seçilenleri Sil
        </button>
      </BulkBar>

      <div className="mb-2 flex justify-end">
        <ExportExcelButton
          filename="urunler"
          sheetName="Ürünler"
          rows={rows.map((u) => ({
            Ürün: u.ad,
            Stok: u.stok_adet,
            "Ort. Maliyet": u.ortalama_maliyet,
            "Satış Fiyatı": u.satis_fiyati,
            "Kritik Eşik": u.kritik_stok_esigi,
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
                <SortableHeader label="Ürün" active={sortKey === "ad"} direction={sortDir} onClick={() => toggleSort("ad")} />
              </th>
              <th className={XL_TH}>
                <SortableHeader label="Stok" active={sortKey === "stok_adet"} direction={sortDir} onClick={() => toggleSort("stok_adet")} align="right" />
              </th>
              <th className={XL_TH}>
                <SortableHeader label="Ort. Maliyet" active={sortKey === "ortalama_maliyet"} direction={sortDir} onClick={() => toggleSort("ortalama_maliyet")} align="right" />
              </th>
              <th className={XL_TH}>
                <SortableHeader label="Satış Fiyatı" active={sortKey === "satis_fiyati"} direction={sortDir} onClick={() => toggleSort("satis_fiyati")} align="right" />
              </th>
              <th className={XL_TH}>
                <SortableHeader label="Kritik Eşik" active={sortKey === "kritik_stok_esigi"} direction={sortDir} onClick={() => toggleSort("kritik_stok_esigi")} align="right" />
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u, i) => (
              <tr key={u.id} className={i % 2 === 0 ? "bg-card" : "bg-bg-elev"}>
                <td className={XL_TD}>
                  <div className="flex items-center justify-center py-1">
                    <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleRow(u.id)} />
                  </div>
                </td>
                <td className={XL_ROW_NUM}>{i + 1}</td>
                <td className={XL_TD}>
                  <EditableCell value={u.ad} onSave={(v) => updateUrunField(u.id, "ad", v)} />
                </td>
                <td className={XL_TD}>
                  <EditableCell
                    value={u.stok_adet}
                    type="number"
                    align="right"
                    onSave={(v) => updateUrunField(u.id, "stok_adet", Number(v))}
                  />
                </td>
                <td className={XL_TD}>
                  <EditableCell
                    value={u.ortalama_maliyet}
                    type="number"
                    align="right"
                    onSave={(v) => updateUrunField(u.id, "ortalama_maliyet", Number(v))}
                  />
                </td>
                <td className={XL_TD}>
                  <EditableCell
                    value={u.satis_fiyati}
                    type="number"
                    align="right"
                    onSave={(v) => updateUrunField(u.id, "satis_fiyati", Number(v))}
                  />
                </td>
                <td className={XL_TD}>
                  <EditableCell
                    value={u.kritik_stok_esigi}
                    type="number"
                    align="right"
                    onSave={(v) => updateUrunField(u.id, "kritik_stok_esigi", Number(v))}
                  />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="border border-border px-3 py-4 text-center text-text-dim">
                  Ürün yok.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="bg-bg-elev font-semibold">
                <td className={XL_TD} />
                <td className={XL_TD} />
                <td className={`${XL_TD} px-1.5 py-1`}>Toplam ({rows.length} ürün)</td>
                <td className={`${XL_TD} px-1.5 py-1 text-right font-mono`}>{toplamStok}</td>
                <td className={XL_TD} />
                <td className={XL_TD} />
                <td className={XL_TD} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
