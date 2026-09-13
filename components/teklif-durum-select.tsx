"use client";

import { useState, useTransition } from "react";
import { deleteTeklif, updateTeklifDurum } from "@/lib/actions/teklifler";
import type { TeklifDurum } from "@/lib/types";

export function TeklifDurumSelect({ id, durum }: { id: string; durum: TeklifDurum }) {
  const [value, setValue] = useState(durum);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2.5">
      <select
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as TeklifDurum;
          setValue(next);
          startTransition(() => {
            updateTeklifDurum(id, next);
          });
        }}
        className={`rounded-lg border border-border bg-bg px-2 py-1 text-[12px] outline-none disabled:opacity-60 ${
          value === "kabul_edildi" ? "text-green" : value === "reddedildi" ? "text-orange" : ""
        }`}
      >
        <option value="beklemede">Beklemede</option>
        <option value="kabul_edildi">Kabul edildi</option>
        <option value="reddedildi">Reddedildi</option>
      </select>
      <button
        onClick={() => {
          if (!confirm("Bu teklifi silmek istediğinize emin misiniz?")) return;
          deleteTeklif(id);
        }}
        className="text-[11px] text-text-dim hover:text-orange"
      >
        Sil
      </button>
    </div>
  );
}
