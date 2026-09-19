import { PDFDocument, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "node:fs/promises";
import path from "node:path";

export const RENK = {
  YESIL: rgb(0.157, 0.412, 0.294), // #28694B
  GRI: rgb(0.431, 0.431, 0.451), // #6E6E73
  SIYAH: rgb(0.106, 0.11, 0.094), // #1B1C18
  AC_GRI: rgb(0.906, 0.906, 0.906),
  ZEMIN: rgb(0.965, 0.965, 0.949),
  BEYAZ: rgb(1, 1, 1),
};

export const A4 = [595, 842] as const;

// Özel şablon kullanılırken sayfanın üstünde olduğu gibi korunan alan (pt, ~4 cm)
export const UST_BASLIK_YUKSEKLIGI = 110;

export type Renk = ReturnType<typeof rgb>;

export async function gorseliGom(pdf: PDFDocument, url: string): Promise<PDFImage | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("png") || url.toLowerCase().split("?")[0].endsWith(".png")) {
      return await pdf.embedPng(bytes);
    }
    return await pdf.embedJpg(bytes);
  } catch {
    return null;
  }
}

export type Belge = {
  pdf: PDFDocument;
  sayfa: PDFPage;
  font: PDFFont;
  fontBold: PDFFont;
  sablonModu: boolean;
  genislik: number;
  yukseklik: number;
};

/**
 * Yeni bir PDF belgesi açar. Özel şablon verilmişse o PDF'in ilk sayfası kullanılır:
 * üstteki antet alanı korunur, altındaki her şey beyazla kapatılır (kullanıcının şablonu
 * elle boşaltmasına gerek kalmaz). Şablon indirilemezse kendi tasarımımıza düşer.
 */
export async function belgeAc(sablonUrl: string | null): Promise<Belge> {
  const [fontBytes, fontBoldBytes] = await Promise.all([
    fs.readFile(path.join(process.cwd(), "lib/pdf/fonts/Inter-Regular.ttf")),
    fs.readFile(path.join(process.cwd(), "lib/pdf/fonts/Inter-Bold.ttf")),
  ]);

  let pdf: PDFDocument | null = null;
  let sayfa: PDFPage | null = null;
  let sablonModu = false;

  if (sablonUrl) {
    try {
      const res = await fetch(sablonUrl);
      if (res.ok) {
        pdf = await PDFDocument.load(new Uint8Array(await res.arrayBuffer()));
        sayfa = pdf.getPages()[0] ?? null;
        sablonModu = !!sayfa;
      }
    } catch {
      pdf = null;
    }
  }

  if (!pdf || !sayfa) {
    pdf = await PDFDocument.create();
    sayfa = pdf.addPage(A4 as unknown as [number, number]);
    sablonModu = false;
  }

  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fontBytes, { subset: true });
  const fontBold = await pdf.embedFont(fontBoldBytes, { subset: true });

  const boyut = sablonModu ? sayfa.getSize() : { width: A4[0], height: A4[1] };

  if (sablonModu) {
    sayfa.drawRectangle({
      x: 0,
      y: 0,
      width: boyut.width,
      height: boyut.height - UST_BASLIK_YUKSEKLIGI + 12,
      color: RENK.BEYAZ,
    });
  }

  return { pdf, sayfa, font, fontBold, sablonModu, genislik: boyut.width, yukseklik: boyut.height };
}
