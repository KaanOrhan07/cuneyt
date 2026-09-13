"use client";

import { useRef, useState } from "react";
import { addCariOdeme, deleteCariHareket, deleteCariOdeme } from "@/lib/actions/cari";
import { Button, Input } from "@/components/ui";
import { formatTL, formatTarih } from "@/lib/format";
import type { CariHareket, CariOdeme } from "@/lib/types";

export function CariHareketRow({
  hareket,
  odemeler,
  firmaId,
}: {
  hareket: CariHareket;
  odemeler: CariOdeme[];
  firmaId: string;
}) {
  const [odemeFormAcik, setOdemeFormAcik] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const odenenTutar = odemeler.reduce((s, o) => s + o.tutar, 0);
  const kalanBorc = hareket.tutar - odenenTutar;
  const vadeGecti = hareket.vade_tarihi && kalanBorc > 0 && new Date(hareket.vade_tarihi) < new Date();

  const durum =
    kalanBorc <= 0
      ? { label: "Ödendi", tone: "green" as const }
      : odenenTutar > 0
        ? { label: "Kısmi Ödendi", tone: "orange" as const }
        : { label: vadeGecti ? "Vadesi Geçti" : "Ödenmedi", tone: "orange" as const };

  return (
    <>
      <tr className="border-b border-border last:border-0">
        <td className="py-2.5 font-mono">{formatTarih(hareket.tarih)}</td>
        <td className="py-2.5">{hareket.fatura_no || "—"}</td>
        <td className="py-2.5 text-text-dim">{hareket.aciklama || "—"}</td>
        <td className="py-2.5 font-mono">{formatTL(hareket.tutar)}</td>
        <td className="py-2.5 font-mono">{formatTL(odenenTutar)}</td>
        <td className={`py-2.5 font-mono font-semibold ${kalanBorc > 0 ? "text-orange" : ""}`}>
          {formatTL(kalanBorc)}
        </td>
        <td className="py-2.5 font-mono text-text-dim">
          {hareket.vade_tarihi ? formatTarih(hareket.vade_tarihi) : "—"}
        </td>
        <td className="py-2.5">
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              durum.tone === "green" ? "bg-green-soft text-green" : "bg-orange-soft text-[#C74519]"
            }`}
          >
            {durum.label}
          </span>
        </td>
        <td className="py-2.5">
          <div className="flex items-center gap-2.5">
            {kalanBorc > 0 && (
              <button
                onClick={() => setOdemeFormAcik((v) => !v)}
                className="text-[11px] font-medium text-green hover:underline"
              >
                Ödeme Ekle
              </button>
            )}
            <button
              onClick={async () => {
                if (!confirm("Bu borç kaydını silmek istediğinize emin misiniz?")) return;
                await deleteCariHareket(hareket.id, firmaId);
              }}
              className="text-[11px] text-text-dim hover:text-orange"
            >
              Sil
            </button>
          </div>
        </td>
      </tr>

      {odemeFormAcik && (
        <tr className="border-b border-border bg-bg-elev">
          <td colSpan={9} className="p-3">
            <form
              ref={formRef}
              action={async (formData) => {
                await addCariOdeme(formData);
                formRef.current?.reset();
                setOdemeFormAcik(false);
              }}
              className="flex flex-wrap items-end gap-2.5"
            >
              <input type="hidden" name="cari_hareket_id" value={hareket.id} />
              <input type="hidden" name="firma_id" value={firmaId} />
              <Input type="date" name="tarih" required className="w-40" />
              <Input
                type="number"
                step="0.01"
                name="tutar"
                required
                placeholder={`Kalan: ₺${kalanBorc.toLocaleString("tr-TR")}`}
                className="w-40"
              />
              <Button type="submit">Ödemeyi Kaydet</Button>
            </form>
          </td>
        </tr>
      )}

      {odemeler.length > 0 && (
        <tr className="border-b border-border">
          <td colSpan={9} className="bg-bg-elev px-3 py-2 text-[11.5px] text-text-dim">
            Ödemeler:{" "}
            {odemeler.map((o) => (
              <span key={o.id} className="mr-3 inline-flex items-center gap-1">
                {formatTarih(o.tarih)} — {formatTL(o.tutar)}
                <button
                  onClick={() => deleteCariOdeme(o.id, firmaId)}
                  className="text-text-dim hover:text-orange"
                  title="Ödemeyi sil"
                >
                  ×
                </button>
              </span>
            ))}
          </td>
        </tr>
      )}
    </>
  );
}
