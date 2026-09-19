export type Firma = {
  id: string;
  ad: string;
  renk: string;
  is_tedarikci: boolean;
  is_musteri: boolean;
  adres: string | null;
  telefon: string | null;
  eposta: string | null;
  vergi_no: string | null;
  deleted_at: string | null;
  created_at: string;
};

export type Urun = {
  id: string;
  ad: string;
  fotograf_url: string | null;
  stok_adet: number;
  ortalama_maliyet: number;
  satis_fiyati: number;
  kritik_stok_esigi: number;
  deleted_at: string | null;
  created_at: string;
};

export type SiparisTip = "alis" | "satis";
export type SiparisDurum = "beklemede" | "yolda" | "teslim_edildi" | "iptal_edildi";

export type Siparis = {
  id: string;
  firma_id: string;
  tip: SiparisTip;
  durum: SiparisDurum;
  tarih_saat: string;
  son_teslim_tarihi: string | null;
  siparis_no: string | null;
  kdv_orani: number;
  kargo_bedeli: number;
  created_at: string;
};

export type SiparisKalemi = {
  id: string;
  siparis_id: string;
  urun_id: string;
  adet: number;
  birim_fiyat: number;
  teslim_edilen_adet: number;
  created_at: string;
};

export type StokYon = "giris" | "cikis";

export type StokHareketi = {
  id: string;
  urun_id: string;
  siparis_id: string | null;
  yon: StokYon;
  adet: number;
  tarih: string;
};

export const DURUM_LABEL: Record<SiparisDurum, string> = {
  beklemede: "Beklemede",
  yolda: "Yolda",
  teslim_edildi: "Teslim edildi",
  iptal_edildi: "İptal edildi",
};

export type TeklifDurum = "beklemede" | "kabul_edildi" | "reddedildi";

export type Teklif = {
  id: string;
  firma_id: string;
  tip: SiparisTip;
  durum: TeklifDurum;
  tarih_saat: string;
  teklif_no: string | null;
  satici: string | null;
  termin: string | null;
  nakliye: string | null;
  teslimat_sekli: string | null;
  odeme_sartlari: string | null;
  mesaj: string | null;
  notlar: string | null;
  iskonto: number;
  kdv_orani: number;
  para_birimi: string;
  sablon_kullan: boolean;
  kargo_bedeli: number;
  created_at: string;
};

export type TeklifKalemi = {
  id: string;
  teklif_id: string;
  urun_id: string;
  adet: number;
  birim_fiyat: number;
  created_at: string;
};

export const TEKLIF_DURUM_LABEL: Record<TeklifDurum, string> = {
  beklemede: "Beklemede",
  kabul_edildi: "Kabul edildi",
  reddedildi: "Reddedildi",
};

export type CariYon = "alacak" | "verecek";

export type CariHareket = {
  id: string;
  firma_id: string;
  tarih: string;
  fatura_no: string | null;
  tutar: number;
  vade_tarihi: string | null;
  aciklama: string | null;
  yon: CariYon;
  para_birimi: string;
  created_at: string;
};

export type CariOdeme = {
  id: string;
  cari_hareket_id: string;
  tarih: string;
  tutar: number;
  created_at: string;
};

export type SirketProfili = {
  id: true;
  sirket_adi: string | null;
  adres: string | null;
  telefon: string | null;
  eposta: string | null;
  vergi_no: string | null;
  banka_bilgisi: string | null;
  logo_url: string | null;
  ozel_sablon_url: string | null;
  alis_teklif_sablon_url: string | null;
  varsayilan_notlar: string | null;
  updated_at: string;
};

export type EkipUyesi = {
  id: string;
  auth_user_id: string;
  ad_soyad: string;
  eposta: string;
  created_at: string;
};

export type Gider = {
  id: string;
  tarih: string;
  kategori: string | null;
  aciklama: string;
  tutar: number;
  para_birimi: string;
  created_at: string;
};

export type SatinAlmaDurum = "taslak" | "gonderildi" | "teslim_alindi" | "iptal_edildi";

export const SATIN_ALMA_DURUM_LABEL: Record<SatinAlmaDurum, string> = {
  taslak: "Taslak",
  gonderildi: "Gönderildi",
  teslim_alindi: "Teslim alındı",
  iptal_edildi: "İptal edildi",
};

export type SatinAlma = {
  id: string;
  firma_id: string;
  po_no: string | null;
  tarih: string;
  teklif_ref: string | null;
  iletisim: string | null;
  teslimat: string | null;
  nakliye: string | null;
  termin: string | null;
  odeme_sartlari: string | null;
  mesaj: string | null;
  notlar: string | null;
  para_birimi: string;
  kdv_orani: number;
  kargo_bedeli: number;
  kargo_notu: string | null;
  durum: SatinAlmaDurum;
  created_at: string;
};

export type SatinAlmaKalemi = {
  id: string;
  satin_alma_id: string;
  sira: number;
  adet: number;
  aciklama: string;
  termin: string | null;
  birim_fiyat: number;
};

export type IslemKaydi = {
  id: string;
  created_at: string;
  kullanici_id: string | null;
  kullanici_ad: string | null;
  modul: string;
  islem: string;
  kayit_id: string | null;
  baslik: string | null;
  detay: Record<string, unknown> | null;
};
