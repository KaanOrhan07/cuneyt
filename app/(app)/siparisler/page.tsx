import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Button, Panel, Select } from "@/components/ui";
import { DurumSelect } from "@/components/durum-select";
import { formatTL } from "@/lib/format";
import type { Firma, SiparisDurum, SiparisTip, Urun } from "@/lib/types";

type Filters = {
  tip?: string;
  firma_id?: string;
  urun_id?: string;
  durum?: string;
  baslangic?: string;
  bitis?: string;
};

export default async function SiparislerPage({
  searchParams,
}: {
  searchParams: Promise<Filters>;
}) {
  const filters = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("siparisler")
    .select("id, tip, durum, tarih_saat, firmalar(id, ad, renk), siparis_kalemleri(adet, birim_fiyat, urun_id, urunler(ad))")
    .order("tarih_saat", { ascending: false });

  if (filters.tip) query = query.eq("tip", filters.tip);
  if (filters.firma_id) query = query.eq("firma_id", filters.firma_id);
  if (filters.durum) query = query.eq("durum", filters.durum);
  if (filters.baslangic) query = query.gte("tarih_saat", filters.baslangic);
  if (filters.bitis) query = query.lte("tarih_saat", filters.bitis);

  const { data: siparisler } = await query;

  const [{ data: firmalar }, { data: urunler }] = await Promise.all([
    supabase.from("firmalar").select("*").is("deleted_at", null).order("ad"),
    supabase.from("urunler").select("*").is("deleted_at", null).order("ad"),
  ]);

  const filtered = filters.urun_id
    ? siparisler?.filter((s) =>
        (s.siparis_kalemleri as { urun_id: string }[]).some((k) => k.urun_id === filters.urun_id),
      )
    : siparisler;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-[22px] font-semibold">Siparişler</h1>
          <p className="mt-0.5 text-[13px] text-text-dim">Tüm alış ve satış siparişleri</p>
        </div>
        <Link href="/siparisler/yeni">
          <Button>+ Yeni Sipariş</Button>
        </Link>
      </div>

      <form className="mb-5 flex flex-wrap gap-2.5">
        <Select name="tip" defaultValue={filters.tip ?? ""}>
          <option value="">Tüm Tipler</option>
          <option value="alis">Alış</option>
          <option value="satis">Satış</option>
        </Select>
        <Select name="firma_id" defaultValue={filters.firma_id ?? ""}>
          <option value="">Tüm Firmalar</option>
          {(firmalar as Firma[] | null)?.map((f) => (
            <option key={f.id} value={f.id}>
              {f.ad}
            </option>
          ))}
        </Select>
        <Select name="urun_id" defaultValue={filters.urun_id ?? ""}>
          <option value="">Tüm Ürünler</option>
          {(urunler as Urun[] | null)?.map((u) => (
            <option key={u.id} value={u.id}>
              {u.ad}
            </option>
          ))}
        </Select>
        <Select name="durum" defaultValue={filters.durum ?? ""}>
          <option value="">Tüm Durumlar</option>
          <option value="beklemede">Beklemede</option>
          <option value="yolda">Yolda</option>
          <option value="teslim_edildi">Teslim edildi</option>
        </Select>
        <input
          type="date"
          name="baslangic"
          defaultValue={filters.baslangic ?? ""}
          className="rounded-[9px] border border-border bg-bg px-3 py-2 text-[13px]"
        />
        <input
          type="date"
          name="bitis"
          defaultValue={filters.bitis ?? ""}
          className="rounded-[9px] border border-border bg-bg px-3 py-2 text-[13px]"
        />
        <Button type="submit" variant="secondary">
          Filtrele
        </Button>
      </form>

      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-dim">
              <th className="pb-2.5 text-left font-semibold">Tarih</th>
              <th className="pb-2.5 text-left font-semibold">Firma</th>
              <th className="pb-2.5 text-left font-semibold">Tip</th>
              <th className="pb-2.5 text-left font-semibold">Ürünler</th>
              <th className="pb-2.5 text-left font-semibold">Tutar</th>
              <th className="pb-2.5 text-left font-semibold">Durum</th>
            </tr>
          </thead>
          <tbody>
            {filtered?.map((s) => {
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
                  <td className="py-2.5">
                    <DurumSelect id={s.id} durum={s.durum as SiparisDurum} />
                  </td>
                </tr>
              );
            })}
            {filtered?.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-text-dim">
                  Kayıt bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
