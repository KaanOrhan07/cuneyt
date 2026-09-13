export type Firma = {
  id: string;
  ad: string;
  renk: string;
  is_tedarikci: boolean;
  is_musteri: boolean;
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
  created_at: string;
};

export type SiparisKalemi = {
  id: string;
  siparis_id: string;
  urun_id: string;
  adet: number;
  birim_fiyat: number;
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

export type CariHareket = {
  id: string;
  firma_id: string;
  tarih: string;
  fatura_no: string | null;
  tutar: number;
  vade_tarihi: string | null;
  aciklama: string | null;
  created_at: string;
};

export type CariOdeme = {
  id: string;
  cari_hareket_id: string;
  tarih: string;
  tutar: number;
  created_at: string;
};
