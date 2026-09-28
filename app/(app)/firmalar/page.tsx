import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FirmaForm } from "@/components/firma-form";
import { FirmaCard } from "@/components/firma-card";
import { Input } from "@/components/ui";
import { ExportExcelButton } from "@/components/export-excel-button";
import { ImportExcelButton } from "@/components/import-excel-button";
import type { Firma } from "@/lib/types";

export default async function FirmalarPage({
  searchParams,
}: {
  searchParams: Promise<{ tip?: string; q?: string }>;
}) {
  const { tip, q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("firmalar")
    .select("*")
    .is("deleted_at", null)
    .order("ad");

  if (tip === "tedarikci") query = query.eq("is_tedarikci", true);
  if (tip === "musteri") query = query.eq("is_musteri", true);
  if (q) query = query.ilike("ad", `%${q}%`);

  const { data: firmalar } = await query;

  const tabs = [
    { key: undefined, label: "Tümü" },
    { key: "tedarikci", label: "Tedarikçi" },
    { key: "musteri", label: "Müşteri" },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-[22px] font-semibold">Firmalar</h1>
          <p className="mt-0.5 text-[13px] text-text-dim">Tedarikçi ve müşteri firmaları yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          <ImportExcelButton tip="firma" />
          <ExportExcelButton
            filename="firmalar"
            sheetName="Firmalar"
            rows={(firmalar as Firma[] | null ?? []).map((f) => ({
              Firma: f.ad,
              Renk: f.renk,
              Tedarikçi: f.is_tedarikci ? "Evet" : "Hayır",
              Müşteri: f.is_musteri ? "Evet" : "Hayır",
            }))}
          />
        </div>
      </div>

      <FirmaForm />

      <div className="my-5 flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {tabs.map((t) => (
            <Link
              key={t.label}
              href={t.key ? `/firmalar?tip=${t.key}` : "/firmalar"}
              className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium ${
                tip === t.key
                  ? "bg-green text-white"
                  : "border border-border bg-card text-text-dim"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
        <form className="flex items-center gap-2">
          {tip && <input type="hidden" name="tip" value={tip} />}
          <Input name="q" placeholder="Firma ara..." defaultValue={q ?? ""} className="w-56" />
        </form>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {(firmalar as Firma[] | null)?.map((f) => <FirmaCard key={f.id} firma={f} />)}
        {firmalar?.length === 0 && (
          <p className="text-[13px] text-text-dim">Henüz firma eklenmedi.</p>
        )}
      </div>
    </div>
  );
}
