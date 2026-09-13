import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Panel } from "@/components/ui";
import { formatTL, formatTarih } from "@/lib/format";
import { istanbulAyAraligi, istanbulHaftaAraligi, istanbulToday, istanbulYilAraligi } from "@/lib/tr-time";
import type { Firma, SiparisDurum, SiparisTip } from "@/lib/types";

type Periyot = "hafta" | "ay" | "yil" | "tumu";

const PERIYOTLAR: { key: Periyot; label: string }[] = [
  { key: "hafta", label: "Bu Hafta" },
  { key: "ay", label: "Bu Ay" },
  { key: "yil", label: "Bu Yıl" },
  { key: "tumu", label: "Tümü" },
];

export default async function TeslimatlarPage({
  searchParams,
}: {
  searchParams: Promise<{ periyot?: string }>;
}) {
  const { periyot = "hafta" } = await searchParams;
  const periyotKey = periyot as Periyot;
  const supabase = await createClient();

  let query = supabase
    .from("siparisler")
    .select(
      "id, tip, durum, son_teslim_tarihi, firmalar(id, ad, renk), siparis_kalemleri(adet, birim_fiyat, urunler(ad))",
    )
    .not("son_teslim_tarihi", "is", null)
    .not("durum", "in", "(teslim_edildi,iptal_edildi)")
    .order("son_teslim_tarihi", { ascending: true });

  if (periyotKey !== "tumu") {
    const araliklar = {
      hafta: istanbulHaftaAraligi,
      ay: istanbulAyAraligi,
      yil: istanbulYilAraligi,
    };
    const { baslangic, bitis } = araliklar[periyotKey]();
    query = query.gte("son_teslim_tarihi", baslangic.toISOString()).lte("son_teslim_tarihi", bitis.toISOString());
  }

  const { data: siparisler, error: siparisHata } = await query;
  const bugun = istanbulToday();
  const bugunTarih = new Date(Date.UTC(bugun.year, bugun.month - 1, bugun.day));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-[22px] font-semibold">Teslimatlar</h1>
        <p className="mt-0.5 text-[13px] text-text-dim">
          Son teslim tarihi belirlenmiş, henüz teslim edilmemiş siparişler
        </p>
      </div>

      {siparisHata && (
        <p className="mb-4 rounded-lg bg-orange-soft px-3 py-2 text-[12.5px] text-orange">
          Veritabanı güncellemesi (migration) henüz çalıştırılmamış: {siparisHata.message}
        </p>
      )}

      <div className="mb-5 flex gap-2">
        {PERIYOTLAR.map((p) => (
          <Link
            key={p.key}
            href={`/teslimatlar?periyot=${p.key}`}
            className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium ${
              periyotKey === p.key ? "bg-green text-white" : "border border-border bg-card text-text-dim"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-dim">
              <th className="pb-2.5 text-left font-semibold">Son Teslim</th>
              <th className="pb-2.5 text-left font-semibold">Firma</th>
              <th className="pb-2.5 text-left font-semibold">Tip</th>
              <th className="pb-2.5 text-left font-semibold">Ürünler</th>
              <th className="pb-2.5 text-left font-semibold">Tutar</th>
              <th className="pb-2.5 text-left font-semibold">Durum</th>
            </tr>
          </thead>
          <tbody>
            {siparisler?.map((s) => {
              const firma = s.firmalar as unknown as Firma;
              const kalemler = s.siparis_kalemleri as unknown as {
                adet: number;
                birim_fiyat: number;
                urunler: { ad: string } | null;
              }[];
              const toplam = kalemler.reduce((sum, k) => sum + k.adet * k.birim_fiyat, 0);
              const teslimTarihi = new Date(s.son_teslim_tarihi as string);
              const gecti = teslimTarihi < bugunTarih;
              return (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className={`py-2.5 font-mono ${gecti ? "font-semibold text-orange" : ""}`}>
                    {formatTarih(s.son_teslim_tarihi as string)}
                    {gecti && <span className="ml-1.5 text-[10.5px]">(gecikti)</span>}
                  </td>
                  <td className="py-2.5">
                    <Link href={`/firmalar/${firma?.id}`} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: firma?.renk }} />
                      {firma?.ad}
                    </Link>
                  </td>
                  <td className="py-2.5">
                    <Badge tip={s.tip as SiparisTip} />
                  </td>
                  <td className="py-2.5">{kalemler.map((k) => k.urunler?.ad).join(", ")}</td>
                  <td className="py-2.5 font-mono">{formatTL(toplam)}</td>
                  <td className="py-2.5 text-text-dim">
                    {(s.durum as SiparisDurum) === "yolda" ? "Yolda" : "Beklemede"}
                  </td>
                </tr>
              );
            })}
            {siparisler?.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-text-dim">
                  Bu dönemde teslim edilmesi gereken sipariş yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
