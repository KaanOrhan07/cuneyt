import { createClient } from "@/lib/supabase/server";
import { Panel, StatCard, Button } from "@/components/ui";
import { ExportExcelButton } from "@/components/export-excel-button";
import { formatTL, formatTarih } from "@/lib/format";
import { istanbulToday, parseIstanbulDate } from "@/lib/tr-time";

type Filters = { baslangic?: string; bitis?: string };

type KalemRow = {
  adet: number;
  birim_fiyat: number;
  urun_id: string;
  urunler: { ad: string; ortalama_maliyet: number } | null;
  siparisler: { tip: "alis" | "satis"; tarih_saat: string; firma_id: string; firmalar: { ad: string } | null } | null;
};

export default async function RaporlarPage({
  searchParams,
}: {
  searchParams: Promise<Filters>;
}) {
  const filters = await searchParams;
  const supabase = await createClient();

  const bugun = istanbulToday();
  const baslangicStr = filters.baslangic ?? `${bugun.year}-${String(bugun.month).padStart(2, "0")}-01`;
  const bitisStr =
    filters.bitis ??
    `${bugun.year}-${String(bugun.month).padStart(2, "0")}-${String(bugun.day).padStart(2, "0")}`;

  const baslangic = parseIstanbulDate(baslangicStr);
  const bitisGunBaslangici = parseIstanbulDate(bitisStr);
  const bitis = new Date(bitisGunBaslangici.getTime() + 24 * 60 * 60 * 1000 - 1);

  const { data } = await supabase
    .from("siparis_kalemleri")
    .select(
      "adet, birim_fiyat, urun_id, urunler(ad, ortalama_maliyet), siparisler!inner(tip, tarih_saat, firma_id, durum, firmalar(ad))",
    )
    .neq("siparisler.durum", "iptal_edildi")
    .gte("siparisler.tarih_saat", baslangic.toISOString())
    .lte("siparisler.tarih_saat", bitis.toISOString());

  const kalemler = (data as unknown as KalemRow[]) ?? [];
  const satisKalemleri = kalemler.filter((k) => k.siparisler?.tip === "satis");

  const ciro = satisKalemleri.reduce((s, k) => s + k.adet * k.birim_fiyat, 0);
  const maliyet = satisKalemleri.reduce((s, k) => s + k.adet * (k.urunler?.ortalama_maliyet ?? 0), 0);
  const kar = ciro - maliyet;

  const { count: siparisSayisi } = await supabase
    .from("siparisler")
    .select("id", { count: "exact", head: true })
    .neq("durum", "iptal_edildi")
    .gte("tarih_saat", baslangic.toISOString())
    .lte("tarih_saat", bitis.toISOString());

  type UrunOzet = { ad: string; adet: number; tutar: number; kar: number };
  const urunMap = new Map<string, UrunOzet>();
  for (const k of satisKalemleri) {
    const ad = k.urunler?.ad ?? "—";
    const mevcut = urunMap.get(k.urun_id) ?? { ad, adet: 0, tutar: 0, kar: 0 };
    mevcut.adet += k.adet;
    mevcut.tutar += k.adet * k.birim_fiyat;
    mevcut.kar += k.adet * (k.birim_fiyat - (k.urunler?.ortalama_maliyet ?? 0));
    urunMap.set(k.urun_id, mevcut);
  }
  const urunOzetleri = [...urunMap.values()].sort((a, b) => b.tutar - a.tutar);
  const enCokSatanlar = urunOzetleri.slice(0, 5);

  type FirmaOzet = { ad: string; alisTutar: number; satisTutar: number };
  const firmaMap = new Map<string, FirmaOzet>();
  for (const k of kalemler) {
    const firmaId = k.siparisler?.firma_id;
    if (!firmaId) continue;
    const ad = k.siparisler?.firmalar?.ad ?? "—";
    const mevcut = firmaMap.get(firmaId) ?? { ad, alisTutar: 0, satisTutar: 0 };
    const tutar = k.adet * k.birim_fiyat;
    if (k.siparisler?.tip === "alis") mevcut.alisTutar += tutar;
    else mevcut.satisTutar += tutar;
    firmaMap.set(firmaId, mevcut);
  }
  const firmaOzetleri = [...firmaMap.values()].sort(
    (a, b) => b.alisTutar + b.satisTutar - (a.alisTutar + a.satisTutar),
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-[22px] font-semibold">Raporlar</h1>
          <p className="mt-0.5 text-[13px] text-text-dim">
            {formatTarih(baslangic)} – {formatTarih(bitisGunBaslangici)} aralığı
          </p>
        </div>
        <form className="flex items-end gap-2.5">
          <input
            type="date"
            name="baslangic"
            defaultValue={baslangicStr}
            className="rounded-[9px] border border-border bg-bg px-3 py-2 text-[13px]"
          />
          <input
            type="date"
            name="bitis"
            defaultValue={bitisStr}
            className="rounded-[9px] border border-border bg-bg px-3 py-2 text-[13px]"
          />
          <Button type="submit" variant="secondary">
            Filtrele
          </Button>
        </form>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3.5">
        <StatCard label="Ciro" value={formatTL(ciro)} />
        <StatCard label="Kâr" value={formatTL(kar)} />
        <StatCard label="Sipariş Sayısı" value={siparisSayisi ?? 0} />
      </div>

      <div className="mb-4">
        <Panel
          title="En Çok Satan Ürünler"
          action={
            <ExportExcelButton
              filename="en-cok-satanlar"
              sheetName="En Çok Satanlar"
              rows={enCokSatanlar.map((u) => ({
                Ürün: u.ad,
                Adet: u.adet,
                Tutar: u.tutar,
                Kâr: Math.round(u.kar * 100) / 100,
              }))}
            />
          }
        >
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-dim">
                <th className="pb-2.5 text-left font-semibold">Ürün</th>
                <th className="pb-2.5 text-left font-semibold">Adet</th>
                <th className="pb-2.5 text-left font-semibold">Tutar</th>
                <th className="pb-2.5 text-left font-semibold">Kâr</th>
              </tr>
            </thead>
            <tbody>
              {enCokSatanlar.map((u) => (
                <tr key={u.ad} className="border-b border-border last:border-0">
                  <td className="py-2.5 font-medium">{u.ad}</td>
                  <td className="py-2.5 font-mono">{u.adet}</td>
                  <td className="py-2.5 font-mono">{formatTL(u.tutar)}</td>
                  <td className="py-2.5 font-mono">{formatTL(u.kar)}</td>
                </tr>
              ))}
              {enCokSatanlar.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-text-dim">
                    Bu aralıkta satış yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Panel>
      </div>

      <div className="mb-4">
        <Panel
          title="Ürün Bazlı Rapor"
          action={
            <ExportExcelButton
              filename="urun-bazli-rapor"
              sheetName="Ürün Bazlı"
              rows={urunOzetleri.map((u) => ({
                Ürün: u.ad,
                "Satılan Adet": u.adet,
                "Satış Tutarı": u.tutar,
                Kâr: Math.round(u.kar * 100) / 100,
              }))}
            />
          }
        >
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-dim">
                <th className="pb-2.5 text-left font-semibold">Ürün</th>
                <th className="pb-2.5 text-left font-semibold">Satılan Adet</th>
                <th className="pb-2.5 text-left font-semibold">Satış Tutarı</th>
                <th className="pb-2.5 text-left font-semibold">Kâr</th>
              </tr>
            </thead>
            <tbody>
              {urunOzetleri.map((u) => (
                <tr key={u.ad} className="border-b border-border last:border-0">
                  <td className="py-2.5 font-medium">{u.ad}</td>
                  <td className="py-2.5 font-mono">{u.adet}</td>
                  <td className="py-2.5 font-mono">{formatTL(u.tutar)}</td>
                  <td className="py-2.5 font-mono">{formatTL(u.kar)}</td>
                </tr>
              ))}
              {urunOzetleri.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-text-dim">
                    Bu aralıkta satış yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Panel>
      </div>

      <div>
        <Panel
          title="Firma Bazlı Rapor"
          action={
            <ExportExcelButton
              filename="firma-bazli-rapor"
              sheetName="Firma Bazlı"
              rows={firmaOzetleri.map((f) => ({
                Firma: f.ad,
                "Alış Tutarı": f.alisTutar,
                "Satış Tutarı": f.satisTutar,
              }))}
            />
          }
        >
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-dim">
                <th className="pb-2.5 text-left font-semibold">Firma</th>
                <th className="pb-2.5 text-left font-semibold">Alış Tutarı</th>
                <th className="pb-2.5 text-left font-semibold">Satış Tutarı</th>
              </tr>
            </thead>
            <tbody>
              {firmaOzetleri.map((f) => (
                <tr key={f.ad} className="border-b border-border last:border-0">
                  <td className="py-2.5 font-medium">{f.ad}</td>
                  <td className="py-2.5 font-mono">{formatTL(f.alisTutar)}</td>
                  <td className="py-2.5 font-mono">{formatTL(f.satisTutar)}</td>
                </tr>
              ))}
              {firmaOzetleri.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-text-dim">
                    Bu aralıkta hareket yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
