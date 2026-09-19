import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSatinAlmaPdf } from "@/lib/pdf/satin-alma-pdf";
import { dilCoz } from "@/lib/pdf/i18n";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dil = dilCoz(new URL(request.url).searchParams.get("dil"), "en");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });

  const { data: po } = await supabase
    .from("satin_almalar")
    .select("*, firmalar(ad, adres, telefon, eposta, vergi_no)")
    .eq("id", id)
    .single();
  if (!po) return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });

  const [{ data: kalemler }, { data: sirket }] = await Promise.all([
    supabase.from("satin_alma_kalemleri").select("*").eq("satin_alma_id", id).order("sira"),
    supabase.from("sirket_profili").select("*").eq("id", true).maybeSingle(),
  ]);

  const firma = po.firmalar as unknown as {
    ad: string;
    adres: string | null;
    telefon: string | null;
    eposta: string | null;
    vergi_no: string | null;
  } | null;

  const pdfBytes = await generateSatinAlmaPdf({
    dil,
    poNo: po.po_no,
    tarih: po.tarih,
    teklifRef: po.teklif_ref,
    iletisim: po.iletisim,
    teslimat: po.teslimat,
    nakliye: po.nakliye,
    termin: po.termin,
    odemeSartlari: po.odeme_sartlari,
    mesaj: po.mesaj,
    notlar: po.notlar,
    paraBirimi: po.para_birimi,
    kdvOrani: po.kdv_orani ?? 0,
    kargoBedeli: po.kargo_bedeli ?? 0,
    kargoNotu: po.kargo_notu,
    tedarikci: {
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
    },
    kalemler: (kalemler ?? []).map((k) => ({
      adet: k.adet,
      aciklama: k.aciklama,
      termin: k.termin,
      birimFiyat: k.birim_fiyat,
    })),
  });

  const onEk = dil === "en" ? "PO" : "satin-alma";
  const dosyaAdi = `${onEk}-${po.po_no ?? id.slice(0, 8)}.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${dosyaAdi}"`,
    },
  });
}
