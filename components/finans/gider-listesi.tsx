"use client";

import { useState, useTransition } from "react";
import { deleteGider } from "@/lib/actions/giderler";
import { formatParaBirimi, formatTarih } from "@/lib/format";
import type { Gider } from "@/lib/types";

export function GiderListesi({ giderler }: { giderler: Gider[] }) {
  const [pending, startTransition] = useTransition();
  const [hata, setHata] = useState<string | null>(null);

  return (
    <div>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-dim">
            <th className="pb-2.5 text-left font-semibold">Tarih</th>
            <th className="pb-2.5 text-left font-semibold">Kategori</th>
            <th className="pb-2.5 text-left font-semibold">Açıklama</th>
            <th className="pb-2.5 text-right font-semibold">Tutar</th>
            <th className="pb-2.5" />
          </tr>
        </thead>
        <tbody>
          {giderler.map((g) => (
            <tr key={g.id} className="border-b border-border last:border-0">
              <td className="py-2.5 font-mono">{formatTarih(g.tarih)}</td>
              <td className="py-2.5 text-text-dim">{g.kategori || "—"}</td>
              <td className="py-2.5">{g.aciklama}</td>
              <td className="py-2.5 text-right font-mono">{formatParaBirimi(g.tutar, g.para_birimi)}</td>
              <td className="py-2.5 text-right">
                <button
                  disabled={pending}
                  onClick={() => {
                    if (!confirm("Bu gider kaydını silmek istediğinize emin misiniz?")) return;
                    setHata(null);
                    startTransition(async () => {
                      try {
                        await deleteGider(g.id);
                      } catch (e) {
                        setHata(e instanceof Error ? e.message : "Silinemedi.");
                      }
                    });
                  }}
                  className="text-[11px] text-text-dim hover:text-orange disabled:opacity-50"
                >
                  Sil
                </button>
              </td>
            </tr>
          ))}
          {giderler.length === 0 && (
            <tr>
              <td colSpan={5} className="py-4 text-text-dim">
                Henüz gider kaydı yok.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {hata && <p className="mt-2 rounded-lg bg-orange-soft px-3 py-2 text-[12.5px] text-orange">{hata}</p>}
    </div>
  );
}
