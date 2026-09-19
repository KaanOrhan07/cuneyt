import type { IslemKaydi } from "@/lib/types";

export const MODUL_ETIKET: Record<string, string> = {
  firmalar: "Firma",
  urunler: "Ürün",
  siparisler: "Sipariş",
  siparis_kalemleri: "Sipariş Kalemi",
  teklifler: "Teklif",
  cari_hareketler: "Cari Hareket",
  cari_odemeler: "Cari Ödeme / Tahsilat",
  giderler: "Gider",
  satin_almalar: "Satın Alma (Tedarik)",
  sirket_profili: "Şirket Profili",
  ekip_uyeleri: "Ekip Üyesi",
  yedek: "Yedek",
};

const ALAN_ETIKET: Record<string, string> = {
  ad: "Ad",
  renk: "Renk",
  is_tedarikci: "Tedarikçi",
  is_musteri: "Müşteri",
  adres: "Adres",
  telefon: "Telefon",
  eposta: "E-posta",
  vergi_no: "Vergi No",
  stok_adet: "Stok",
  ortalama_maliyet: "Ort. Maliyet",
  satis_fiyati: "Satış Fiyatı",
  kritik_stok_esigi: "Kritik Eşik",
  fotograf_url: "Fotoğraf",
  durum: "Durum",
  son_teslim_tarihi: "Son Teslim",
  siparis_no: "Sipariş No",
  kdv_orani: "KDV",
  kargo_bedeli: "Kargo",
  teslim_edilen_adet: "Teslim Edilen",
  tutar: "Tutar",
  vade_tarihi: "Vade",
  fatura_no: "Fatura No",
  aciklama: "Açıklama",
  kategori: "Kategori",
  para_birimi: "Para Birimi",
  yon: "Yön",
  satici: "Satıcı",
  termin: "Termin",
  nakliye: "Nakliye",
  iskonto: "İskonto",
  po_no: "PO No",
  teklif_no: "Teklif No",
  sirket_adi: "Şirket Adı",
  banka_bilgisi: "Banka Bilgisi",
  logo_url: "Logo",
  ozel_sablon_url: "Satış Şablonu",
  alis_teklif_sablon_url: "Alış Şablonu",
  varsayilan_notlar: "Varsayılan Not",
  ad_soyad: "Ad Soyad",
  mesaj: "Mesaj",
  notlar: "Not",
  teslimat: "Teslimat",
  teslimat_sekli: "Teslimat",
  odeme_sartlari: "Ödeme Şartları",
  teklif_ref: "Teklif Ref.",
  sablon_kullan: "Şablon Kullan",
  tarih: "Tarih",
};

const GIZLI_ALANLAR = new Set(["id", "created_at", "updated_at", "siparis_id", "firma_id", "auth_user_id", "tarih_saat", "deleted_at"]);

function deger(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Evet" : "Hayır";
  const s = String(v);
  return s.length > 40 ? `${s.slice(0, 38)}…` : s;
}

export type KayitMetni = { islem: string; ton: "green" | "orange" | "gray"; ozet: string };

export function kayitMetni(k: IslemKaydi): KayitMetni {
  const detay = (k.detay ?? {}) as Record<string, unknown>;

  if (k.modul === "yedek") {
    return {
      islem: k.islem === "yedek_indirme" ? "Yedek indirildi" : "Yedek yüklendi",
      ton: "gray",
      ozet: typeof detay.aciklama === "string" ? detay.aciklama : "",
    };
  }

  if (k.islem === "ekleme") {
    const ekstra: string[] = [];
    if (detay.tutar !== undefined) ekstra.push(`${deger(detay.tutar)} ${deger(detay.para_birimi ?? "")}`.trim());
    if (k.modul === "siparisler" && detay.tip) ekstra.push(detay.tip === "alis" ? "Alış" : "Satış");
    if (k.modul === "teklifler" && detay.tip) ekstra.push(detay.tip === "alis" ? "Alış teklifi" : "Satış teklifi");
    if (k.modul === "cari_hareketler" && detay.yon) ekstra.push(detay.yon === "alacak" ? "Alacak" : "Verecek");
    return { islem: "Eklendi", ton: "green", ozet: ekstra.join(" · ") };
  }

  if (k.islem === "silme") {
    return { islem: "Silindi", ton: "orange", ozet: "" };
  }

  // güncelleme
  const silme = detay.deleted_at as unknown[] | undefined;
  if (Array.isArray(silme) && silme.length === 2) {
    return silme[1]
      ? { islem: "Silindi (arşive alındı)", ton: "orange", ozet: "" }
      : { islem: "Geri alındı", ton: "green", ozet: "" };
  }

  const degisimler = Object.entries(detay)
    .filter(([alan, v]) => !GIZLI_ALANLAR.has(alan) && Array.isArray(v) && v.length === 2)
    .map(([alan, v]) => {
      const [eski, yeni] = v as [unknown, unknown];
      return `${ALAN_ETIKET[alan] ?? alan}: ${deger(eski)} → ${deger(yeni)}`;
    });
  const gorunen = degisimler.slice(0, 4).join(" · ");
  const fazla = degisimler.length > 4 ? ` (+${degisimler.length - 4})` : "";
  return { islem: "Güncellendi", ton: "gray", ozet: gorunen + fazla };
}
