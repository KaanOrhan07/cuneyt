import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UrunForm } from "@/components/urun-form";
import { UrunRow } from "@/components/urun-row";
import { Input, Panel } from "@/components/ui";
import { ExportExcelButton } from "@/components/export-excel-button";
import type { Urun } from "@/lib/types";

export default async function UrunlerPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kritik?: string }>;
}) {
  const { q, kritik } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("urunler").select("*").is("deleted_at", null).order("ad");
  if (q) query = query.ilike("ad", `%${q}%`);

  const { data: allUrunler } = await query;
  const urunler = kritik
    ? (allUrunler as Urun[] | null)?.filter((u) => u.stok_adet <= u.kritik_stok_esigi)
    : (allUrunler as Urun[] | null);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-[22px] font-semibold">Ürünler / Stok</h1>
          <p className="mt-0.5 text-[13px] text-text-dim">Stok adedi, maliyet ve satış fiyatlarını yönetin</p>
        </div>
        <ExportExcelButton
          filename="urunler"
          sheetName="Ürünler"
          rows={(urunler ?? []).map((u) => ({
            Ürün: u.ad,
            Stok: u.stok_adet,
            "Ort. Maliyet": u.ortalama_maliyet,
            "Satış Fiyatı": u.satis_fiyati,
            "Kritik Eşik": u.kritik_stok_esigi,
          }))}
        />
      </div>

      <UrunForm />

      <div className="my-5 flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <Link
            href="/urunler"
            className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium ${
              !kritik ? "bg-green text-white" : "border border-border bg-card text-text-dim"
            }`}
          >
            Tümü
          </Link>
          <Link
            href="/urunler?kritik=1"
            className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium ${
              kritik ? "bg-orange text-white" : "border border-border bg-card text-text-dim"
            }`}
          >
            Sadece Kritik Stok
          </Link>
        </div>
        <form className="flex items-center gap-2">
          {kritik && <input type="hidden" name="kritik" value={kritik} />}
          <Input name="q" placeholder="Ürün ara..." defaultValue={q ?? ""} className="w-56" />
        </form>
      </div>

      <Panel>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-dim">
              <th className="pb-2.5 text-left font-semibold">Ürün</th>
              <th className="pb-2.5 text-left font-semibold">Stok</th>
              <th className="pb-2.5 text-left font-semibold">Ort. Maliyet</th>
              <th className="pb-2.5 text-left font-semibold">Satış Fiyatı</th>
              <th className="pb-2.5 text-left font-semibold">Kritik Eşik</th>
              <th className="pb-2.5 text-left font-semibold" />
            </tr>
          </thead>
          <tbody>
            {urunler?.map((u) => (
              <UrunRow key={u.id} urun={u} />
            ))}
            {urunler?.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-text-dim">
                  Ürün bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
