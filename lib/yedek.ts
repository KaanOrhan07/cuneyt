export type YedekTablosu = {
  tablo: string;
  etiket: string;
  /** Yedekten geri yüklenebilir mi (false ise sadece dışa aktarılır) */
  iceAktar: boolean;
};

/** Sıra önemli: geri yüklerken yabancı anahtar bağımlılıklarına göre bu sırayla eklenir. */
export const YEDEK_TABLOLARI: YedekTablosu[] = [
  { tablo: "firmalar", etiket: "Firmalar", iceAktar: true },
  { tablo: "urunler", etiket: "Ürünler", iceAktar: true },
  { tablo: "siparisler", etiket: "Siparişler", iceAktar: true },
  { tablo: "siparis_kalemleri", etiket: "Sipariş Kalemleri", iceAktar: true },
  { tablo: "teklifler", etiket: "Teklifler", iceAktar: true },
  { tablo: "teklif_kalemleri", etiket: "Teklif Kalemleri", iceAktar: true },
  { tablo: "cari_hareketler", etiket: "Cari Hareketler", iceAktar: true },
  { tablo: "cari_odemeler", etiket: "Cari Ödemeler", iceAktar: true },
  { tablo: "giderler", etiket: "Giderler", iceAktar: true },
  { tablo: "satin_almalar", etiket: "Satın Almalar (Tedarik)", iceAktar: true },
  { tablo: "satin_alma_kalemleri", etiket: "Satın Alma Kalemleri", iceAktar: true },
  { tablo: "stok_hareketleri", etiket: "Stok Hareketleri", iceAktar: false },
  { tablo: "sirket_profili", etiket: "Şirket Profili", iceAktar: false },
  { tablo: "islem_kayitlari", etiket: "İşlem Kayıtları", iceAktar: false },
];

export const IMPORT_EDILEBILIR = new Set(YEDEK_TABLOLARI.filter((t) => t.iceAktar).map((t) => t.tablo));

export const BILGI_SAYFASI = "_bilgi";
export const YEDEK_PARCA_BOYUTU = 200;
