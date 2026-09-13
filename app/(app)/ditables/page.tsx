import { ExcelSheet } from "@/components/ditables/excel-sheet";
import { ExcelImport } from "@/components/ditables/excel-import";

export default function DiTablesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-[22px] font-semibold">DiTables</h1>
        <p className="mt-0.5 text-[13px] text-text-dim">
          Basitleştirilmiş Excel arayüzü — şablon seçin, doldurun, indirin; doldurduğunuz dosyayı
          geri yükleyerek toplu veri girişi yapın.
        </p>
      </div>

      <div className="mb-6">
        <ExcelSheet />
      </div>

      <ExcelImport />
    </div>
  );
}
