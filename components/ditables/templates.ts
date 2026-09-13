export type SablonKey = "bos" | "urun" | "firma";

export const SABLONLAR: Record<SablonKey, { label: string; headers: string[] }> = {
  bos: { label: "Boş Sayfa", headers: [] },
  urun: {
    label: "Ürün Şablonu",
    headers: [
      "Ürün Adı",
      "Fotoğraf URL",
      "Stok Adedi",
      "Ortalama Maliyet",
      "Satış Fiyatı",
      "Kritik Stok Eşiği",
    ],
  },
  firma: {
    label: "Firma Şablonu",
    headers: ["Firma Adı", "Renk (hex)", "Tedarikçi (Evet/Hayır)", "Müşteri (Evet/Hayır)"],
  },
};

export const SUTUN_HARFLERI = Array.from({ length: 15 }, (_, i) => String.fromCharCode(65 + i));
export const SATIR_SAYISI = 30;
