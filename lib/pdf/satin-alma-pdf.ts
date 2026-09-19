import { type PDFFont, type PDFPage } from "pdf-lib";
import { A4, RENK, belgeAc, gorseliGom, type Renk } from "./ortak";
import { TEDARIK_METIN, paraFormat, tarihFormat, yuzdeFormat, type Dil } from "./i18n";

const ALT_SINIR = 80;

export type SatinAlmaPdfData = {
  dil: Dil;
  poNo: string | null;
  tarih: string;
  teklifRef: string | null;
  iletisim: string | null;
  teslimat: string | null;
  nakliye: string | null;
  termin: string | null;
  odemeSartlari: string | null;
  mesaj: string | null;
  notlar: string | null;
  paraBirimi: string;
  kdvOrani: number;
  kargoBedeli: number;
  kargoNotu: string | null;
  tedarikci: {
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
  };
  kalemler: { adet: number; aciklama: string; termin: string | null; birimFiyat: number }[];
};

function satirlaraBol(metin: string, f: PDFFont, boyut: number, maks: number): string[] {
  const sonuc: string[] = [];
  for (const paragraf of metin.split(/\r?\n/)) {
    if (!paragraf.trim()) {
      sonuc.push("");
      continue;
    }
    let satir = "";
    for (const kelime of paragraf.split(/\s+/)) {
      const aday = satir ? `${satir} ${kelime}` : kelime;
      if (f.widthOfTextAtSize(aday, boyut) > maks && satir) {
        sonuc.push(satir);
        satir = kelime;
      } else {
        satir = aday;
      }
    }
    if (satir) sonuc.push(satir);
  }
  return sonuc;
}

