"use client";

import { useRef, useState } from "react";
import { SABLONLAR, SATIR_SAYISI, SUTUN_HARFLERI, type SablonKey } from "./templates";

function bosCells(sablon: SablonKey): Record<string, string> {
  const headers = SABLONLAR[sablon].headers;
  const cells: Record<string, string> = {};
  headers.forEach((h, i) => {
    cells[`${SUTUN_HARFLERI[i]}1`] = h;
  });
  return cells;
}

export function ExcelSheet() {
  const [sablon, setSablon] = useState<SablonKey>("bos");
  const [cells, setCells] = useState<Record<string, string>>(() => bosCells("bos"));
  const [activeCell, setActiveCell] = useState<string>("A1");
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  function hucreDegistir(id: string, value: string) {
    setCells((c) => ({ ...c, [id]: value }));
  }

  function sablonSec(key: SablonKey) {
    setSablon(key);
    setCells(bosCells(key));
    setActiveCell("A1");
  }

  function temizle() {
    setCells(bosCells(sablon));
  }

  function odaklan(col: string, row: number) {
    const id = `${col}${row}`;
    inputRefs.current[id]?.focus();
  }

  function tusaBas(e: React.KeyboardEvent<HTMLInputElement>, colIdx: number, row: number) {
    const col = SUTUN_HARFLERI[colIdx];
    if (e.key === "ArrowRight" || (e.key === "Tab" && !e.shiftKey)) {
      e.preventDefault();
      const next = SUTUN_HARFLERI[colIdx + 1];
      if (next) odaklan(next, row);
    } else if (e.key === "ArrowLeft" || (e.key === "Tab" && e.shiftKey)) {
      e.preventDefault();
      const prev = SUTUN_HARFLERI[colIdx - 1];
      if (prev) odaklan(prev, row);
    } else if (e.key === "ArrowDown" || e.key === "Enter") {
      e.preventDefault();
      if (row < SATIR_SAYISI) odaklan(col, row + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (row > 1) odaklan(col, row - 1);
    }
  }

  async function indir() {
    const XLSX = await import("xlsx");
    let maxCol = 0;
    let maxRow = 0;
    for (const id of Object.keys(cells)) {
      if (!cells[id]) continue;
      const match = id.match(/^([A-Z]+)(\d+)$/);
      if (!match) continue;
      const colIdx = SUTUN_HARFLERI.indexOf(match[1]);
      const row = Number(match[2]);
      if (colIdx > maxCol) maxCol = colIdx;
      if (row > maxRow) maxRow = row;
    }
    maxCol = Math.max(maxCol, SABLONLAR[sablon].headers.length - 1);
    maxRow = Math.max(maxRow, 1);

    const matrix: string[][] = [];
    for (let r = 1; r <= maxRow; r++) {
      const rowData: string[] = [];
      for (let c = 0; c <= maxCol; c++) {
        rowData.push(cells[`${SUTUN_HARFLERI[c]}${r}`] ?? "");
      }
      matrix.push(rowData);
    }

    const sheet = XLSX.utils.aoa_to_sheet(matrix);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Sayfa1");
    XLSX.writeFile(workbook, `${SABLONLAR[sablon].label.replace(/\s+/g, "-")}.xlsx`);
  }

  const headerCount = SABLONLAR[sablon].headers.length;

  return (
    <div className="overflow-hidden rounded-[10px] border border-border">
      {/* Ribbon */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-bg-elev px-3 py-2">
        <select
          value={sablon}
          onChange={(e) => sablonSec(e.target.value as SablonKey)}
          className="rounded-md border border-border bg-card px-2 py-1.5 text-[12.5px]"
        >
          {(Object.keys(SABLONLAR) as SablonKey[]).map((k) => (
            <option key={k} value={k}>
              {SABLONLAR[k].label}
            </option>
          ))}
        </select>
        <button
          onClick={temizle}
          className="rounded-md border border-border bg-card px-2.5 py-1.5 text-[12.5px] font-medium hover:bg-bg"
        >
          Temizle
        </button>
        <button
          onClick={indir}
          className="ml-auto rounded-md bg-green px-3 py-1.5 text-[12.5px] font-semibold text-white"
        >
          İndir (.xlsx)
        </button>
      </div>

      {/* Formula bar */}
      <div className="flex items-center gap-2 border-b border-border bg-card px-2 py-1.5">
        <span className="w-14 shrink-0 rounded border border-border bg-bg-elev px-2 py-1 text-center text-[11.5px] font-mono text-text-dim">
          {activeCell}
        </span>
        <span className="text-text-dim">fx</span>
        <input
          value={cells[activeCell] ?? ""}
          onChange={(e) => hucreDegistir(activeCell, e.target.value)}
          className="flex-1 border-none bg-transparent px-1 py-1 text-[12.5px] outline-none"
        />
      </div>

      {/* Grid */}
      <div className="max-h-[60vh] overflow-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-20 w-9 border border-border bg-bg-elev" />
              {SUTUN_HARFLERI.map((col) => (
                <th
                  key={col}
                  className="sticky top-0 z-10 min-w-[110px] border border-border bg-bg-elev py-1 text-center font-semibold text-text-dim"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: SATIR_SAYISI }, (_, i) => i + 1).map((row) => (
              <tr key={row}>
                <td className="sticky left-0 z-10 border border-border bg-bg-elev text-center text-text-dim">
                  {row}
                </td>
                {SUTUN_HARFLERI.map((col, colIdx) => {
                  const id = `${col}${row}`;
                  const isHeaderCell = row === 1 && colIdx < headerCount;
                  return (
                    <td key={id} className="border border-border p-0">
                      <input
                        ref={(el) => {
                          inputRefs.current[id] = el;
                        }}
                        value={cells[id] ?? ""}
                        onChange={(e) => hucreDegistir(id, e.target.value)}
                        onFocus={() => setActiveCell(id)}
                        onKeyDown={(e) => tusaBas(e, colIdx, row)}
                        className={`w-full min-w-[110px] border-none bg-transparent px-1.5 py-1 text-[12px] outline-none focus:bg-green-soft ${
                          isHeaderCell ? "font-semibold" : ""
                        }`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
