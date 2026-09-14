import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "node:fs/promises";
import path from "node:path";

const YESIL = rgb(0.157, 0.412, 0.294); // #28694B
const GRI = rgb(0.431, 0.431, 0.451); // #6E6E73
const SIYAH = rgb(0.106, 0.11, 0.094); // #1B1C18
const AC_GRI = rgb(0.906, 0.906, 0.906);
const A4 = [595, 842] as const;
const UST_BASLANGIC = 800;
const ALT_SINIR = 90;

export type SiparisPdfData = {
  siparisNo: string | null;
  tip: "alis" | "satis";
  durum: string;
  tarih: string;
  sonTeslimTarihi: string | null;
  kdvOrani: number;
  firmaAd: string;
  kalemler: { urunAd: string; adet: number; teslimEdilenAdet: number; birimFiyat: number }[];
};

function tl(n: number) {
  return `${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
}

export async function generateSiparisPdf(data: SiparisPdfData): Promise<Uint8Array> {
  const [fontBytes, fontBoldBytes] = await Promise.all([
    fs.readFile(path.join(process.cwd(), "lib/pdf/fonts/Inter-Regular.ttf")),
    fs.readFile(path.join(process.cwd(), "lib/pdf/fonts/Inter-Bold.ttf")),
  ]);

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fontBytes, { subset: true });
  const fontBold = await pdf.embedFont(fontBoldBytes, { subset: true });

  const solMargin = 48;
  const sagMargin = A4[0] - 48;

  let sayfa = pdf.addPage(A4 as unknown as [number, number]);
  let y = UST_BASLANGIC;

  function yaz(
    metin: string,
    x: number,
    yPos: number,
    opts: {
      boyut?: number;
      renk?: ReturnType<typeof rgb>;
      hizalama?: "sol" | "sag";
      kalin?: boolean;
    } = {},
  ) {
    const boyut = opts.boyut ?? 10;
    const renk = opts.renk ?? SIYAH;
    const kullanilanFont = opts.kalin ? fontBold : font;
    const genislik = kullanilanFont.widthOfTextAtSize(metin, boyut);
    const cizimX = opts.hizalama === "sag" ? x - genislik : x;
    sayfa.drawText(metin, { x: cizimX, y: yPos, size: boyut, font: kullanilanFont, color: renk });
  }

  function cizgi(yPos: number) {
    sayfa.drawLine({
      start: { x: solMargin, y: yPos },
      end: { x: sagMargin, y: yPos },
      thickness: 0.75,
      color: AC_GRI,
    });
  }

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

  function yeniSayfaGerekirse() {
    if (y < ALT_SINIR) {
      sayfa = pdf.addPage(A4 as unknown as [number, number]);
      y = UST_BASLANGIC;
      tabloBasligiCiz();
    }
  }

  // Başlık
  yaz("DiTrack", solMargin, y, { boyut: 20, renk: YESIL, kalin: true });
  yaz(data.tip === "alis" ? "ALIŞ SİPARİŞ FORMU" : "SATIŞ SİPARİŞ FORMU", sagMargin, y, {
    boyut: 14,
    hizalama: "sag",
    kalin: true,
  });
  y -= 18;
  yaz("Sipariş Takip", solMargin, y, { boyut: 10, renk: GRI });
  if (data.siparisNo) {
    yaz(`Sipariş No: ${data.siparisNo}`, sagMargin, y, { boyut: 10, renk: GRI, hizalama: "sag" });
  }
  y -= 30;
  cizgi(y);
  y -= 24;

  // Bilgi bloğu
  yaz("Firma", solMargin, y, { boyut: 9, renk: GRI });
  yaz("Tarih", solMargin + 220, y, { boyut: 9, renk: GRI });
  yaz("Son Teslim Tarihi", solMargin + 360, y, { boyut: 9, renk: GRI });
  y -= 16;
  yaz(data.firmaAd, solMargin, y, { boyut: 11, kalin: true });
  yaz(new Date(data.tarih).toLocaleDateString("tr-TR"), solMargin + 220, y, { boyut: 11 });
  yaz(
    data.sonTeslimTarihi ? new Date(data.sonTeslimTarihi).toLocaleDateString("tr-TR") : "—",
    solMargin + 360,
    y,
    { boyut: 11 },
  );
  y -= 20;
  yaz("Durum", solMargin, y, { boyut: 9, renk: GRI });
  y -= 16;
  yaz(data.durum, solMargin, y, { boyut: 11 });
  y -= 30;

  const sutunlar = [
    { baslik: "Ürün", x: solMargin, hizalama: "sol" as const },
    { baslik: "İstenen", x: solMargin + 240, hizalama: "sag" as const },
    { baslik: "Teslim Edilen", x: solMargin + 320, hizalama: "sag" as const },
    { baslik: "Birim Fiyat", x: solMargin + 420, hizalama: "sag" as const },
    { baslik: "Tutar", x: sagMargin, hizalama: "sag" as const },
  ];

  tabloBasligiCiz();

  let araToplam = 0;
  for (const k of data.kalemler) {
    yeniSayfaGerekirse();
    const tutar = k.adet * k.birimFiyat;
    araToplam += tutar;
    yaz(k.urunAd, solMargin, y, { boyut: 10 });
    yaz(String(k.adet), solMargin + 240, y, { boyut: 10, hizalama: "sag" });
    yaz(String(k.teslimEdilenAdet), solMargin + 320, y, { boyut: 10, hizalama: "sag" });
    yaz(tl(k.birimFiyat), solMargin + 420, y, { boyut: 10, hizalama: "sag" });
    yaz(tl(tutar), sagMargin, y, { boyut: 10, hizalama: "sag" });
    y -= 18;
  }

  y -= 6;
  if (y < ALT_SINIR + 90) {
    sayfa = pdf.addPage(A4 as unknown as [number, number]);
    y = UST_BASLANGIC;
  }
  cizgi(y);
  y -= 24;

  const kdvTutari = araToplam * (data.kdvOrani / 100);
  const genelToplam = araToplam + kdvTutari;

  const ozetX = solMargin + 320;
  yaz("Ara Toplam", ozetX, y, { boyut: 10, renk: GRI });
  yaz(tl(araToplam), sagMargin, y, { boyut: 10, hizalama: "sag" });
  y -= 16;
  yaz(`KDV (%${data.kdvOrani})`, ozetX, y, { boyut: 10, renk: GRI });
  yaz(tl(kdvTutari), sagMargin, y, { boyut: 10, hizalama: "sag" });
  y -= 18;
  yaz("Genel Toplam", ozetX, y, { boyut: 12, renk: YESIL, kalin: true });
  yaz(tl(genelToplam), sagMargin, y, { boyut: 12, renk: YESIL, hizalama: "sag", kalin: true });

  sayfa.drawText("Created by Digio Medya ve Yazılım", {
    x: solMargin,
    y: 30,
    size: 8,
    font,
    color: GRI,
  });

  return pdf.save();
}
