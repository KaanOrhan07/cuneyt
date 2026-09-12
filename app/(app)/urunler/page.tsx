import { createClient } from "@/lib/supabase/server";
import { UrunForm } from "@/components/urun-form";
import { deleteUrun } from "@/lib/actions/urunler";
import { Panel } from "@/components/ui";
import { formatTL } from "@/lib/format";
import type { Urun } from "@/lib/types";

export default async function UrunlerPage() {
  const supabase = await createClient();
  const { data: urunler } = await supabase
    .from("urunler")
    .select("*")
    .is("deleted_at", null)
    .order("ad");

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-[22px] font-semibold">Ürünler / Stok</h1>
        <p className="mt-0.5 text-[13px] text-text-dim">Stok adedi, maliyet ve satış fiyatlarını yönetin</p>
      </div>

      <UrunForm />

      <Panel>
        <table className="mt-4 w-full text-[13px]">
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
            {(urunler as Urun[] | null)?.map((u) => {
              const kritik = u.stok_adet <= u.kritik_stok_esigi;
              return (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="py-2.5 font-medium">{u.ad}</td>
                  <td className={`py-2.5 font-mono ${kritik ? "font-semibold text-orange" : ""}`}>
                    {u.stok_adet}
                  </td>
                  <td className="py-2.5 font-mono">{formatTL(u.ortalama_maliyet)}</td>
                  <td className="py-2.5 font-mono">{formatTL(u.satis_fiyati)}</td>
                  <td className="py-2.5 font-mono text-text-dim">{u.kritik_stok_esigi}</td>
                  <td className="py-2.5">
                    <form action={deleteUrun.bind(null, u.id)}>
                      <button className="text-[11px] text-text-dim hover:text-orange">Sil</button>
                    </form>
                  </td>
                </tr>
              );
            })}
            {urunler?.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-text-dim">
                  Henüz ürün eklenmedi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
