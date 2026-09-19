"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { addCariOdeme, deleteCariHareket, deleteCariOdeme } from "@/lib/actions/cari";
import { Button, Input } from "@/components/ui";
import { formatParaBirimi, formatTarih } from "@/lib/format";
import type { CariHareket, CariOdeme } from "@/lib/types";

export function CariHareketRow({
  hareket,
  odemeler,
  firmaId,
  firmaAd,
  bugun,
}: {
  hareket: CariHareket;
  odemeler: CariOdeme[];
  firmaId: string;
  /** Verilirse ilk sütunda firma adı gösterilir (Finans sayfası) */
  firmaAd?: string;
  /** İstanbul bugün anahtarı (YYYY-MM-DD) — vade karşılaştırması için */
  bugun: string;
}) {
  const [odemeFormAcik, setOdemeFormAcik] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const pb = hareket.para_birimi ?? "TL";
  const yon = hareket.yon ?? "alacak";
  const para = (n: number) => formatParaBirimi(n, pb);
  const kolonSayisi = firmaAd !== undefined ? 11 : 10;

  const odenenTutar = odemeler.reduce((s, o) => s + o.tutar, 0);
  const kalanBorc = hareket.tutar - odenenTutar;
  const vadeGecti = !!hareket.vade_tarihi && kalanBorc > 0 && hareket.vade_tarihi < bugun;

  const durum =
    kalanBorc <= 0
      ? { label: yon === "alacak" ? "Tahsil edildi" : "Ödendi", tone: "green" as const }
      : odenenTutar > 0
        ? { label: vadeGecti ? "Kısmi · Vadesi Geçti" : "Kısmi", tone: "orange" as const }
        : { label: vadeGecti ? "Vadesi Geçti" : yon === "alacak" ? "Tahsil edilmedi" : "Ödenmedi", tone: "orange" as const };

  return (
    <>
      <tr className="border-b border-border last:border-0">
        {firmaAd !== undefined && (
          <td className="py-2.5 font-medium">
            <Link href={`/firmalar/${firmaId}?bolum=cari`} className="hover:text-green hover:underline">
              {firmaAd}
            </Link>
          </td>
        )}
        <td className="py-2.5">
          <span
            className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
              yon === "alacak" ? "bg-green-soft text-green" : "bg-orange-soft text-[#C74519]"
            }`}
          >
            {yon === "alacak" ? "Alacak" : "Verecek"}
          </span>
        </td>
        <td className="py-2.5 font-mono">{formatTarih(hareket.tarih)}</td>
        <td className="py-2.5">{hareket.fatura_no || "—"}</td>
        <td className="py-2.5 text-text-dim">{hareket.aciklama || "—"}</td>
        <td className="py-2.5 font-mono">{para(hareket.tutar)}</td>
        <td className="py-2.5 font-mono">{para(odenenTutar)}</td>
        <td className={`py-2.5 font-mono font-semibold ${kalanBorc > 0 ? "text-orange" : ""}`}>
          {para(kalanBorc)}
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
                {yon === "alacak" ? "Tahsilat Ekle" : "Ödeme Ekle"}
              </button>
            )}
            <button
              onClick={async () => {
                if (!confirm("Bu cari kaydını silmek istediğinize emin misiniz?")) return;
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
          <td colSpan={kolonSayisi} className="p-3">
            <form
              ref={formRef}
              action={async (formData) => {
                setHata(null);
                try {
                  await addCariOdeme(formData);
                  formRef.current?.reset();
                  setOdemeFormAcik(false);
                } catch (e) {
                  setHata(e instanceof Error ? e.message : "Kaydedilemedi.");
                }
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
                placeholder={`Kalan: ${para(kalanBorc)}`}
                className="w-44"
              />
              <Button type="submit">{yon === "alacak" ? "Tahsilatı Kaydet" : "Ödemeyi Kaydet"}</Button>
              {hata && <span className="text-[12px] text-orange">{hata}</span>}
            </form>
          </td>
        </tr>
      )}

      {odemeler.length > 0 && (
        <tr className="border-b border-border">
          <td colSpan={kolonSayisi} className="bg-bg-elev px-3 py-2 text-[11.5px] text-text-dim">
            {yon === "alacak" ? "Tahsilatlar" : "Ödemeler"}:{" "}
            {odemeler.map((o) => (
              <span key={o.id} className="mr-3 inline-flex items-center gap-1">
                {formatTarih(o.tarih)} — {para(o.tutar)}
                <button
                  onClick={() => deleteCariOdeme(o.id, firmaId)}
                  className="text-text-dim hover:text-orange"
                  title="Kaydı sil"
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
