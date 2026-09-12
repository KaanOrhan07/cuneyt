"use client";

import { Button } from "@/components/ui";

export function ExportExcelButton({
  filename,
  sheetName,
  rows,
}: {
  filename: string;
  sheetName: string;
  rows: Record<string, string | number>[];
}) {
  async function handleExport() {
    const XLSX = await import("xlsx");
    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }

  return (
    <Button variant="secondary" onClick={handleExport} disabled={rows.length === 0}>
      İndir (Excel)
    </Button>
  );
}
