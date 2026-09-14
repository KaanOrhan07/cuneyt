import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSiparisPdf } from "@/lib/pdf/siparis-pdf";
import { DURUM_LABEL } from "@/lib/types";
import type { SiparisDurum } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const { data: siparis } = await supabase
    .from("siparisler")
    .select("*, firmalar(ad)")
    .eq("id", id)
    .single();

  if (!siparis) {
    return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
  }

  const { data: kalemler } = await supabase
    .from("siparis_kalemleri")
    .select("adet, birim_fiyat, teslim_edilen_adet, urunler(ad)")
    .eq("siparis_id", id);

  const firma = siparis.firmalar as unknown as { ad: string } | null;
  const rows = (kalemler ?? []) as unknown as {
    adet: number;
    birim_fiyat: number;
    teslim_edilen_adet: number;
    urunler: { ad: string } | null;
  }[];

  const pdfBytes = await generateSiparisPdf({
    siparisNo: siparis.siparis_no,
    tip: siparis.tip,
    durum: DURUM_LABEL[siparis.durum as SiparisDurum],
    tarih: siparis.tarih_saat,
    sonTeslimTarihi: siparis.son_teslim_tarihi,
    kdvOrani: siparis.kdv_orani,
    firmaAd: firma?.ad ?? "—",
    kalemler: rows.map((k) => ({
      urunAd: k.urunler?.ad ?? "—",
      adet: k.adet,
      teslimEdilenAdet: k.teslim_edilen_adet,
      birimFiyat: k.birim_fiyat,
    })),
  });

  const dosyaAdi = siparis.siparis_no ? `siparis-${siparis.siparis_no}.pdf` : `siparis-${id.slice(0, 8)}.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${dosyaAdi}"`,
    },
  });
}
