import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateTeklifPdf } from "@/lib/pdf/teklif-pdf";
import { dilCoz } from "@/lib/pdf/i18n";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dil = dilCoz(new URL(request.url).searchParams.get("dil"));
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const { data: teklif } = await supabase
    .from("teklifler")
    .select("*, firmalar(ad, adres, telefon, eposta, vergi_no)")
    .eq("id", id)
    .single();

  if (!teklif) {
    return NextResponse.json({ error: "Teklif bulunamadı" }, { status: 404 });
  }

  const { data: kalemler } = await supabase
    .from("teklif_kalemleri")
    .select("adet, birim_fiyat, urunler(ad)")
    .eq("teklif_id", id);

  const { data: sirket } = await supabase.from("sirket_profili").select("*").eq("id", true).maybeSingle();

  const firma = teklif.firmalar as unknown as {
    ad: string;
    adres: string | null;
    telefon: string | null;
    eposta: string | null;
    vergi_no: string | null;
  } | null;

  const rows = (kalemler ?? []) as unknown as {
    adet: number;
    birim_fiyat: number;
    urunler: { ad: string } | null;
  }[];

  const sablonKullan = teklif.sablon_kullan !== false;
  const turSablonu =
    teklif.tip === "alis" ? sirket?.alis_teklif_sablon_url ?? null : sirket?.ozel_sablon_url ?? null;

  const pdfBytes = await generateTeklifPdf({
    dil,
    teklifNo: teklif.teklif_no,
    tip: teklif.tip,
    tarih: teklif.tarih_saat,
    satici: teklif.satici,
    termin: teklif.termin,
    nakliye: teklif.nakliye,
    teslimatSekli: teklif.teslimat_sekli,
    odemeSartlari: teklif.odeme_sartlari,
    mesaj: teklif.mesaj,
    notlar: teklif.notlar,
    iskonto: teklif.iskonto ?? 0,
    kdvOrani: teklif.kdv_orani ?? 20,
    paraBirimi: teklif.para_birimi ?? "TL",
    kargoBedeli: teklif.kargo_bedeli ?? 0,
    firma: {
      ad: firma?.ad ?? "—",
      adres: firma?.adres ?? null,
      telefon: firma?.telefon ?? null,
      eposta: firma?.eposta ?? null,
      vergiNo: firma?.vergi_no ?? null,
    },
    sirket: {
      sirketAdi: sirket?.sirket_adi ?? null,
      adres: sirket?.adres ?? null,
      telefon: sirket?.telefon ?? null,
      eposta: sirket?.eposta ?? null,
      vergiNo: sirket?.vergi_no ?? null,
      bankaBilgisi: sirket?.banka_bilgisi ?? null,
      logoUrl: sirket?.logo_url ?? null,
      ozelSablonUrl: sablonKullan ? turSablonu : null,
    },
    kalemler: rows.map((k) => ({
      urunAd: k.urunler?.ad ?? "—",
      adet: k.adet,
      birimFiyat: k.birim_fiyat,
    })),
  });

  const onEk = dil === "en" ? "quote" : "teklif";
  const dosyaAdi = teklif.teklif_no ? `${onEk}-${teklif.teklif_no}.pdf` : `${onEk}-${id.slice(0, 8)}.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${dosyaAdi}"`,
    },
  });
}
