import { type PDFPage } from "pdf-lib";
import { A4, RENK, UST_BASLIK_YUKSEKLIGI, belgeAc, gorseliGom, type Renk } from "./ortak";
import { TEKLIF_METIN, paraFormat, tarihFormat, yuzdeFormat, type Dil } from "./i18n";

const ALT_SINIR = 90;

export type TeklifPdfData = {
  dil: Dil;
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
  kargoBedeli: number;
  paraBirimi: string;
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
    /** Bu teklif türü (satış/alış) için özel şablon; yoksa/kapalıysa null */
    ozelSablonUrl: string | null;
  };
  kalemler: { urunAd: string; adet: number; birimFiyat: number }[];
};

export async function generateTeklifPdf(data: TeklifPdfData): Promise<Uint8Array> {
  const M = TEKLIF_METIN[data.dil];
  const para = (n: number) => paraFormat(n, data.paraBirimi, data.dil);

  const belge = await belgeAc(data.sirket.ozelSablonUrl);
  const { pdf, font, fontBold, sablonModu } = belge;
  let sayfa: PDFPage = belge.sayfa;

  const solMargin = 48;
  const sagMargin = belge.genislik - 48;
  let y = sablonModu ? belge.yukseklik - UST_BASLIK_YUKSEKLIGI : belge.yukseklik - 48;

  function yaz(
    metin: string,
    x: number,
    yPos: number,
    opts: { boyut?: number; renk?: Renk; hizalama?: "sol" | "sag"; kalin?: boolean } = {},
  ) {
    const boyut = opts.boyut ?? 10;
    const f = opts.kalin ? fontBold : font;
    const genislik = f.widthOfTextAtSize(metin, boyut);
    const cizimX = opts.hizalama === "sag" ? x - genislik : x;
    sayfa.drawText(metin, { x: cizimX, y: yPos, size: boyut, font: f, color: opts.renk ?? RENK.SIYAH });
  }

  function coklusatirYaz(metin: string, x: number, yBaslangic: number, maksGenislik: number, boyut = 9.5) {
    const kelimeler = metin.split(/\s+/);
    let satir = "";
    let yPos = yBaslangic;
    for (const kelime of kelimeler) {
      const aday = satir ? `${satir} ${kelime}` : kelime;
      if (font.widthOfTextAtSize(aday, boyut) > maksGenislik && satir) {
        sayfa.drawText(satir, { x, y: yPos, size: boyut, font, color: RENK.SIYAH });
        satir = kelime;
        yPos -= boyut + 3;
      } else {
        satir = aday;
      }
    }
    if (satir) {
      sayfa.drawText(satir, { x, y: yPos, size: boyut, font, color: RENK.SIYAH });
      yPos -= boyut + 3;
    }
    return yPos;
  }

  function cizgi(yPos: number) {
    sayfa.drawLine({
      start: { x: solMargin, y: yPos },
      end: { x: sagMargin, y: yPos },
      thickness: 0.75,
      color: RENK.AC_GRI,
    });
  }

  const sutunlar = [
    { baslik: M.urunAciklama, x: solMargin, hizalama: "sol" as const },
    { baslik: M.adet, x: solMargin + 300, hizalama: "sag" as const },
    { baslik: M.birimFiyat, x: solMargin + 420, hizalama: "sag" as const },
    { baslik: M.tutar, x: sagMargin, hizalama: "sag" as const },
  ];

  function tabloBasligiCiz() {
    sayfa.drawRectangle({
      x: solMargin,
      y: y - 6,
      width: sagMargin - solMargin,
      height: 20,
      color: RENK.ZEMIN,
    });
    sutunlar.forEach((s) => yaz(s.baslik, s.x, y, { boyut: 9, renk: RENK.GRI, hizalama: s.hizalama }));
    y -= 22;
  }

  function yeniSayfaGerekirse() {
    if (y < ALT_SINIR) {
      sayfa = pdf.addPage(A4 as unknown as [number, number]);
      y = A4[1] - 48;
      tabloBasligiCiz();
    }
  }

  // ── Kendi tasarımımız: üst başlık (logo + firma bilgisi) ──
  if (!sablonModu) {
    const logoImg = data.sirket.logoUrl ? await gorseliGom(pdf, data.sirket.logoUrl) : null;

    if (logoImg) {
      const maxW = 110;
      const maxH = 50;
      const oran = Math.min(maxW / logoImg.width, maxH / logoImg.height, 1);
      const w = logoImg.width * oran;
      const h = logoImg.height * oran;
      sayfa.drawImage(logoImg, { x: sagMargin - w, y: y - h + 10, width: w, height: h });
    }

    yaz(data.sirket.sirketAdi || "—", solMargin, y, { boyut: 14, kalin: true });
    y -= 15;
    const bilgiSatirlari = [data.sirket.adres, data.sirket.telefon, data.sirket.eposta].filter(
      Boolean,
    ) as string[];
    for (const satir of bilgiSatirlari) {
      yaz(satir, solMargin, y, { boyut: 9, renk: RENK.GRI });
      y -= 12;
    }
    if (data.sirket.vergiNo) {
      yaz(`${M.vergiNo}: ${data.sirket.vergiNo}`, solMargin, y, { boyut: 9, renk: RENK.GRI });
      y -= 12;
    }

    y -= 8;
    yaz(data.tip === "alis" ? M.baslikAlis : M.baslikSatis, sagMargin, y + 12 + bilgiSatirlari.length * 12, {
      boyut: 16,
      hizalama: "sag",
      kalin: true,
      renk: RENK.YESIL,
    });
  }

  // ── Teklif No + Tarih ──
  yaz(`${M.teklifNo}: ${data.teklifNo ?? "—"}`, sagMargin, y, { boyut: 10.5, hizalama: "sag", kalin: true });
  y -= 14;
  yaz(tarihFormat(data.tarih, data.dil), sagMargin, y, { boyut: 10, hizalama: "sag", renk: RENK.GRI });
  y -= 24;
  cizgi(y);
  y -= 20;

  // ── ALICI / TEDARİKÇİ ──
  yaz(data.tip === "alis" ? M.aliciAlis : M.aliciSatis, solMargin, y, {
    boyut: 9,
    renk: RENK.GRI,
    kalin: true,
  });
  y -= 15;
  yaz(data.firma.ad, solMargin, y, { boyut: 11.5, kalin: true });
  y -= 15;
  if (data.firma.adres) y = coklusatirYaz(data.firma.adres, solMargin, y, 260);
  if (data.firma.telefon) {
    yaz(data.firma.telefon, solMargin, y, { boyut: 9.5, renk: RENK.GRI });
    y -= 13;
  }
  if (data.firma.eposta) {
    yaz(data.firma.eposta, solMargin, y, { boyut: 9.5, renk: RENK.GRI });
    y -= 13;
  }
  if (data.firma.vergiNo) {
    yaz(`${M.vergiNo}: ${data.firma.vergiNo}`, solMargin, y, { boyut: 9.5, renk: RENK.GRI });
    y -= 13;
  }
  y -= 22;

  // ── Mesaj ──
  if (data.mesaj) {
    y = coklusatirYaz(data.mesaj, solMargin, y, sagMargin - solMargin, 9.5);
    y -= 30;
  }

  // ── Bilgi tablosu ──
  const bilgiAlanlari = [
    { baslik: M.satici, deger: data.satici },
    { baslik: M.termin, deger: data.termin },
    { baslik: M.nakliye, deger: data.nakliye },
    { baslik: M.teslimat, deger: data.teslimatSekli },
    { baslik: M.odemeSartlari, deger: data.odemeSartlari },
  ].filter((a) => a.deger);

  if (bilgiAlanlari.length > 0) {
    const kolonGenislik = (sagMargin - solMargin) / bilgiAlanlari.length;
    sayfa.drawRectangle({
      x: solMargin,
      y: y - 6,
      width: sagMargin - solMargin,
      height: 38,
      color: RENK.ZEMIN,
    });
    bilgiAlanlari.forEach((a, i) => {
      const x = solMargin + i * kolonGenislik + 8;
      yaz(a.baslik, x, y + 14, { boyut: 8, renk: RENK.GRI, kalin: true });
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
    yaz(para(k.birimFiyat), solMargin + 420, y, { boyut: 10, hizalama: "sag" });
    yaz(para(tutar), sagMargin, y, { boyut: 10, hizalama: "sag" });
    y -= 18;
  }

  y -= 6;
  if (y < ALT_SINIR + 130) {
    sayfa = pdf.addPage(A4 as unknown as [number, number]);
    y = A4[1] - 48;
  }
  cizgi(y);
  y -= 24;

  const matrah = araToplam + data.kargoBedeli;
  const kdvTutari = matrah * (data.kdvOrani / 100);
  const genelToplam = matrah + kdvTutari - data.iskonto;

  const ozetX = solMargin + 320;
  yaz(M.araToplam, ozetX, y, { boyut: 10, renk: RENK.GRI });
  yaz(para(araToplam), sagMargin, y, { boyut: 10, hizalama: "sag" });
  y -= 16;
  if (data.kargoBedeli > 0) {
    yaz(M.kargo, ozetX, y, { boyut: 10, renk: RENK.GRI });
    yaz(para(data.kargoBedeli), sagMargin, y, { boyut: 10, hizalama: "sag" });
    y -= 16;
  }
  yaz(`${M.kdv} (${yuzdeFormat(data.kdvOrani, data.dil)})`, ozetX, y, { boyut: 10, renk: RENK.GRI });
  yaz(para(kdvTutari), sagMargin, y, { boyut: 10, hizalama: "sag" });
  y -= 16;
  if (data.iskonto > 0) {
    yaz(M.iskonto, ozetX, y, { boyut: 10, renk: RENK.GRI });
    yaz(`-${para(data.iskonto)}`, sagMargin, y, { boyut: 10, hizalama: "sag" });
    y -= 16;
  }
  yaz(M.genelToplam, ozetX, y, { boyut: 12, renk: RENK.YESIL, kalin: true });
  yaz(para(genelToplam), sagMargin, y, { boyut: 12, renk: RENK.YESIL, hizalama: "sag", kalin: true });
  y -= 30;

  // ── Banka bilgisi ──
  if (data.sirket.bankaBilgisi && y > ALT_SINIR + 40) {
    const satirlar = data.sirket.bankaBilgisi.split("\n").filter(Boolean);
    for (const satir of satirlar) {
      yaz(satir, solMargin, y, { boyut: 9, renk: RENK.GRI });
      y -= 12;
    }
    y -= 8;
  }

  // ── Notlar ──
  if (data.notlar && y > ALT_SINIR + 20) {
    yaz(M.not, solMargin, y, { boyut: 8.5, renk: RENK.GRI, kalin: true });
    y -= 13;
    coklusatirYaz(data.notlar, solMargin, y, sagMargin - solMargin, 9);
  }

  if (!sablonModu) {
    sayfa.drawText("Created by Digio Medya ve Yazılım", {
      x: solMargin,
      y: 30,
      size: 8,
      font,
      color: RENK.GRI,
    });
  }

  return pdf.save();
}
