"use client";

import { useState, useTransition } from "react";
import { deleteSatinAlma, updateSatinAlmaDurum } from "@/lib/actions/satin-alma";
import { SATIN_ALMA_DURUM_LABEL, type SatinAlmaDurum } from "@/lib/types";

export function SatinAlmaDurumSelect({ id, durum }: { id: string; durum: SatinAlmaDurum }) {
  const [value, setValue] = useState(durum);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2.5">
      <select
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as SatinAlmaDurum;
          setValue(next);
          startTransition(() => {
            updateSatinAlmaDurum(id, next);
          });
        }}
        className={`rounded-lg border border-border bg-bg px-2 py-1 text-[12px] outline-none disabled:opacity-60 ${
          value === "teslim_alindi" ? "text-green" : value === "iptal_edildi" ? "text-orange" : ""
        }`}
      >
        {(Object.keys(SATIN_ALMA_DURUM_LABEL) as SatinAlmaDurum[]).map((d) => (
          <option key={d} value={d}>
            {SATIN_ALMA_DURUM_LABEL[d]}
          </option>
        ))}
      </select>
      <button
        onClick={() => {
          if (!confirm("Bu satın alma siparişini silmek istediğinize emin misiniz?")) return;
          startTransition(() => {
            deleteSatinAlma(id);
          });
        }}
        className="text-[11px] text-text-dim hover:text-orange"
      >
        Sil
      </button>
    </div>
  );
}
