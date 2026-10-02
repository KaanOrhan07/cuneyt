"use client";

import { useState, useTransition } from "react";
import {
  beklemeyeAl,
  epostaTekrarGonder,
  onayla,
  reddet,
  sil,
  type GelenSonuc,
} from "@/lib/actions/site-gelenler";
import { Button } from "@/components/ui";
import { formatParaBirimi, formatTarihSaat } from "@/lib/format";
import type { SiteGelen } from "@/lib/types";

const EPOSTA_ETIKET: Record<string, { metin: string; ton: string }> = {
  gonderildi: { metin: "E-posta gönderildi", ton: "text-green" },
  hata: { metin: "E-posta gönderilemedi", ton: "text-orange" },
  ayarlanmamis: { metin: "E-posta ayarları (SMTP) tanımlı değil", ton: "text-orange" },
  "eposta-yok": { metin: "Müşteri e-postası yok", ton: "text-orange" },
};

export function SiteGelenKarti({ g }: { g: SiteGelen }) {
  const [pending, startTransition] = useTransition();
  const [mesaj, setMesaj] = useState<{ ok: boolean; metin: string } | null>(null);
  const para = (n: number) => formatParaBirimi(n, g.para_birimi);
  const tipEtiket = g.tip === "teklif" ? "Teklif" : "Sipariş";

  function calistir(fn: () => Promise<GelenSonuc>) {
    setMesaj(null);
    startTransition(async () => {
      try {
        const s = await fn();
        setMesaj({ ok: s.ok, metin: s.mesaj ?? (s.ok ? "Tamam." : "İşlem başarısız.") });
      } catch (e) {
        setMesaj({ ok: false, metin: e instanceof Error ? e.message : "İşlem başarısız." });
      }
    });
  }

  const eposta = g.eposta_durumu ? EPOSTA_ETIKET[g.eposta_durumu] : null;

  return (
    <div className="rounded-[14px] border border-border bg-card p-5 shadow-[var(--shadow)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              g.tip === "teklif" ? "bg-green-soft text-green" : "bg-orange-soft text-[#C74519]"
            }`}
          >
            {tipEtiket}
          </span>
          <span className="font-medium">{g.dis_no ?? g.dis_id}</span>
          <span className="text-[12px] text-text-dim">{formatTarihSaat(g.dis_olusturma ?? g.created_at)}</span>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            g.durum === "onaylandi"
              ? "bg-green-soft text-green"
              : g.durum === "reddedildi"
                ? "bg-bg-elev text-text-dim line-through"
                : "bg-orange-soft text-[#C74519]"
          }`}
        >
          {g.durum === "onaylandi" ? "Onaylandı" : g.durum === "reddedildi" ? "Reddedildi" : "Onay bekliyor"}
        </span>
      </div>

      <div className="mb-3 grid grid-cols-1 gap-x-6 gap-y-1 text-[13px] md:grid-cols-2">
        <div>
          <span className="text-text-dim">Müşteri: </span>
          <span className="font-medium">{g.musteri_ad ?? "—"}</span>
          {g.musteri_firma && <span className="text-text-dim"> · {g.musteri_firma}</span>}
        </div>
        <div>
          <span className="text-text-dim">E-posta: </span>
          {g.musteri_eposta ?? "—"}
        </div>
        <div>
          <span className="text-text-dim">Telefon: </span>
          {g.musteri_telefon ?? "—"}
        </div>
      </div>

      {g.kalemler.length > 0 && (
        <table className="mb-3 w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-dim">
              <th className="pb-2 text-left font-semibold">Ürün</th>
              <th className="pb-2 text-right font-semibold">Adet</th>
              <th className="pb-2 text-right font-semibold">Birim Fiyat</th>
              <th className="pb-2 text-right font-semibold">Tutar</th>
            </tr>
          </thead>
          <tbody>
            {g.kalemler.map((k, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="py-2 font-medium">{k.ad}</td>
                <td className="py-2 text-right font-mono">{k.adet}</td>
                <td className="py-2 text-right font-mono">{k.birim_fiyat !== null ? para(k.birim_fiyat) : "—"}</td>
                <td className="py-2 text-right font-mono">
                  {k.birim_fiyat !== null ? para(k.adet * k.birim_fiyat) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {g.toplam !== null && (
        <div className="mb-3 flex justify-end text-[13px] font-semibold">
          <span className="mr-6 text-text-dim">Toplam</span>
          <span className="font-mono">{para(g.toplam)}</span>
        </div>
      )}

      {g.notlar && (
        <p className="mb-3 rounded-lg bg-bg-elev px-3 py-2 text-[12.5px] text-text-dim">Not: {g.notlar}</p>
      )}

      <div className="flex flex-wrap items-center gap-2.5">
        {g.durum === "beklemede" && (
          <>
            <Button
              disabled={pending}
              onClick={() => {
                if (!confirm("Onaylanınca müşteriye e-posta gönderilecek. Devam edilsin mi?")) return;
                calistir(() => onayla(g.id));
              }}
            >
              {pending ? "İşleniyor..." : "Onayla ve e-posta gönder"}
            </Button>
            <Button variant="secondary" disabled={pending} onClick={() => calistir(() => reddet(g.id))}>
              Reddet
            </Button>
          </>
        )}
        {g.durum === "reddedildi" && (
          <Button variant="secondary" disabled={pending} onClick={() => calistir(() => beklemeyeAl(g.id))}>
            Beklemeye al
          </Button>
        )}
        {g.durum === "onaylandi" && (
          <>
            <span className="text-[12.5px] text-text-dim">
              {g.onaylayan ?? "—"} · {g.onay_tarihi ? formatTarihSaat(g.onay_tarihi) : ""}
            </span>
            {eposta && <span className={`text-[12.5px] font-medium ${eposta.ton}`}>{eposta.metin}</span>}
            {g.eposta_durumu !== "gonderildi" && (
              <Button
                variant="secondary"
                disabled={pending}
                onClick={() => calistir(() => epostaTekrarGonder(g.id))}
              >
                E-postayı tekrar gönder
              </Button>
            )}
          </>
        )}
        <button
          disabled={pending}
          onClick={() => {
            if (!confirm("Bu kayıt silinsin mi? (Sitede durur, sadece DiTrack'ten kalkar)")) return;
            calistir(() => sil(g.id));
          }}
          className="ml-auto text-[12px] text-text-dim hover:text-orange disabled:opacity-60"
        >
          Sil
        </button>
      </div>

      {g.eposta_hata && g.eposta_durumu === "hata" && (
        <p className="mt-2 text-[12px] text-orange">Hata ayrıntısı: {g.eposta_hata}</p>
      )}
      {mesaj && (
        <p
          className={`mt-3 rounded-lg px-3 py-2 text-[12.5px] ${
            mesaj.ok ? "bg-green-soft text-green" : "bg-orange-soft text-orange"
          }`}
        >
          {mesaj.metin}
        </p>
      )}

      <details className="mt-3">
        <summary className="cursor-pointer text-[12px] text-text-dim hover:text-text">Ham veri (JSON)</summary>
        <pre className="mt-2 max-h-72 overflow-auto rounded-lg bg-bg-elev p-3 text-[11.5px]">
          {JSON.stringify(g.ham, null, 2)}
        </pre>
      </details>
    </div>
  );
}
