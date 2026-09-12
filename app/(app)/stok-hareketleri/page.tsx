import { createClient } from "@/lib/supabase/server";
import { StokHareketleriTablosu, type StokHareketSatiri } from "@/components/stok-hareketleri-tablosu";
import { Button, Select } from "@/components/ui";
import type { Urun } from "@/lib/types";

type Filters = { urun_id?: string; baslangic?: string; bitis?: string };

export default async function StokHareketleriPage({
  searchParams,
}: {
  searchParams: Promise<Filters>;
}) {
  const filters = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("stok_hareketleri")
    .select(
      "id, tarih, yon, adet, urunler(ad), siparisler(tip, firma_id, firmalar(ad))",
    )
    .order("tarih", { ascending: false });

  if (filters.urun_id) query = query.eq("urun_id", filters.urun_id);
  if (filters.baslangic) query = query.gte("tarih", filters.baslangic);
  if (filters.bitis) query = query.lte("tarih", filters.bitis);

  const [{ data: hareketRows }, { data: urunler }] = await Promise.all([
    query,
    supabase.from("urunler").select("*").is("deleted_at", null).order("ad"),
  ]);

  type Row = {
    id: string;
    tarih: string;
    yon: "giris" | "cikis";
    adet: number;
    urunler: { ad: string } | null;
    siparisler: { tip: "alis" | "satis"; firma_id: string; firmalar: { ad: string } | null } | null;
  };

  const hareketler: StokHareketSatiri[] = ((hareketRows as unknown as Row[]) ?? []).map((h) => ({
    id: h.id,
    tarih: h.tarih,
    urun_ad: h.urunler?.ad ?? "—",
    yon: h.yon,
    adet: h.adet,
    firma_ad: h.siparisler?.firmalar?.ad ?? null,
    firma_id: h.siparisler?.firma_id ?? null,
    siparis_tip: h.siparisler?.tip ?? null,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-[22px] font-semibold">Stok Hareketleri</h1>
        <p className="mt-0.5 text-[13px] text-text-dim">
          Her ürün girişi/çıkışının tam dökümü
        </p>
      </div>

      <form className="mb-5 flex flex-wrap gap-2.5">
        <Select name="urun_id" defaultValue={filters.urun_id ?? ""}>
          <option value="">Tüm Ürünler</option>
          {(urunler as Urun[] | null)?.map((u) => (
            <option key={u.id} value={u.id}>
              {u.ad}
            </option>
          ))}
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

      <StokHareketleriTablosu hareketler={hareketler} />
    </div>
  );
}
