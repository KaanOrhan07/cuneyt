import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FirmaForm } from "@/components/firma-form";
import { deleteFirma } from "@/lib/actions/firmalar";
import type { Firma } from "@/lib/types";

export default async function FirmalarPage({
  searchParams,
}: {
  searchParams: Promise<{ tip?: string }>;
}) {
  const { tip } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("firmalar")
    .select("*")
    .is("deleted_at", null)
    .order("ad");

  if (tip === "tedarikci") query = query.eq("is_tedarikci", true);
  if (tip === "musteri") query = query.eq("is_musteri", true);

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
      </div>

      <FirmaForm />

      <div className="my-5 flex gap-2">
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

      <div className="grid grid-cols-3 gap-4">
        {(firmalar as Firma[] | null)?.map((f) => (
          <div
            key={f.id}
            className="rounded-[14px] border border-border bg-card p-4 shadow-[var(--shadow)]"
          >
            <div className="flex items-start justify-between">
              <Link href={`/firmalar/${f.id}`} className="flex items-center gap-2.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: f.renk }}
                />
                <span className="font-medium">{f.ad}</span>
              </Link>
              <form action={deleteFirma.bind(null, f.id)}>
                <button className="text-[11px] text-text-dim hover:text-orange">Sil</button>
              </form>
            </div>
            <div className="mt-3 flex gap-1.5">
              {f.is_tedarikci && (
                <span className="rounded-full bg-green-soft px-2 py-0.5 text-[11px] font-medium text-green">
                  Tedarikçi
                </span>
              )}
              {f.is_musteri && (
                <span className="rounded-full bg-orange-soft px-2 py-0.5 text-[11px] font-medium text-[#C74519]">
                  Müşteri
                </span>
              )}
            </div>
          </div>
        ))}
        {firmalar?.length === 0 && (
          <p className="text-[13px] text-text-dim">Henüz firma eklenmedi.</p>
        )}
      </div>
    </div>
  );
}
