"use client";

import { useTransition } from "react";
import { updateDurum } from "@/lib/actions/siparisler";
import type { SiparisDurum } from "@/lib/types";

export function DurumSelect({ id, durum }: { id: string; durum: SiparisDurum }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={durum}
      disabled={pending}
      onChange={(e) =>
        startTransition(() => {
          updateDurum(id, e.target.value as SiparisDurum);
        })
      }
      className="rounded-lg border border-border bg-bg px-2 py-1 text-[12px] outline-none disabled:opacity-60"
    >
      <option value="beklemede">Beklemede</option>
      <option value="yolda">Yolda</option>
      <option value="teslim_edildi">Teslim edildi</option>
    </select>
  );
}