export async function generateSatinAlmaPdf(data: SatinAlmaPdfData): Promise<Uint8Array> {
  const M = TEDARIK_METIN[data.dil];
  const para = (n: number) => paraFormat(n, data.paraBirimi, data.dil);

  const belge = await belgeAc(null);
  const { pdf, font, fontBold } = belge;
  let sayfa: PDFPage = belge.sayfa;

  const solMargin = 48;
  const sagMargin = belge.genislik - 48;
  let y = belge.yukseklik - 52;

  function yaz(
    metin: string,
    x: number,
    yPos: number,
    opts: { boyut?: number; renk?: Renk; hizalama?: "sol" | "sag" | "orta"; kalin?: boolean } = {},
  ) {
    const boyut = opts.boyut ?? 10;
    const f = opts.kalin ? fontBold : font;
    const genislik = f.widthOfTextAtSize(metin, boyut);
    const cizimX = opts.hizalama === "sag" ? x - genislik : opts.hizalama === "orta" ? x - genislik / 2 : x;
    sayfa.drawText(metin, { x: cizimX, y: yPos, size: boyut, font: f, color: opts.renk ?? RENK.SIYAH });
  }

  function cizgiYatay(yPos: number, x1 = solMargin, x2 = sagMargin, renk: Renk = RENK.AC_GRI, kalinlik = 0.75) {
    sayfa.drawLine({ start: { x: x1, y: yPos }, end: { x: x2, y: yPos }, thickness: kalinlik, color: renk });
  }

  function cizgiDikey(x: number, y1: number, y2: number) {
    sayfa.drawLine({ start: { x, y: y1 }, end: { x, y: y2 }, thickness: 0.75, color: RENK.AC_GRI });
  }

  function blokYaz(satirlar: string[], boyut: number, renk: Renk = RENK.SIYAH, kalin = false) {
    for (const satir of satirlar) {
      yaz(satir, solMargin, y, { boyut, renk, kalin });
      y -= boyut + 3.5;
    }
  }

  // ── Başlık: PURCHASE ORDER + logo/tarih ──
  yaz(M.baslik, solMargin, y, { boyut: 17, kalin: true, renk: RENK.YESIL });

  const logoImg = data.sirket.logoUrl ? await gorseliGom(pdf, data.sirket.logoUrl) : null;
  let logoAlt = y;
  if (logoImg) {
    const oran = Math.min(110 / logoImg.width, 50 / logoImg.height, 1);
    const w = logoImg.width * oran;
    const h = logoImg.height * oran;
    sayfa.drawImage(logoImg, { x: sagMargin - w, y: y - h + 12, width: w, height: h });
    logoAlt = y - h + 12;
  }
  yaz(tarihFormat(data.tarih, data.dil), sagMargin, logoAlt - 14, { boyut: 10, hizalama: "sag", renk: RENK.GRI });

  y -= 30;

  // ── Kendi şirket bilgileri ──
  yaz(data.sirket.sirketAdi || "—", solMargin, y, { boyut: 11.5, kalin: true });
  y -= 15;
  if (data.sirket.adres) blokYaz(satirlaraBol(data.sirket.adres, font, 9.5, 300), 9.5, RENK.GRI);
  if (data.sirket.telefon) blokYaz([data.sirket.telefon], 9.5, RENK.GRI);
  if (data.sirket.eposta) blokYaz([data.sirket.eposta], 9.5, RENK.GRI);
  if (data.sirket.vergiNo) blokYaz([`${M.vergiNo}: ${data.sirket.vergiNo}`], 9.5, RENK.GRI);
  y -= 12;

  // ── Tedarikçi ──
  yaz(M.tedarikci, solMargin, y, { boyut: 9, kalin: true, renk: RENK.GRI });
  y -= 14;
  yaz(data.tedarikci.ad, solMargin, y, { boyut: 11, kalin: true });
  y -= 14.5;
  if (data.tedarikci.adres) blokYaz(satirlaraBol(data.tedarikci.adres, font, 9.5, 300), 9.5);
  if (data.tedarikci.telefon) blokYaz([data.tedarikci.telefon], 9.5, RENK.GRI);
  if (data.tedarikci.eposta) blokYaz([data.tedarikci.eposta], 9.5, RENK.GRI);
  if (data.tedarikci.vergiNo) blokYaz([`${M.vergiNo}: ${data.tedarikci.vergiNo}`], 9.5, RENK.GRI);
  y -= 16;

  // ── Giriş metni ──
  yaz(M.selam, solMargin, y, { boyut: 10 });
  y -= 14;
  if (data.teklifRef) {
    const [bas, ref, son] = M.talepRef(data.teklifRef);
    yaz(bas, solMargin, y, { boyut: 10 });
    const x1 = solMargin + font.widthOfTextAtSize(bas, 10);
    yaz(ref, x1, y, { boyut: 10, kalin: true });
    if (son) yaz(son, x1 + fontBold.widthOfTextAtSize(ref, 10), y, { boyut: 10 });
  } else {
    yaz(M.talep, solMargin, y, { boyut: 10 });
  }
  y -= 14;
  if (data.mesaj) {
    for (const s of satirlaraBol(data.mesaj, font, 10, sagMargin - solMargin)) {
      yaz(s, solMargin, y, { boyut: 10 });
      y -= 13;
    }
  }
  y -= 18;

  // ── Bilgi tablosu (kenarlıklı) ──
  const bilgi = [
    { baslik: M.iletisim, deger: data.iletisim },
    { baslik: M.poNo, deger: data.poNo },
    { baslik: M.teslimat, deger: data.teslimat },
    { baslik: M.nakliye, deger: data.nakliye },
    { baslik: M.termin, deger: data.termin },
    { baslik: M.odemeSartlari, deger: data.odemeSartlari },
  ];
  const tabloGenislik = sagMargin - solMargin;
  const kolon = tabloGenislik / bilgi.length;
  const baslikY = y;
  const degerSatirlari = bilgi.map((b) => satirlaraBol(b.deger || "—", font, 9.5, kolon - 12).slice(0, 3));
  const degerYuksekligi = Math.max(...degerSatirlari.map((s) => s.length)) * 12 + 12;
  const tabloUst = baslikY + 14;
  const baslikAlt = baslikY - 10;
  const tabloAlt = baslikAlt - degerYuksekligi;

  sayfa.drawRectangle({
    x: solMargin,
    y: tabloAlt,
    width: tabloGenislik,
    height: tabloUst - tabloAlt,
    borderColor: RENK.AC_GRI,
    borderWidth: 0.75,
  });
  cizgiYatay(baslikAlt);
  bilgi.forEach((b, i) => {
    const x = solMargin + i * kolon;
    if (i > 0) cizgiDikey(x, tabloUst, tabloAlt);
    yaz(b.baslik, x + kolon / 2, baslikY, { boyut: 8.5, kalin: true, hizalama: "orta" });
    degerSatirlari[i].forEach((s, si) => yaz(s, x + 6, baslikAlt - 15 - si * 12, { boyut: 9.5 }));
  });
  y = tabloAlt - 26;

  // ── Kalemler ──
  const xAdet = solMargin + 4;
  const xTanim = solMargin + 56;
  const xTermin = solMargin + 318;
  const xFiyat = solMargin + 432;
  const tanimGenislik = xTermin - xTanim - 12;

  function kalemBasligiCiz() {
    sayfa.drawRectangle({ x: solMargin, y: y - 6, width: tabloGenislik, height: 20, color: RENK.ZEMIN });
    yaz(M.adet, xAdet, y, { boyut: 8.5, kalin: true, renk: RENK.GRI });
    yaz(M.tanim, xTanim, y, { boyut: 8.5, kalin: true, renk: RENK.GRI });
    yaz(M.kalemTermin, xTermin, y, { boyut: 8.5, kalin: true, renk: RENK.GRI });
    yaz(M.birimFiyat, xFiyat, y, { boyut: 8.5, kalin: true, renk: RENK.GRI, hizalama: "sag" });
    yaz(M.toplam, sagMargin - 4, y, { boyut: 8.5, kalin: true, renk: RENK.GRI, hizalama: "sag" });
    y -= 22;
  }

  kalemBasligiCiz();

  let araToplam = 0;
  for (const k of data.kalemler) {
    const tanimSatirlari = satirlaraBol(k.aciklama, font, 10, tanimGenislik);
    const yukseklik = Math.max(tanimSatirlari.length, 1) * 12.5 + 7;
    if (y - yukseklik < ALT_SINIR) {
      sayfa = pdf.addPage(A4 as unknown as [number, number]);
      y = A4[1] - 52;
      kalemBasligiCiz();
    }
    const tutar = k.adet * k.birimFiyat;
    araToplam += tutar;
    yaz(String(k.adet), xAdet, y, { boyut: 10, kalin: true });
    tanimSatirlari.forEach((s, i) => yaz(s, xTanim, y - i * 12.5, { boyut: 10 }));
    if (k.termin) yaz(k.termin, xTermin, y, { boyut: 10 });
    yaz(para(k.birimFiyat), xFiyat, y, { boyut: 10, hizalama: "sag" });
    yaz(para(tutar), sagMargin - 4, y, { boyut: 10, hizalama: "sag" });
    y -= yukseklik;
    cizgiYatay(y + 12);
  }

  y -= 14;
  if (y < ALT_SINIR + 110) {
    sayfa = pdf.addPage(A4 as unknown as [number, number]);
    y = A4[1] - 52;
  }

  // ── Toplamlar (kenarlıklı kutu) ──
  const kdvTutari = araToplam * (data.kdvOrani / 100);
  const genelToplam = araToplam + kdvTutari + data.kargoBedeli;
  const satirlar: { etiket: string; deger: string; kalin?: boolean }[] = [
    { etiket: M.araToplam, deger: para(araToplam), kalin: true },
    { etiket: `${M.kdv}${data.kdvOrani ? ` (${yuzdeFormat(data.kdvOrani, data.dil)})` : ""}`, deger: data.kdvOrani ? para(kdvTutari) : sayiSifir(data) },
  ];
  if (data.kargoBedeli > 0) satirlar.push({ etiket: M.kargo, deger: para(data.kargoBedeli) });
  else if (data.kargoNotu) satirlar.push({ etiket: M.kargo, deger: data.kargoNotu });
  satirlar.push({ etiket: M.genelToplam, deger: para(genelToplam), kalin: true });

  const kutuSol = sagMargin - 230;
  const etiketSag = kutuSol + 96;
  const satirYuk = 22;
  const kutuUst = y + 14;
  const kutuAlt = kutuUst - satirlar.length * satirYuk;
  sayfa.drawRectangle({
    x: kutuSol + 110 - 6,
    y: kutuAlt,
    width: sagMargin - (kutuSol + 110 - 6),
    height: kutuUst - kutuAlt,
    borderColor: RENK.AC_GRI,
    borderWidth: 0.75,
  });
  satirlar.forEach((s, i) => {
    const yy = kutuUst - (i + 1) * satirYuk + 7;
    if (i > 0) cizgiYatay(kutuUst - i * satirYuk, kutuSol + 104, sagMargin);
    yaz(s.etiket, etiketSag, yy, { boyut: 9.5, hizalama: "sag", kalin: s.kalin });
    yaz(s.deger, kutuSol + 118, yy, { boyut: 9.5, kalin: s.kalin });
  });
  y = kutuAlt - 30;

  // ── Banka bilgisi ──
  if (data.sirket.bankaBilgisi) {
    for (const satir of data.sirket.bankaBilgisi.split(/\r?\n/).filter(Boolean)) {
      if (y < ALT_SINIR) {
        sayfa = pdf.addPage(A4 as unknown as [number, number]);
        y = A4[1] - 52;
      }
      yaz(satir, solMargin, y, { boyut: 9, renk: RENK.GRI });
      y -= 12;
    }
    y -= 8;
  }

  // ── Notlar ──
  if (data.notlar && y > ALT_SINIR) {
    yaz(M.not, solMargin, y, { boyut: 8.5, kalin: true, renk: RENK.GRI });
    y -= 13;
    for (const s of satirlaraBol(data.notlar, font, 9, sagMargin - solMargin)) {
      yaz(s, solMargin, y, { boyut: 9 });
      y -= 12;
    }
  }

  sayfa.drawText("Created by Digio Medya ve Yazılım", {
    x: solMargin,
    y: 30,
    size: 8,
    font,
    color: RENK.GRI,
  });

  return pdf.save();
}

function sayiSifir(data: SatinAlmaPdfData) {
  return paraFormat(0, data.paraBirimi, data.dil);
}
