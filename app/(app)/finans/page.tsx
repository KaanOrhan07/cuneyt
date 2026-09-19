import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { tumSatirlar } from "@/lib/supabase/hepsi";
import { Button, Panel, Select, StatCard } from "@/components/ui";
import { CariHareketForm } from "@/components/cari/cari-hareket-form";
import { CariHareketRow } from "@/components/cari/cari-hareket-row";
import { GiderForm } from "@/components/finans/gider-form";
import { GiderListesi } from "@/components/finans/gider-listesi";
import { formatParaBirimi, formatTarih } from "@/lib/format";
import { istanbulDayKey } from "@/lib/tr-time";
import {
  DONEMLER,
  finansOzeti,
  firmaBakiyeleri,
  hareketDurumu,
  type FinansGider,
  type FinansHareket,
  type FinansOdeme,
  type FirmaBakiye,
  type ParaBirimiOzeti,
  type Yon,
} from "@/lib/finans";
import type { CariHareket, CariOdeme, Gider } from "@/lib/types";

type Filtre = { yon?: string; durum?: string; firma?: string };

type HareketSatiri = CariHareket & { firmalar: { ad: string } | null };

export default async function FinansPage({ searchParams }: { searchParams: Promise<Filtre> }) {
  const filtre = await searchParams;
  const supabase = await createClient();
  const bugun = istanbulDayKey(new Date());

  const [hareketSonuc, odemeSonuc, giderSonuc, { data: firmalar }] = await Promise.all([
    tumSatirlar<HareketSatiri>(supabase, "cari_hareketler", "*, firmalar(ad)"),
    tumSatirlar<CariOdeme>(supabase, "cari_odemeler"),
    tumSatirlar<Gider>(supabase, "giderler"),
    supabase.from("firmalar").select("id, ad").is("deleted_at", null).order("ad"),
  ]);

  const hata = hareketSonuc.error ?? odemeSonuc.error ?? giderSonuc.error;

  const odemeByHareket = new Map<string, CariOdeme[]>();
  for (const o of odemeSonuc.data) {
    const l = odemeByHareket.get(o.cari_hareket_id) ?? [];
    l.push(o);
    odemeByHareket.set(o.cari_hareket_id, l);
  }

  const hareketler: FinansHareket[] = hareketSonuc.data.map((h) => {
    const odenen = (odemeByHareket.get(h.id) ?? []).reduce((s, o) => s + o.tutar, 0);
    return {
      id: h.id,
      firma_id: h.firma_id,
      firma_ad: h.firmalar?.ad ?? "—",
      tarih: h.tarih,
      fatura_no: h.fatura_no,
      aciklama: h.aciklama,
      tutar: h.tutar,
      vade_tarihi: h.vade_tarihi,
      yon: (h.yon ?? "alacak") as Yon,
      para_birimi: h.para_birimi ?? "TL",
      odenen,
      kalan: h.tutar - odenen,
    };
  });

  const hareketBilgi = new Map(hareketler.map((h) => [h.id, h]));
  const odemeler: FinansOdeme[] = odemeSonuc.data.flatMap((o) => {
    const h = hareketBilgi.get(o.cari_hareket_id);
    return h ? [{ tarih: o.tarih, tutar: o.tutar, yon: h.yon, para_birimi: h.para_birimi }] : [];
  });
  const giderler: FinansGider[] = giderSonuc.data.map((g) => ({
    tarih: g.tarih,
    tutar: g.tutar,
    para_birimi: g.para_birimi ?? "TL",
  }));

  const ozetler = finansOzeti(hareketler, odemeler, giderler, bugun).filter(
    (o) =>
      o.paraBirimi === "TL" ||
      o.toplamGelir || o.toplamGider || o.toplamAlacak || o.toplamBorc,
  );

  const alacaklar = firmaBakiyeleri(hareketler, "alacak", bugun);
  const borclar = firmaBakiyeleri(hareketler, "verecek", bugun);

  const gorunen = hareketSonuc.data
    .filter((h) => {
      const fh = hareketBilgi.get(h.id)!;
      if (filtre.yon && fh.yon !== filtre.yon) return false;
      if (filtre.firma && h.firma_id !== filtre.firma) return false;
      if (filtre.durum) {
        const d = hareketDurumu(fh, bugun);
        if (filtre.durum === "acik" ? d === "odendi" : d !== filtre.durum) return false;
      }
      return true;
    })
    .sort((a, b) => (a.tarih < b.tarih ? 1 : -1));

  const giderlerSirali = [...giderSonuc.data].sort((a, b) => (a.tarih < b.tarih ? 1 : -1));

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[22px] font-semibold">Finans</h1>
          <p className="mt-0.5 text-[13px] text-text-dim">
            Cari hesaplar, alacak/verecek, giderler ve kâr durumu — para birimi bazında
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <CariHareketForm firmalar={firmalar ?? []} />
            <GiderForm />
          </div>
        </div>
      </div>

      {hata && (
        <p className="mb-4 rounded-lg bg-orange-soft px-3 py-2 text-[12.5px] text-orange">
          Veritabanı güncellemesi (migration) henüz çalıştırılmamış: {hata}
        </p>
      )}

      <div className="flex flex-col gap-6">
        {ozetler.map((o) => (
          <ParaBirimiBlogu key={o.paraBirimi} ozet={o} />
        ))}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <BakiyeTablosu
            baslik="Bize Borcu Olanlar (Alacaklarımız)"
            bos="Bize borcu olan firma yok."
            liste={alacaklar}
            bugun={bugun}
          />
          <BakiyeTablosu
            baslik="Bizim Borcumuz Olanlar (Verecekler)"
            bos="Borcumuz olan firma yok."
            liste={borclar}
            bugun={bugun}
          />
        </div>

        <Panel title="Cari Hareketler">
          <form className="mb-4 flex flex-wrap gap-2.5">
            <Select name="yon" defaultValue={filtre.yon ?? ""}>
              <option value="">Alacak + Verecek</option>
              <option value="alacak">Sadece Alacak</option>
              <option value="verecek">Sadece Verecek</option>
            </Select>
            <Select name="durum" defaultValue={filtre.durum ?? ""}>
              <option value="">Tüm Durumlar</option>
              <option value="acik">Açık (ödenmemiş + kısmi)</option>
              <option value="odenmedi">Ödenmedi</option>
              <option value="kismi">Kısmi ödendi</option>
              <option value="gecikmis">Vadesi geçmiş</option>
              <option value="odendi">Ödendi / Tahsil edildi</option>
            </Select>
            <Select name="firma" defaultValue={filtre.firma ?? ""}>
              <option value="">Tüm Firmalar</option>
              {firmalar?.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.ad}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="secondary">
              Filtrele
            </Button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-dim">
                  <th className="pb-2.5 text-left font-semibold">Firma</th>
                  <th className="pb-2.5 text-left font-semibold">Yön</th>
                  <th className="pb-2.5 text-left font-semibold">Tarih</th>
                  <th className="pb-2.5 text-left font-semibold">Fatura No</th>
                  <th className="pb-2.5 text-left font-semibold">Açıklama</th>
                  <th className="pb-2.5 text-left font-semibold">Tutar</th>
                  <th className="pb-2.5 text-left font-semibold">Ödenen</th>
                  <th className="pb-2.5 text-left font-semibold">Kalan</th>
                  <th className="pb-2.5 text-left font-semibold">Vade</th>
                  <th className="pb-2.5 text-left font-semibold">Durum</th>
                  <th className="pb-2.5" />
                </tr>
              </thead>
              <tbody>
                {gorunen.map((h) => (
                  <CariHareketRow
                    key={h.id}
                    hareket={h}
                    odemeler={odemeByHareket.get(h.id) ?? []}
                    firmaId={h.firma_id}
                    firmaAd={h.firmalar?.ad ?? "—"}
                    bugun={bugun}
                  />
                ))}
                {gorunen.length === 0 && (
                  <tr>
                    <td colSpan={11} className="py-4 text-text-dim">
                      Kayıt bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Giderler">
          <GiderListesi giderler={giderlerSirali} />
        </Panel>
      </div>
    </div>
  );
}

function ParaBirimiBlogu({ ozet: o }: { ozet: ParaBirimiOzeti }) {
  const f = (n: number) => formatParaBirimi(n, o.paraBirimi);
  const renk = (n: number) => (n < 0 ? "var(--orange)" : n > 0 ? "var(--green)" : undefined);

  const satir = (etiket: string, degerler: number[], gecikmis?: number, kalin = false, renkli = false) => (
    <tr className="border-b border-border last:border-0">
      <td className={`py-2.5 pr-3 ${kalin ? "font-semibold" : ""}`}>{etiket}</td>
      {gecikmis !== undefined && (
        <td className="py-2.5 text-right font-mono text-orange">{gecikmis ? f(gecikmis) : "—"}</td>
      )}
      {degerler.map((d, i) => (
        <td
          key={i}
          className={`py-2.5 text-right font-mono ${kalin ? "font-semibold" : ""}`}
          style={renkli ? { color: renk(d) } : undefined}
        >
          {d ? f(d) : "—"}
        </td>
      ))}
    </tr>
  );

  const net = o.beklenenAlacak.map((a, i) => Math.round((a - o.beklenenBorc[i]) * 100) / 100);
  const kar = o.gerceklesenGelir.map((g, i) => Math.round((g - o.gerceklesenGider[i]) * 100) / 100);

  return (
    <Panel title={`${o.paraBirimi} — Genel Durum`}>
      <div className="mb-5 grid grid-cols-2 gap-3.5 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Toplam Gelir" value={f(o.toplamGelir)} valueColor="var(--green)" />
        <StatCard label="Toplam Gider" value={f(o.toplamGider)} />
        <StatCard label="Toplam Kâr" value={f(o.toplamKar)} valueColor={renk(o.toplamKar)} />
        <StatCard label="Toplam Alacak" value={f(o.toplamAlacak)} />
        <StatCard label="Toplam Borç" value={f(o.toplamBorc)} />
        <StatCard
          label="Gecikmiş Alacak"
          value={f(o.gecikmisAlacak)}
          valueColor={o.gecikmisAlacak > 0 ? "var(--orange)" : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="overflow-x-auto">
          <div className="mb-2 text-[12.5px] font-semibold text-text-dim">
            Beklenen (vadesi gelecek olanlar — bugünden itibaren)
          </div>
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-dim">
                <th className="pb-2 text-left font-semibold" />
                <th className="pb-2 text-right font-semibold">Gecikmiş</th>
                {DONEMLER.map((d) => (
                  <th key={d.key} className="pb-2 text-right font-semibold">
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {satir("Beklenen Gelir (Alacak)", o.beklenenAlacak, o.gecikmisAlacak)}
              {satir("Ödenecek (Borç)", o.beklenenBorc, o.gecikmisBorc)}
              {satir("Beklenen Net", net, o.gecikmisAlacak - o.gecikmisBorc, true, true)}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto">
          <div className="mb-2 text-[12.5px] font-semibold text-text-dim">
            Gerçekleşen (tahsilat/ödeme — geriye doğru)
          </div>
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-dim">
                <th className="pb-2 text-left font-semibold" />
                {DONEMLER.map((d) => (
                  <th key={d.key} className="pb-2 text-right font-semibold">
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {satir("Gelir (Tahsilat)", o.gerceklesenGelir)}
              {satir("Gider (Ödeme + Gider)", o.gerceklesenGider)}
              {satir("Kâr", kar, undefined, true, true)}
            </tbody>
          </table>
        </div>
      </div>
    </Panel>
  );
}

function BakiyeTablosu({
  baslik,
  bos,
  liste,
  bugun,
}: {
  baslik: string;
  bos: string;
  liste: FirmaBakiye[];
  bugun: string;
}) {
  return (
    <Panel title={baslik}>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-dim">
              <th className="pb-2.5 text-left font-semibold">Firma</th>
              <th className="pb-2.5 text-right font-semibold">Toplam</th>
              <th className="pb-2.5 text-right font-semibold">Ödenen</th>
              <th className="pb-2.5 text-right font-semibold">Kalan</th>
              <th className="pb-2.5 text-left font-semibold pl-3">Vade</th>
              <th className="pb-2.5 text-left font-semibold">Durum</th>
            </tr>
          </thead>
          <tbody>
            {liste.map((b) => (
              <tr key={`${b.firma_id}|${b.para_birimi}`} className="border-b border-border last:border-0">
                <td className="py-2.5 font-medium">
                  <Link href={`/firmalar/${b.firma_id}?bolum=cari`} className="hover:text-green hover:underline">
                    {b.firma_ad}
                  </Link>
                </td>
                <td className="py-2.5 text-right font-mono">{formatParaBirimi(b.toplam, b.para_birimi)}</td>
                <td className="py-2.5 text-right font-mono">{formatParaBirimi(b.odenen, b.para_birimi)}</td>
                <td
                  className={`py-2.5 text-right font-mono font-semibold ${b.kalan > 0 ? "text-orange" : ""}`}
                >
                  {formatParaBirimi(b.kalan, b.para_birimi)}
                </td>
                <td className="py-2.5 pl-3 font-mono text-text-dim">
                  {b.enYakinVade ? formatTarih(b.enYakinVade) : "—"}
                </td>
                <td className="py-2.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      b.kalan <= 0
                        ? "bg-green-soft text-green"
                        : b.gecikmis || (b.enYakinVade && b.enYakinVade < bugun)
                          ? "bg-orange-soft text-[#C74519]"
                          : "bg-bg-elev text-text-dim"
                    }`}
                  >
                    {b.kalan <= 0 ? "Kapandı" : b.gecikmis ? "Vadesi geçmiş" : "Açık"}
                  </span>
                </td>
              </tr>
            ))}
            {liste.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-text-dim">
                  {bos}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
