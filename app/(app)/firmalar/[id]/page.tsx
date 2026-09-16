import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button, Panel } from "@/components/ui";
import { DurumSelect } from "@/components/durum-select";
import { SiparisDeleteButton } from "@/components/siparis-delete-button";
import { TeklifDurumSelect } from "@/components/teklif-durum-select";
import { CariHesapPanel } from "@/components/cari/cari-hesap-panel";
import { FirmaIletisimPanel } from "@/components/firma-iletisim-panel";
import { formatTL, formatTarih, formatTarihSaat } from "@/lib/format";
import type { CariHareket, CariOdeme, SiparisDurum, TeklifDurum } from "@/lib/types";

type Bolum = "siparisler" | "teklifler" | "cari";

export default async function FirmaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tip?: string; bolum?: string }>;
}) {
  const { id } = await params;
  const { tip = "alis", bolum = "siparisler" } = await searchParams;
  const bolumKey = bolum as Bolum;
  const supabase = await createClient();

  const { data: firma } = await supabase.from("firmalar").select("*").eq("id", id).single();
  if (!firma) notFound();

  const [
    { data: siparisler, error: siparisHata },
    { data: teklifler, error: teklifHata },
    { data: hareketler, error: cariHata },
    { data: odemeler },
  ] = await Promise.all([
      supabase
        .from("siparisler")
        .select(
          "id, tip, durum, tarih_saat, son_teslim_tarihi, siparis_kalemleri(adet, birim_fiyat, urunler(ad))",
        )
        .eq("firma_id", id)
        .eq("tip", tip)
        .order("tarih_saat", { ascending: false }),
      supabase
        .from("teklifler")
        .select("id, tip, durum, tarih_saat, teklif_no, teklif_kalemleri(adet, birim_fiyat, urunler(ad))")
        .eq("firma_id", id)
        .order("tarih_saat", { ascending: false }),
      supabase
        .from("cari_hareketler")
        .select("*")
        .eq("firma_id", id)
        .order("tarih", { ascending: false }),
      supabase
        .from("cari_odemeler")
        .select("*, cari_hareketler!inner(firma_id)")
        .eq("cari_hareketler.firma_id", id),
    ]);

  const odemelerByHareket = new Map<string, CariOdeme[]>();
  (odemeler as unknown as CariOdeme[] | null)?.forEach((o) => {
    const list = odemelerByHareket.get(o.cari_hareket_id) ?? [];
    list.push(o);
    odemelerByHareket.set(o.cari_hareket_id, list);
  });

  const bolumler: { key: Bolum; label: string }[] = [
    { key: "siparisler", label: "Siparişler" },
    { key: "teklifler", label: "Teklifler" },
    { key: "cari", label: "Cari Hesap" },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span className="h-3 w-3 rounded-full" style={{ background: firma.renk }} />
        <div>
          <h1 className="font-display text-[22px] font-semibold">{firma.ad}</h1>
          <div className="mt-1 flex gap-1.5">
            {firma.is_tedarikci && (
              <span className="rounded-full bg-green-soft px-2 py-0.5 text-[11px] font-medium text-green">
                Tedarikçi
              </span>
            )}
            {firma.is_musteri && (
              <span className="rounded-full bg-orange-soft px-2 py-0.5 text-[11px] font-medium text-[#C74519]">
                Müşteri
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mb-5">
        <FirmaIletisimPanel
          firmaId={id}
          adres={firma.adres}
          telefon={firma.telefon}
          eposta={firma.eposta}
          vergiNo={firma.vergi_no}
        />
      </div>

      <div className="mb-5 flex gap-1 border-b border-border">
        {bolumler.map((b) => (
          <Link
            key={b.key}
            href={`/firmalar/${id}?bolum=${b.key}`}
            className={`-mb-px border-b-2 px-4 py-2.5 text-[13.5px] font-medium transition-colors ${
              bolumKey === b.key
                ? "border-green text-green"
                : "border-transparent text-text-dim hover:text-text"
            }`}
          >
            {b.label}
          </Link>
        ))}
      </div>

      {bolumKey === "siparisler" && siparisHata && (
        <p className="mb-4 rounded-lg bg-orange-soft px-3 py-2 text-[12.5px] text-orange">
          Bu bölüm için veritabanı güncellemesi (migration) henüz çalıştırılmamış: {siparisHata.message}
        </p>
      )}
      {bolumKey === "teklifler" && teklifHata && (
        <p className="mb-4 rounded-lg bg-orange-soft px-3 py-2 text-[12.5px] text-orange">
          Teklifler tablosu henüz oluşturulmamış — 0004_teklif_cari_teslimat.sql migration&apos;ını
          çalıştırın. ({teklifHata.message})
        </p>
      )}
      {bolumKey === "cari" && cariHata && (
        <p className="mb-4 rounded-lg bg-orange-soft px-3 py-2 text-[12.5px] text-orange">
          Cari hesap tabloları henüz oluşturulmamış — 0004_teklif_cari_teslimat.sql migration&apos;ını
          çalıştırın. ({cariHata.message})
        </p>
      )}

      {bolumKey === "siparisler" && (
        <div>
          <div className="mb-5 flex gap-2">
            <Link
              href={`/firmalar/${id}?bolum=siparisler&tip=alis`}
              className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium ${
                tip === "alis" ? "bg-green text-white" : "border border-border bg-card text-text-dim"
              }`}
            >
              Gelen (Alış)
            </Link>
            <Link
              href={`/firmalar/${id}?bolum=siparisler&tip=satis`}
              className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium ${
                tip === "satis" ? "bg-green text-white" : "border border-border bg-card text-text-dim"
              }`}
            >
              Giden (Satış)
            </Link>
          </div>

          <Panel>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-dim">
                  <th className="pb-2.5 text-left font-semibold">Tarih</th>
                  <th className="pb-2.5 text-left font-semibold">Ürünler</th>
                  <th className="pb-2.5 text-left font-semibold">Tutar</th>
                  <th className="pb-2.5 text-left font-semibold">Son Teslim</th>
                  <th className="pb-2.5 text-left font-semibold">Durum</th>
                  <th className="pb-2.5 text-left font-semibold" />
                </tr>
              </thead>
              <tbody>
                {siparisler?.map((s) => {
                  const kalemler = s.siparis_kalemleri as unknown as {
                    adet: number;
                    birim_fiyat: number;
                    urunler: { ad: string } | null;
                  }[];
                  const toplam = kalemler.reduce((sum, k) => sum + k.adet * k.birim_fiyat, 0);
                  const teslimGecti =
                    s.son_teslim_tarihi &&
                    s.durum !== "teslim_edildi" &&
                    s.durum !== "iptal_edildi" &&
                    new Date(s.son_teslim_tarihi) < new Date();
                  return (
                    <tr key={s.id} className="border-b border-border last:border-0">
                      <td className="py-2.5 font-mono">{formatTarihSaat(s.tarih_saat)}</td>
                      <td className="py-2.5">{kalemler.map((k) => k.urunler?.ad).join(", ")}</td>
                      <td className="py-2.5 font-mono">{formatTL(toplam)}</td>
                      <td className={`py-2.5 font-mono ${teslimGecti ? "font-semibold text-orange" : "text-text-dim"}`}>
                        {s.son_teslim_tarihi ? formatTarih(s.son_teslim_tarihi) : "—"}
                      </td>
                      <td className="py-2.5">
                        <DurumSelect id={s.id} durum={s.durum as SiparisDurum} />
                      </td>
                      <td className="py-2.5">
                        <SiparisDeleteButton id={s.id} />
                      </td>
                    </tr>
                  );
                })}
                {siparisler?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 text-text-dim">
                      Bu firmaya ait {tip === "alis" ? "gelen" : "giden"} sipariş yok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Panel>
        </div>
      )}

      {bolumKey === "teklifler" && (
        <div>
          <div className="mb-4">
            <Link href={`/teklifler/yeni?firma_id=${id}`}>
              <Button>+ Yeni Teklif</Button>
            </Link>
          </div>
          <Panel>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-dim">
                  <th className="pb-2.5 text-left font-semibold">Teklif No</th>
                  <th className="pb-2.5 text-left font-semibold">Tarih</th>
                  <th className="pb-2.5 text-left font-semibold">Tip</th>
                  <th className="pb-2.5 text-left font-semibold">Ürünler</th>
                  <th className="pb-2.5 text-left font-semibold">Tutar</th>
                  <th className="pb-2.5 text-left font-semibold">Durum</th>
                </tr>
              </thead>
              <tbody>
                {teklifler?.map((t) => {
                  const kalemler = t.teklif_kalemleri as unknown as {
                    adet: number;
                    birim_fiyat: number;
                    urunler: { ad: string } | null;
                  }[];
                  const toplam = kalemler.reduce((sum, k) => sum + k.adet * k.birim_fiyat, 0);
                  return (
                    <tr key={t.id} className="border-b border-border last:border-0">
                      <td className="py-2.5 font-mono font-medium">
                        <Link href={`/teklifler/${t.id}`} className="text-green hover:underline">
                          {t.teklif_no || "Detay →"}
                        </Link>
                      </td>
                      <td className="py-2.5 font-mono">{formatTarihSaat(t.tarih_saat)}</td>
                      <td className="py-2.5">{t.tip === "alis" ? "Alış" : "Satış"}</td>
                      <td className="py-2.5">{kalemler.map((k) => k.urunler?.ad).join(", ")}</td>
                      <td className="py-2.5 font-mono">{formatTL(toplam)}</td>
                      <td className="py-2.5">
                        <TeklifDurumSelect id={t.id} durum={t.durum as TeklifDurum} />
                      </td>
                    </tr>
                  );
                })}
                {teklifler?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 text-text-dim">
                      Bu firmaya ait teklif yok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Panel>
        </div>
      )}

      {bolumKey === "cari" && (
        <CariHesapPanel
          firmaId={id}
          hareketler={(hareketler as CariHareket[]) ?? []}
          odemelerByHareket={odemelerByHareket}
        />
      )}
    </div>
  );
}
