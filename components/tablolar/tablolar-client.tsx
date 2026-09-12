"use client";

import { useState } from "react";
import { SiparislerTablosu, type SiparisSatiri } from "./siparisler-tablosu";
import { UrunlerTablosu } from "./urunler-tablosu";
import { FirmalarTablosu } from "./firmalar-tablosu";
import type { Firma, Urun } from "@/lib/types";

type Sekme = "siparisler" | "urunler" | "firmalar";

const SEKMELER: { key: Sekme; label: string }[] = [
  { key: "siparisler", label: "Siparişler" },
  { key: "urunler", label: "Ürünler" },
  { key: "firmalar", label: "Firmalar" },
];

export function TablolarClient({
  siparisler,
  urunler,
  firmalar,
}: {
  siparisler: SiparisSatiri[];
  urunler: Urun[];
  firmalar: Firma[];
}) {
  const [sekme, setSekme] = useState<Sekme>("siparisler");

  return (
    <div>
      <div className="mb-4 flex gap-1 border-b border-border">
        {SEKMELER.map((s) => (
          <button
            key={s.key}
            onClick={() => setSekme(s.key)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-[13.5px] font-medium transition-colors ${
              sekme === s.key
                ? "border-green text-green"
                : "border-transparent text-text-dim hover:text-text"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {sekme === "siparisler" && <SiparislerTablosu siparisler={siparisler} />}
      {sekme === "urunler" && <UrunlerTablosu urunler={urunler} />}
      {sekme === "firmalar" && <FirmalarTablosu firmalar={firmalar} />}

      <p className="mt-3 text-[11.5px] text-text-dim">
        İpucu: hücrelere çift tıklayarak doğrudan düzenleyebilir, başlıklara tıklayarak
        sıralayabilir, satır başlarındaki kutucuklarla toplu işlem yapabilirsiniz.
      </p>
    </div>
  );
}
