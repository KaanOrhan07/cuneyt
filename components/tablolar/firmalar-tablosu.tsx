"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { EditableCell } from "./editable-cell";
import { BulkBar, SortableHeader, XL_ROW_NUM, XL_TD, XL_TH, sortRows, type SortDir } from "./grid-ui";
import { ExportExcelButton } from "@/components/export-excel-button";
import { bulkDeleteFirma, updateFirmaField } from "@/lib/actions/firmalar";
import type { Firma } from "@/lib/types";

export function FirmalarTablosu({ firmalar }: { firmalar: Firma[] }) {
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  const rows = useMemo(() => sortRows(firmalar, "ad", sortDir), [firmalar, sortDir]);

  function toggleRow(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      <BulkBar count={selected.size} onClear={() => setSelected(new Set())}>
        <button
          onClick={async () => {
            if (!confirm(`${selected.size} firmayı silmek istediğinize emin misiniz?`)) return;
            await bulkDeleteFirma([...selected]);
            setSelected(new Set());
          }}
          className="rounded-md border border-orange px-2.5 py-1 text-[12px] font-medium text-orange hover:bg-orange-soft"
        >
          Seçilenleri Sil
        </button>
      </BulkBar>

      <div className="mb-2 flex justify-end">
        <ExportExcelButton
          filename="firmalar"
          sheetName="Firmalar"
          rows={rows.map((f) => ({
            Firma: f.ad,
            Renk: f.renk,
            Tedarikçi: f.is_tedarikci ? "Evet" : "Hayır",
            Müşteri: f.is_musteri ? "Evet" : "Hayır",
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
                <SortableHeader
                  label="Firma"
                  active
                  direction={sortDir}
                  onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                />
              </th>
              <th className={XL_TH}>Renk</th>
              <th className={XL_TH}>Tedarikçi</th>
              <th className={XL_TH}>Müşteri</th>
              <th className={XL_TH}>Detay</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((f, i) => (
              <tr key={f.id} className={i % 2 === 0 ? "bg-card" : "bg-bg-elev"}>
                <td className={XL_TD}>
                  <div className="flex items-center justify-center py-1">
                    <input type="checkbox" checked={selected.has(f.id)} onChange={() => toggleRow(f.id)} />
                  </div>
                </td>
                <td className={XL_ROW_NUM}>{i + 1}</td>
                <td className={XL_TD}>
                  <EditableCell value={f.ad} onSave={(v) => updateFirmaField(f.id, "ad", v)} />
                </td>
                <td className={XL_TD}>
                  <div className="flex items-center justify-center py-1">
                    <input
                      type="color"
                      defaultValue={f.renk}
                      onChange={(e) =>
                        startTransition(() => {
                          updateFirmaField(f.id, "renk", e.target.value);
                        })
                      }
                      className="h-5 w-8 cursor-pointer rounded border border-border bg-transparent p-0"
                    />
                  </div>
                </td>
                <td className={XL_TD}>
                  <div className="flex items-center justify-center py-1">
                    <input
                      type="checkbox"
                      checked={f.is_tedarikci}
                      onChange={(e) =>
                        startTransition(() => {
                          updateFirmaField(f.id, "is_tedarikci", e.target.checked);
                        })
                      }
                    />
                  </div>
                </td>
                <td className={XL_TD}>
                  <div className="flex items-center justify-center py-1">
                    <input
                      type="checkbox"
                      checked={f.is_musteri}
                      onChange={(e) =>
                        startTransition(() => {
                          updateFirmaField(f.id, "is_musteri", e.target.checked);
                        })
                      }
                    />
                  </div>
                </td>
                <td className={XL_TD}>
                  <Link href={`/firmalar/${f.id}`} className="block px-1.5 py-1 text-green hover:underline">
                    Siparişler →
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="border border-border px-3 py-4 text-center text-text-dim">
                  Firma yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
