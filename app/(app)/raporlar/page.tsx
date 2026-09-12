import { Panel } from "@/components/ui";

export default function RaporlarPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-[22px] font-semibold">Raporlar</h1>
        <p className="mt-0.5 text-[13px] text-text-dim">Detaylı raporlar ve Excel dışa aktarma</p>
      </div>
      <Panel>
        <p className="text-[13px] text-text-dim">
          Bu sayfa Faz 2&apos;de eklenecek: genel/ürün bazlı/firma bazlı raporlar ve Excel (.xlsx) dışa aktarma.
        </p>
      </Panel>
    </div>
  );
}
