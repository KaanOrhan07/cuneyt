import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Button, Panel, Select } from "@/components/ui";
import { TeklifDurumSelect } from "@/components/teklif-durum-select";
import { formatTL, formatTarihSaat } from "@/lib/format";
import type { Firma, SiparisTip, TeklifDurum } from "@/lib/types";

type Filters = {
  tip?: string;
  firma_id?: string;
  durum?: string;
};

export default async function TekliflerPage({
  searchParams,
}: {
  searchParams: Promise<Filters>;
}) {
  const filters = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("teklifler")
    .select(
      "id, tip, durum, tarih_saat, teklif_no, firmalar(id, ad, renk), teklif_kalemleri(adet, birim_fiyat, urunler(ad))",
    )
    .order("tarih_saat", { ascending: false });

  if (filters.tip) query = query.eq("tip", filters.tip);
  if (filters.firma_id) query = query.eq("firma_id", filters.firma_id);
  if (filters.durum) query = query.eq("durum", filters.durum);

  const { data: teklifler, error: teklifHata } = await query;

  const { data: firmalar } = await supabase
    .from("firmalar")
    .select("*")
    .is("deleted_at", null)
    .order("ad");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-[22px] font-semibold">Teklifler</h1>
          <p className="mt-0.5 text-[13px] text-text-dim">
            Müşterilere verilen ve tedarikçilerden alınan teklifler
          </p>
        </div>
        <Link href="/teklifler/yeni">
          <Button>+ Yeni Teklif</Button>
        </Link>
      </div>

      {teklifHata && (
        <p className="mb-4 rounded-lg bg-orange-soft px-3 py-2 text-[12.5px] text-orange">
          Veritabanı güncellemesi (migration) henüz çalıştırılmamış: {teklifHata.message}
        </p>
      )}

      <form className="mb-5 flex flex-wrap gap-2.5">
        <Select name="tip" defaultValue={filters.tip ?? ""}>
          <option value="">Tüm Tipler</option>
          <option value="satis">Satış (verilen)</option>
          <option value="alis">Alış (alınan)</option>
        </Select>
        <Select name="firma_id" defaultValue={filters.firma_id ?? ""}>
          <option value="">Tüm Firmalar</option>
          {(firmalar as Firma[] | null)?.map((f) => (
            <option key={f.id} value={f.id}>
              {f.ad}
            </option>
          ))}
        </Select>
        <Select name="durum" defaultValue={filters.durum ?? ""}>
          <option value="">Tüm Durumlar</option>
          <option value="beklemede">Beklemede</option>
          <option value="kabul_edildi">Kabul edildi</option>
          <option value="reddedildi">Reddedildi</option>
        </Select>
        <Button type="submit" variant="secondary">
          Filtrele
        </Button>
      </form>

      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-dim">
              <th className="pb-2.5 text-left font-semibold">Teklif No</th>
              <th className="pb-2.5 text-left font-semibold">Tarih</th>
              <th className="pb-2.5 text-left font-semibold">Firma</th>
              <th className="pb-2.5 text-left font-semibold">Tip</th>
              <th className="pb-2.5 text-left font-semibold">Ürünler</th>
              <th className="pb-2.5 text-left font-semibold">Tutar</th>
              <th className="pb-2.5 text-left font-semibold">Durum</th>
            </tr>
          </thead>
          <tbody>
            {teklifler?.map((t) => {
              const firma = t.firmalar as unknown as Firma;
              const kalemler = t.teklif_kalemleri as unknown as {
                adet: number;
                birim_fiyat: number;
                urunler: { ad: string } | null;
              }[];
              const toplam = kalemler.reduce((sum, k) => sum + k.adet * k.birim_fiyat, 0);
              return (
                <tr key={t.id} className="border-b border-border last:border-0">
                  <td className="py-2.5">
                    <Link href={`/teklifler/${t.id}`} className="font-medium text-green hover:underline">
                      {t.teklif_no || "Detay →"}
                    </Link>
                  </td>
                  <td className="py-2.5 font-mono">{formatTarihSaat(t.tarih_saat)}</td>
                  <td className="py-2.5">
                    <Link href={`/firmalar/${firma?.id}`} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: firma?.renk }} />
                      {firma?.ad}
                    </Link>
                  </td>
                  <td className="py-2.5">
                    <Badge tip={t.tip as SiparisTip} />
                  </td>
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
                <td colSpan={7} className="py-4 text-text-dim">
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
