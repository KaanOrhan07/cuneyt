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

export const DURUM_LABEL: Record<SiparisDurum, string> = {
  beklemede: "Beklemede",
  yolda: "Yolda",
  teslim_edildi: "Teslim edildi",
  iptal_edildi: "İptal edildi",
};
