import { TR_TIMEZONE, paraBirimiSembol } from "@/lib/format";

export type Dil = "tr" | "en";

export const DIL_ETIKET: Record<Dil, string> = { tr: "Türkçe", en: "English" };

export function dilCoz(v: string | null | undefined, varsayilan: Dil = "tr"): Dil {
  return v === "en" ? "en" : v === "tr" ? "tr" : varsayilan;
}

export function tarihFormat(value: string | Date, dil: Dil) {
  return new Date(value).toLocaleDateString(dil === "en" ? "en-GB" : "tr-TR", {
    timeZone: TR_TIMEZONE,
  });
}

export function sayiFormat(n: number, dil: Dil, digits = 2) {
  return n.toLocaleString(dil === "en" ? "en-GB" : "tr-TR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function yuzdeFormat(n: number, dil: Dil) {
  return dil === "en" ? `${n}%` : `%${n}`;
}

export function paraFormat(n: number, paraBirimi: string, dil: Dil) {
  return `${paraBirimiSembol(paraBirimi)}${sayiFormat(n, dil)}`;
}

export const SIPARIS_METIN = {
  tr: {
    altBaslik: "Sipariş Takip",
    baslikAlis: "ALIŞ SİPARİŞ FORMU",
    baslikSatis: "SATIŞ SİPARİŞ FORMU",
    siparisNo: "Sipariş No",
    firma: "Firma",
    tarih: "Tarih",
    sonTeslim: "Son Teslim Tarihi",
    durum: "Durum",
    urun: "Ürün",
    istenen: "İstenen",
    teslimEdilen: "Teslim Edilen",
    birimFiyat: "Birim Fiyat",
    tutar: "Tutar",
    araToplam: "Ara Toplam",
    kargo: "Kargo",
    kdv: "KDV",
    genelToplam: "Genel Toplam",
    durumlar: {
      beklemede: "Beklemede",
      yolda: "Yolda",
      teslim_edildi: "Teslim edildi",
      iptal_edildi: "İptal edildi",
    } as Record<string, string>,
  },
  en: {
    altBaslik: "Order Tracking",
    baslikAlis: "PURCHASE ORDER FORM",
    baslikSatis: "SALES ORDER FORM",
    siparisNo: "Order No",
    firma: "Company",
    tarih: "Date",
    sonTeslim: "Delivery Deadline",
    durum: "Status",
    urun: "Product",
    istenen: "Ordered",
    teslimEdilen: "Delivered",
    birimFiyat: "Unit Price",
    tutar: "Amount",
    araToplam: "Subtotal",
    kargo: "Shipping",
    kdv: "VAT",
    genelToplam: "Total",
    durumlar: {
      beklemede: "Pending",
      yolda: "In transit",
      teslim_edildi: "Delivered",
      iptal_edildi: "Cancelled",
    } as Record<string, string>,
  },
} as const;

export const TEKLIF_METIN = {
  tr: {
    baslikSatis: "TEKLİF",
    baslikAlis: "ALIŞ TEKLİFİ",
    teklifNo: "Teklif No",
    aliciSatis: "ALICI",
    aliciAlis: "TEDARİKÇİ",
    vergiNo: "Vergi No",
    satici: "SATICI",
    termin: "TERMİN",
    nakliye: "NAKLİYE",
    teslimat: "TESLİMAT",
    odemeSartlari: "ÖDEME ŞARTLARI",
    urunAciklama: "Ürün / Açıklama",
    adet: "Adet",
    birimFiyat: "Birim Fiyat",
    tutar: "Tutar",
    araToplam: "Ara Toplam",
    kargo: "Nakliye",
    kdv: "KDV",
    iskonto: "İskonto",
    genelToplam: "Genel Toplam",
    not: "NOT",
  },
  en: {
    baslikSatis: "QUOTATION",
    baslikAlis: "PURCHASE QUOTATION",
    teklifNo: "Quote No",
    aliciSatis: "BUYER",
    aliciAlis: "SUPPLIER",
    vergiNo: "Tax No",
    satici: "SALESPERSON",
    termin: "LEAD TIME",
    nakliye: "SHIPPING",
    teslimat: "DELIVERY",
    odemeSartlari: "PAYMENT TERMS",
    urunAciklama: "Item / Description",
    adet: "Qty",
    birimFiyat: "Unit Price",
    tutar: "Amount",
    araToplam: "Subtotal",
    kargo: "Shipping",
    kdv: "VAT",
    iskonto: "Discount",
    genelToplam: "Total",
    not: "NOTE",
  },
} as const;

export const TEDARIK_METIN = {
  tr: {
    baslik: "SATIN ALMA SİPARİŞİ",
    tedarikci: "TEDARİKÇİ",
    vergiNo: "Vergi No",
    selam: "Sayın yetkili,",
    talepRef: (ref: string) => ["Aşağıdaki kalemleri ", ref, " numaralı teklifiniz doğrultusunda tedarik etmenizi rica ederiz."],
    talep: "Aşağıdaki kalemleri tedarik etmenizi rica ederiz.",
    iletisim: "İLGİLİ KİŞİ",
    poNo: "SİPARİŞ NO",
    teslimat: "TESLİMAT",
    nakliye: "NAKLİYE",
    termin: "TERMİN",
    odemeSartlari: "ÖDEME ŞARTLARI",
    adet: "ADET",
    tanim: "TANIM",
    kalemTermin: "TERMİN",
    birimFiyat: "BİRİM FİYAT",
    toplam: "TOPLAM",
    araToplam: "ARA TOPLAM",
    kdv: "KDV",
    kargo: "NAKLİYE",
    genelToplam: "GENEL TOPLAM",
    not: "NOT",
  },
  en: {
    baslik: "PURCHASE ORDER",
    tedarikci: "VENDOR",
    vergiNo: "Tax no",
    selam: "To Whom it may concern;",
    talepRef: (ref: string) => ["Please supply the components below for your quote ", ref, ""],
    talep: "Please supply the components below.",
    iletisim: "CONTACT",
    poNo: "PO NO",
    teslimat: "DELIVERY",
    nakliye: "CARRIAGE",
    termin: "TERMIN",
    odemeSartlari: "TERMS",
    adet: "QTY",
    tanim: "DESCRIPTION",
    kalemTermin: "LEAD TIME",
    birimFiyat: "UNIT PRICE",
    toplam: "TOTAL",
    araToplam: "SUBTOTAL",
    kdv: "VAT",
    kargo: "CARRIAGE",
    genelToplam: "TOTAL",
    not: "NOTES",
  },
} as const;
