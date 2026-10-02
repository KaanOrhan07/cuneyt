"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const KONTROL_ARALIGI_MS = 30_000;

type Yanit = { yeni: number; yeniTeklif: number; yeniSiparis: number; bekleyen: number; son: string | null };

/** Siteden yeni teklif/sipariş gelince sağ altta "yenileyin" pop-up'ı gösterir. */
export function YeniGelenBildirimi({ baslangicSon }: { baslangicSon: string | null }) {
  const router = useRouter();
  const goruldu = useRef<string>(baslangicSon ?? new Date().toISOString());
  const [bildirim, setBildirim] = useState<Yanit | null>(null);

  const kontrolEt = useCallback(async () => {
    try {
      const res = await fetch(`/api/siteden-gelenler/yeni?since=${encodeURIComponent(goruldu.current)}`, {
        cache: "no-store",
      });
      if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) return;
      const veri = (await res.json()) as Yanit;
      if (veri.yeni > 0) setBildirim(veri);
    } catch {
      // ağ hatasında bir sonraki denemede tekrar bakılır
    }
  }, []);

  useEffect(() => {
    const zamanlayici = setInterval(kontrolEt, KONTROL_ARALIGI_MS);
    const odaklaninca = () => {
      if (document.visibilityState === "visible") void kontrolEt();
    };
    document.addEventListener("visibilitychange", odaklaninca);
    return () => {
      clearInterval(zamanlayici);
      document.removeEventListener("visibilitychange", odaklaninca);
    };
  }, [kontrolEt]);

  if (!bildirim) return null;

  const parcalar = [
    bildirim.yeniTeklif > 0 ? `${bildirim.yeniTeklif} yeni teklif` : null,
    bildirim.yeniSiparis > 0 ? `${bildirim.yeniSiparis} yeni sipariş` : null,
  ].filter(Boolean);

  function kapat(yenile: boolean) {
    if (bildirim?.son) goruldu.current = bildirim.son;
    setBildirim(null);
    if (yenile) router.refresh();
  }

  return (
    <div
      role="alertdialog"
      aria-live="assertive"
      className="fixed bottom-5 right-5 z-50 w-[320px] rounded-[14px] border border-border bg-card p-4 shadow-[var(--shadow)]"
    >
      <div className="text-[13.5px] font-semibold">Siteden yeni kayıt geldi</div>
      <p className="mt-1 text-[12.5px] text-text-dim">
        {parcalar.join(" ve ")} var. Güncel listeyi görmek için sayfayı yenileyin.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => kapat(true)}
          className="rounded-full bg-green px-3.5 py-1.5 text-[12.5px] font-medium text-white"
        >
          Yenile
        </button>
        <Link
          href="/siteden-gelenler"
          onClick={() => kapat(false)}
          className="rounded-full border border-border px-3.5 py-1.5 text-[12.5px] font-medium"
        >
          Siteden Gelenler&apos;e git
        </Link>
        <button
          type="button"
          onClick={() => kapat(false)}
          className="px-2 py-1.5 text-[12.5px] font-medium text-text-dim hover:text-text"
        >
          Kapat
        </button>
      </div>
    </div>
  );
}
