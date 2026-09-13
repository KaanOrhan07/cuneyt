"use client";

import { useState, useTransition } from "react";
import { deleteSiparis } from "@/lib/actions/siparisler";

export function SiparisDeleteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [hata, setHata] = useState<string | null>(null);

  return (
    <div>
      <button
        disabled={pending}
        onClick={() => {
          if (
            !confirm(
              "Bu siparişi kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm veriler tamamen silinir.",
            )
          ) {
            return;
          }
          setHata(null);
          startTransition(async () => {
            try {
              await deleteSiparis(id);
            } catch (err) {
              setHata(err instanceof Error ? err.message : "Silme işlemi başarısız oldu.");
            }
          });
        }}
        className="text-[11px] font-medium text-orange hover:underline disabled:opacity-50"
      >
        {pending ? "Siliniyor..." : "Sil"}
      </button>
      {hata && <p className="mt-1 max-w-[180px] text-[10.5px] text-orange">{hata}</p>}
    </div>
  );
}
