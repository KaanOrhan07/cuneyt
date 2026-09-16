import { PDFDocument, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "node:fs/promises";
import path from "node:path";

const YESIL = rgb(0.157, 0.412, 0.294); // #28694B
const GRI = rgb(0.431, 0.431, 0.451); // #6E6E73
const SIYAH = rgb(0.106, 0.11, 0.094); // #1B1C18
const AC_GRI = rgb(0.906, 0.906, 0.906);
const A4 = [595, 842] as const;
const ALT_SINIR = 90;

export type TeklifPdfData = {
  teklifNo: string | null;
  tip: "alis" | "satis";
  tarih: string;
  satici: string | null;
  termin: string | null;
  nakliye: string | null;
  teslimatSekli: string | null;
  odemeSartlari: string | null;
  mesaj: string | null;
  notlar: string | null;
  iskonto: number;
  kdvOrani: number;
  firma: {
    ad: string;
    adres: string | null;
    telefon: string | null;
    eposta: string | null;
    vergiNo: string | null;
  };
  sirket: {
    sirketAdi: string | null;
    adres: string | null;
    telefon: string | null;
    eposta: string | null;
    vergiNo: string | null;
    bankaBilgisi: string | null;
    logoUrl: string | null;
    ozelSablonUrl: string | null;
  };
  kalemler: { urunAd: string; adet: number; birimFiyat: number }[];
};

function tl(n: number) {
  return `${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
}

async function gorseliGom(pdf: PDFDocument, url: string) {
  const res = await fetch(url);
  if (!res.ok) return null;
  const bytes = new Uint8Array(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("png") || url.toLowerCase().includes(".png")) {
      return await pdf.embedPng(bytes);
    }
    return await pdf.embedJpg(bytes);
  } catch {
    return null;
  }
}

export async function generateTeklifPdf(data: TeklifPdfData): Promise<Uint8Array> {
  const [fontBytes, fontBoldBytes] = await Promise.all([
    fs.readFile(path.join(process.cwd(), "lib/pdf/fonts/Inter-Regular.ttf")),
    fs.readFile(path.join(process.cwd(), "lib/pdf/fonts/Inter-Bold.ttf")),
  ]);

  let pdf: PDFDocument;
  let sayfa: PDFPage;
  let sablonModu = false;

  if (data.sirket.ozelSablonUrl) {
    try {
      const res = await fetch(data.sirket.ozelSablonUrl);
      if (res.ok) {
        const sablonBytes = new Uint8Array(await res.arrayBuffer());
        pdf = await PDFDocument.load(sablonBytes);
        sayfa = pdf.getPages()[0];
        sablonModu = true;
      } else {
        pdf = await PDFDocument.create();
        sayfa = pdf.addPage(A4 as unknown as [number, number]);
      }
    } catch {
      pdf = await PDFDocument.create();
      sayfa = pdf.addPage(A4 as unknown as [number, number]);
    }
  } else {
    pdf = await PDFDocument.create();
    sayfa = pdf.addPage(A4 as unknown as [number, number]);
  }

  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fontBytes, { subset: true });
  const fontBold = await pdf.embedFont(fontBoldBytes, { subset: true });

  const solMargin = 48;
  const sagMargin = A4[0] - 48;
  let y = sablonModu ? A4[1] - 200 : A4[1] - 48;

  function yaz(
    metin: string,
    x: number,
    yPos: number,
    opts: {
      boyut?: number;
      renk?: ReturnType<typeof rgb>;
      hizalama?: "sol" | "sag";
      kalin?: boolean;
      font?: PDFFont;
    } = {},
  ) {
    const boyut = opts.boyut ?? 10;
    const renk = opts.renk ?? SIYAH;
    const kullanilanFont = opts.font ?? (opts.kalin ? fontBold : font);
    const genislik = kullanilanFont.widthOfTextAtSize(metin, boyut);
    const cizimX = opts.hizalama === "sag" ? x - genislik : x;
    sayfa.drawText(metin, { x: cizimX, y: yPos, size: boyut, font: kullanilanFont, color: renk });
  }

  function coklusatirYaz(metin: string, x: number, yBaslangic: number, maksGenislik: number, boyut = 9.5) {
    const kelimeler = metin.split(/\s+/);
    let satir = "";
    let yPos = yBaslangic;
    for (const kelime of kelimeler) {
      const aday = satir ? `${satir} ${kelime}` : kelime;
      if (font.widthOfTextAtSize(aday, boyut) > maksGenislik && satir) {
        sayfa.drawText(satir, { x, y: yPos, size: boyut, font, color: SIYAH });
        satir = kelime;
        yPos -= boyut + 3;
      } else {
        satir = aday;
      }
    }
    if (satir) {
      sayfa.drawText(satir, { x, y: yPos, size: boyut, font, color: SIYAH });
      yPos -= boyut + 3;
    }
    return yPos;
  }

  function cizgi(yPos: number) {
    sayfa.drawLine({
      start: { x: solMargin, y: yPos },
      end: { x: sagMargin, y: yPos },
      thickness: 0.75,
      color: AC_GRI,
    });
  }

  function yeniSayfaGerekirse() {
    if (y < ALT_SINIR) {
      sayfa = pdf.addPage(A4 as unknown as [number, number]);
      y = A4[1] - 48;
      tabloBasligiCiz();
    }
  }

  const sutunlar = [
    { baslik: "Ürün / Açıklama", x: solMargin, hizalama: "sol" as const },
    { baslik: "Adet", x: solMargin + 300, hizalama: "sag" as const },
    { baslik: "Birim Fiyat", x: solMargin + 420, hizalama: "sag" as const },
    { baslik: "Tutar", x: sagMargin, hizalama: "sag" as const },
  ];

  function tabloBasligiCiz() {
    sayfa.drawRectangle({
      x: solMargin,
      y: y - 6,
      width: sagMargin - solMargin,
      height: 20,
      color: rgb(0.965, 0.965, 0.949),
    });
    sutunlar.forEach((s) => yaz(s.baslik, s.x, y, { boyut: 9, renk: GRI, hizalama: s.hizalama }));
    y -= 22;
  }

  // ── Kendi tasarımımız: üst başlık (logo + firma bilgisi) ──
  if (!sablonModu) {
    let logoImg = null;
    if (data.sirket.logoUrl) {
      logoImg = await gorseliGom(pdf, data.sirket.logoUrl);
    }

    if (logoImg) {
      const maxW = 110;
      const maxH = 50;
      const oran = Math.min(maxW / logoImg.width, maxH / logoImg.height, 1);
      const w = logoImg.width * oran;
      const h = logoImg.height * oran;
      sayfa.drawImage(logoImg, { x: sagMargin - w, y: y - h + 10, width: w, height: h });
    }

    yaz(data.sirket.sirketAdi || "Şirketim", solMargin, y, { boyut: 14, kalin: true });
    y -= 15;
    const bilgiSatirlari = [data.sirket.adres, data.sirket.telefon, data.sirket.eposta].filter(
      Boolean,
    ) as string[];
    for (const satir of bilgiSatirlari) {
      yaz(satir, solMargin, y, { boyut: 9, renk: GRI });
      y -= 12;
    }
    if (data.sirket.vergiNo) {
      yaz(`Vergi No: ${data.sirket.vergiNo}`, solMargin, y, { boyut: 9, renk: GRI });
      y -= 12;
    }

    y -= 8;
    yaz(data.tip === "alis" ? "ALIŞ TEKLİFİ" : "TEKLİF", sagMargin, y + 12 + bilgiSatirlari.length * 12, {
      boyut: 16,
      hizalama: "sag",
      kalin: true,
      renk: YESIL,
    });
  }

  // ── Teklif No + Tarih (her iki modda da) ──
  yaz(`Teklif No: ${data.teklifNo ?? "—"}`, sagMargin, y, { boyut: 10.5, hizalama: "sag", kalin: true });
  y -= 14;
  yaz(new Date(data.tarih).toLocaleDateString("tr-TR"), sagMargin, y, { boyut: 10, hizalama: "sag", renk: GRI });
  y -= 24;
  cizgi(y);
  y -= 20;

  // ── ALICI ──
  yaz("ALICI", solMargin, y, { boyut: 9, renk: GRI, kalin: true });
  y -= 15;
  yaz(data.firma.ad, solMargin, y, { boyut: 11.5, kalin: true });
  y -= 15;
  if (data.firma.adres) {
    y = coklusatirYaz(data.firma.adres, solMargin, y, 260);
  }
  if (data.firma.telefon) {
    yaz(data.firma.telefon, solMargin, y, { boyut: 9.5, renk: GRI });
    y -= 13;
  }
  if (data.firma.eposta) {
    yaz(data.firma.eposta, solMargin, y, { boyut: 9.5, renk: GRI });
    y -= 13;
  }
  if (data.firma.vergiNo) {
    yaz(`Vergi No: ${data.firma.vergiNo}`, solMargin, y, { boyut: 9.5, renk: GRI });
    y -= 13;
  }
  y -= 10;

  // ── Mesaj (selamlama paragrafı) ──
  if (data.mesaj) {
    y = coklusatirYaz(data.mesaj, solMargin, y, sagMargin - solMargin, 9.5);
    y -= 30;
  }

  // ── Bilgi tablosu: Satıcı / Termin / Nakliye / Teslimat / Şartlar ──
  const bilgiAlanlari = [
    { baslik: "SATICI", deger: data.satici },
    { baslik: "TERMİN", deger: data.termin },
    { baslik: "NAKLİYE", deger: data.nakliye },
    { baslik: "TESLİMAT", deger: data.teslimatSekli },
    { baslik: "ÖDEME ŞARTLARI", deger: data.odemeSartlari },
  ].filter((a) => a.deger);

  if (bilgiAlanlari.length > 0) {
    const kolonGenislik = (sagMargin - solMargin) / bilgiAlanlari.length;
    sayfa.drawRectangle({
      x: solMargin,
      y: y - 6,
      width: sagMargin - solMargin,
      height: 38,
      color: rgb(0.965, 0.965, 0.949),
    });
    bilgiAlanlari.forEach((a, i) => {
      const x = solMargin + i * kolonGenislik + 8;
      yaz(a.baslik, x, y + 14, { boyut: 8, renk: GRI, kalin: true });
      yaz(a.deger || "", x, y, { boyut: 9.5 });
    });
    y -= 46;
  }

  // ── Ürün tablosu ──
  tabloBasligiCiz();

  let araToplam = 0;
  for (const k of data.kalemler) {
    yeniSayfaGerekirse();
    const tutar = k.adet * k.birimFiyat;
    araToplam += tutar;
    yaz(k.urunAd, solMargin, y, { boyut: 10 });
    yaz(String(k.adet), solMargin + 300, y, { boyut: 10, hizalama: "sag" });
    yaz(tl(k.birimFiyat), solMargin + 420, y, { boyut: 10, hizalama: "sag" });
    yaz(tl(tutar), sagMargin, y, { boyut: 10, hizalama: "sag" });
    y -= 18;
  }

  y -= 6;
  if (y < ALT_SINIR + 110) {
    sayfa = pdf.addPage(A4 as unknown as [number, number]);
    y = A4[1] - 48;
  }
  cizgi(y);
  y -= 24;

  const kdvTutari = araToplam * (data.kdvOrani / 100);
  const genelToplam = araToplam + kdvTutari - data.iskonto;

  const ozetX = solMargin + 320;
  yaz("Ara Toplam", ozetX, y, { boyut: 10, renk: GRI });
  yaz(tl(araToplam), sagMargin, y, { boyut: 10, hizalama: "sag" });
  y -= 16;
  yaz(`KDV (%${data.kdvOrani})`, ozetX, y, { boyut: 10, renk: GRI });
  yaz(tl(kdvTutari), sagMargin, y, { boyut: 10, hizalama: "sag" });
  y -= 16;
  if (data.iskonto > 0) {
    yaz("İskonto", ozetX, y, { boyut: 10, renk: GRI });
    yaz(`-${tl(data.iskonto)}`, sagMargin, y, { boyut: 10, hizalama: "sag" });
    y -= 16;
  }
  yaz("Genel Toplam", ozetX, y, { boyut: 12, renk: YESIL, kalin: true });
  yaz(tl(genelToplam), sagMargin, y, { boyut: 12, renk: YESIL, hizalama: "sag", kalin: true });
  y -= 30;

  // ── Banka bilgisi ──
  if (data.sirket.bankaBilgisi && y > ALT_SINIR + 40) {
    const satirlar = data.sirket.bankaBilgisi.split("\n").filter(Boolean);
    for (const satir of satirlar) {
      yaz(satir, solMargin, y, { boyut: 9, renk: GRI });
      y -= 12;
    }
    y -= 8;
  }

  // ── Notlar ──
  if (data.notlar && y > ALT_SINIR + 20) {
    yaz("NOT", solMargin, y, { boyut: 8.5, renk: GRI, kalin: true });
    y -= 13;
    coklusatirYaz(data.notlar, solMargin, y, sagMargin - solMargin, 9);
  }

  if (!sablonModu) {
    sayfa.drawText("Created by Digio Medya ve Yazılım", {
      x: solMargin,
      y: 30,
      size: 8,
      font,
      color: GRI,
    });
  }

  return pdf.save();
}
