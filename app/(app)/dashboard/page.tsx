import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Button, Panel, StatCard, StatusDot } from "@/components/ui";
import { formatTL } from "@/lib/format";
import type { Firma, SiparisDurum, SiparisTip, Urun } from "@/lib/types";

const GUN_LABEL = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

export default async function DashboardPage() {
  const supabase = await createClient();

  const now = new Date();
  const ayBasi = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const yediGunOnce = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
  yediGunOnce.setHours(0, 0, 0, 0);

  const [
    { data: buAySatisKalemleri },
    { data: acikSiparisler },
    { data: kritikUrunler },
    { data: haftalikSiparisler },
    { data: sonSiparisler },
  ] = await Promise.all([
    supabase
      .from("siparis_kalemleri")
      .select("adet, birim_fiyat, urunler(ortalama_maliyet), siparisler!inner(tip, tarih_saat)")
      .eq("siparisler.tip", "satis")
      .gte("siparisler.tarih_saat", ayBasi),
    supabase.from("siparisler").select("tip").neq("durum", "teslim_edildi"),
    supabase
      .from("urunler")
      .select("*")
      .is("deleted_at", null)
      .order("stok_adet", { ascending: true }),
    supabase
      .from("siparisler")
      .select("tip, tarih_saat, siparis_kalemleri(adet, birim_fiyat)")
      .gte("tarih_saat", yediGunOnce.toISOString()),
    supabase
      .from("siparisler")
      .select("id, tip, durum, tarih_saat, firmalar(ad, renk), siparis_kalemleri(adet, birim_fiyat, urunler(ad))")
      .order("tarih_saat", { ascending: false })
      .limit(5),
  ]);

  type SatisKalem = {
    adet: number;
    birim_fiyat: number;
    urunler: { ortalama_maliyet: number } | null;
  };
  const kalemler = (buAySatisKalemleri as unknown as SatisKalem[]) ?? [];
  const ciro = kalemler.reduce((sum, k) => sum + k.adet * k.birim_fiyat, 0);
  const maliyet = kalemler.reduce((sum, k) => sum + k.adet * (k.urunler?.ortalama_maliyet ?? 0), 0);
  const kar = ciro - maliyet;

  const acikAlis = acikSiparisler?.filter((s) => s.tip === "alis").length ?? 0;
  const acikSatis = acikSiparisler?.filter((s) => s.tip === "satis").length ?? 0;

  const kritikSayi = (kritikUrunler as Urun[] | null)?.filter((u) => u.stok_adet <= u.kritik_stok_esigi).length ?? 0;
  const kritikListe = (kritikUrunler as Urun[] | null)?.filter((u) => u.stok_adet <= u.kritik_stok_esigi).slice(0, 4) ?? [];

  const gunler: { label: string; alis: number; satis: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(yediGunOnce.getTime() + i * 24 * 60 * 60 * 1000);
    gunler.push({ label: GUN_LABEL[d.getDay()], alis: 0, satis: 0 });
  }
  type HaftalikSiparis = {
    tip: SiparisTip;
    tarih_saat: string;
    siparis_kalemleri: { adet: number; birim_fiyat: number }[];
  };
  (haftalikSiparisler as unknown as HaftalikSiparis[] | null)?.forEach((s) => {
    const gunIndex = Math.floor(
      (new Date(s.tarih_saat).setHours(0, 0, 0, 0) - yediGunOnce.getTime()) / (24 * 60 * 60 * 1000),
    );
    if (gunIndex < 0 || gunIndex > 6) return;
    const tutar = s.siparis_kalemleri.reduce((sum, k) => sum + k.adet * k.birim_fiyat, 0);
    if (s.tip === "alis") gunler[gunIndex].alis += tutar;
    else gunler[gunIndex].satis += tutar;
  });
  const maxTutar = Math.max(1, ...gunler.flatMap((g) => [g.alis, g.satis]));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-[22px] font-semibold">Genel Bakış</h1>
          <p className="mt-0.5 text-[13px] text-text-dim">
            {now.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <Link href="/siparisler/yeni">
          <Button>+ Yeni Sipariş</Button>
        </Link>
      </div>

      <div className="mb-5 grid grid-cols-4 gap-3.5">
        <StatCard label="Bu Ayki Ciro" value={formatTL(ciro)} />
        <StatCard label="Kâr" value={formatTL(kar)} />
        <StatCard
          label="Açık Sipariş"
          value={acikAlis + acikSatis}
          delta={`${acikAlis} gelen · ${acikSatis} giden`}
          deltaTone="neutral"
        />
        <StatCard
          label="Kritik Stok"
          value={`${kritikSayi} ürün`}
          valueColor={kritikSayi > 0 ? "var(--orange)" : undefined}
          delta={kritikSayi > 0 ? "İncelenmesi gerekiyor" : "Sorun yok"}
          deltaTone={kritikSayi > 0 ? "down" : "up"}
        />
      </div>

      <div className="mb-4 grid grid-cols-[1.4fr_1fr] gap-4">
        <Panel title="Haftalık Hareket">
          <div className="flex h-[130px] items-end gap-2">
            {gunler.map((g, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex h-[100px] w-full flex-col justify-end gap-0.5">
                  <div
                    className="w-full rounded-t-[3px] bg-green"
                    style={{ height: `${(g.alis / maxTutar) * 100}%` }}
                  />
                  <div
                    className="w-full rounded-t-[3px] bg-orange opacity-85"
                    style={{ height: `${(g.satis / maxTutar) * 100}%` }}
                  />
                </div>
                <div className="text-[10.5px] text-text-dim">{g.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-3.5 flex gap-4 text-[11.5px] text-text-dim">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-green" /> Gelen (alış)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-orange" /> Giden (satış)
            </span>
          </div>
        </Panel>

        <Panel title="Kritik Stoktaki Ürünler">
          <div className="flex flex-col">
            {kritikListe.map((u) => (
              <div key={u.id} className="flex items-center justify-between border-b border-border py-2.5 last:border-0">
                <div className="text-[13px] font-medium">{u.ad}</div>
                <div className="font-mono text-[13px] font-medium text-orange">{u.stok_adet} adet</div>
              </div>
            ))}
            {kritikListe.length === 0 && (
              <p className="py-2 text-[13px] text-text-dim">Kritik stokta ürün yok.</p>
            )}
          </div>
        </Panel>
      </div>

      <Panel title="Son Siparişler">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-dim">
              <th className="pb-2.5 text-left font-semibold">Tarih</th>
              <th className="pb-2.5 text-left font-semibold">Firma</th>
              <th className="pb-2.5 text-left font-semibold">Tip</th>
              <th className="pb-2.5 text-left font-semibold">Ürün</th>
              <th className="pb-2.5 text-left font-semibold">Tutar</th>
              <th className="pb-2.5 text-left font-semibold">Durum</th>
            </tr>
          </thead>
          <tbody>
            {sonSiparisler?.map((s) => {
              const firma = s.firmalar as unknown as Firma;
              const kalemler = s.siparis_kalemleri as unknown as {
                adet: number;
                birim_fiyat: number;
                urunler: { ad: string } | null;
              }[];
              const toplam = kalemler.reduce((sum, k) => sum + k.adet * k.birim_fiyat, 0);
              return (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="py-2.5 font-mono">
                    {new Date(s.tarih_saat).toLocaleString("tr-TR")}
                  </td>
                  <td className="py-2.5">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: firma?.renk }} />
                      {firma?.ad}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <Badge tip={s.tip as SiparisTip} />
                  </td>
                  <td className="py-2.5">{kalemler.map((k) => k.urunler?.ad).join(", ")}</td>
                  <td className="py-2.5 font-mono">{formatTL(toplam)}</td>
                  <td className="py-2.5">
                    <StatusDot durum={s.durum as SiparisDurum} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
