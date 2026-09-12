"use client";

import { useState, useTransition } from "react";
import { updateDurum } from "@/lib/actions/siparisler";
import type { SiparisDurum } from "@/lib/types";

export function DurumSelect({ id, durum }: { id: string; durum: SiparisDurum }) {
  const [value, setValue] = useState(durum);
  const [pending, startTransition] = useTransition();

  function handleChange(next: SiparisDurum) {
    if (next === "iptal_edildi" && !confirm("Bu siparişi iptal etmek istediğinize emin misiniz? Stok etkisi geri alınacak.")) {
      return;
    }
    setValue(next);
    startTransition(() => {
      updateDurum(id, next);
    });
  }

  return (
    <select
      value={value}
      disabled={pending}
      onChange={(e) => handleChange(e.target.value as SiparisDurum)}
      className={`rounded-lg border border-border bg-bg px-2 py-1 text-[12px] outline-none disabled:opacity-60 ${
        value === "iptal_edildi" ? "text-[#C0392B]" : ""
      }`}
    >
      <option value="beklemede">Beklemede</option>
      <option value="yolda">Yolda</option>
      <option value="teslim_edildi">Teslim edildi</option>
      <option value="iptal_edildi">İptal edildi</option>
    </select>
  );
}
