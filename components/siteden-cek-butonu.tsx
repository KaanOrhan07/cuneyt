"use client";

import { useState, useTransition } from "react";
import { sitedenCek } from "@/lib/actions/site-gelenler";
import { Button } from "@/components/ui";

export function SitedenCekButonu({ hazir }: { hazir: boolean }) {
  const [pending, startTransition] = useTransition();
  const [mesaj, setMesaj] = useState<{ ok: boolean; metin: string } | null>(null);

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button
        variant="secondary"
        disabled={pending || !hazir}
        title={hazir ? undefined : "Site API ayarları tanımlı değil"}
        onClick={() => {
          setMesaj(null);
          startTransition(async () => {
            try {
              const s = await sitedenCek();
              setMesaj({ ok: s.ok, metin: s.mesaj ?? (s.ok ? "Tamam." : "Hata") });
            } catch (e) {
              setMesaj({ ok: false, metin: e instanceof Error ? e.message : "Çekme başarısız." });
            }
          });
        }}
      >
        {pending ? "Çekiliyor..." : "Siteden Çek (API)"}
      </Button>
      {mesaj && (
        <span className={`max-w-[360px] text-right text-[12px] ${mesaj.ok ? "text-green" : "text-orange"}`}>
          {mesaj.metin}
        </span>
      )}
    </div>
  );
}
