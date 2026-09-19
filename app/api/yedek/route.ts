import * as XLSX from "xlsx";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { tumSatirlar } from "@/lib/supabase/hepsi";
import { BILGI_SAYFASI, YEDEK_TABLOLARI } from "@/lib/yedek";
import { istanbulDayKey } from "@/lib/tr-time";
import { formatTarihSaat } from "@/lib/format";
import { logla } from "@/lib/log";

export const runtime = "nodejs";
export const maxDuration = 60;

function hucreDegeri(v: unknown) {
  if (v !== null && typeof v === "object") return JSON.stringify(v);
  return v;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });

  const wb = XLSX.utils.book_new();
  const bilgi: (string | number)[][] = [
    ["DiTrack yedeği"],
    ["Oluşturulma (Türkiye saati)", formatTarihSaat(new Date())],
    ["Not", "Sayfa/sütun adlarını değiştirmeyin; bu dosya Biz > Yedekten Geri Yükle ile içe aktarılabilir."],
    [],
    ["Sayfa", "Satır sayısı"],
  ];

  for (const t of YEDEK_TABLOLARI) {
    const { data, error } = await tumSatirlar<Record<string, unknown>>(supabase, t.tablo);
    if (error) {
      bilgi.push([t.tablo, `atlandı: ${error}`]);
      continue;
    }
    const satirlar = data.map((r) =>
      Object.fromEntries(Object.entries(r).map(([k, v]) => [k, hucreDegeri(v)])),
    );
    const sheet = XLSX.utils.json_to_sheet(satirlar);
    XLSX.utils.book_append_sheet(wb, sheet, t.tablo);
    bilgi.push([t.tablo, satirlar.length]);
  }

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(bilgi), BILGI_SAYFASI);

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const dosyaAdi = `ditrack-yedek-${istanbulDayKey(new Date())}.xlsx`;

  await logla("yedek", "yedek_indirme", dosyaAdi, {
    aciklama: `Tüm işletme verisi indirildi (${YEDEK_TABLOLARI.length} sayfa)`,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${dosyaAdi}"`,
      "Cache-Control": "no-store",
    },
  });
}
