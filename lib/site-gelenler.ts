import type { SupabaseClient } from "@supabase/supabase-js";
import type { GelenKalem, GelenTip } from "@/lib/types";

export type NormalGelen = {
  tip: GelenTip;
  dis_id: string;
  dis_no: string | null;
  musteri_ad: string | null;
  musteri_firma: string | null;
  musteri_eposta: string | null;
  musteri_telefon: string | null;
  toplam: number | null;
  para_birimi: string;
  kalemler: GelenKalem[];
  notlar: string | null;
  ham: unknown;
  dis_olusturma: string | null;
  dis_guncelleme: string | null;
};

type Nesne = Record<string, unknown>;

function nesneMi(v: unknown): v is Nesne {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function bos(v: unknown) {
  return v === undefined || v === null || v === "";
}

/** Verilen anahtarlardan ilk dolu olanı döndürür (örn. "customer.email" gibi noktalı yollar desteklenir). */
function sec(obj: unknown, ...anahtarlar: string[]): unknown {
  if (!nesneMi(obj)) return undefined;
  for (const anahtar of anahtarlar) {
    let cur: unknown = obj;
    for (const parca of anahtar.split(".")) {
      cur = nesneMi(cur) ? cur[parca] : undefined;
    }
    if (!bos(cur)) return cur;
  }
  return undefined;
}

function metin(v: unknown): string | null {
  if (bos(v)) return null;
  if (typeof v === "string") return v.trim() || null;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return null;
}

function sayi(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  let s = v.replace(/[^\d.,-]/g, "");
  if (!s) return null;
  const sonVirgul = s.lastIndexOf(",");
  const sonNokta = s.lastIndexOf(".");
  if (sonVirgul > -1 && sonNokta > -1) {
    s = sonVirgul > sonNokta ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (sonVirgul > -1) {
    s = s.replace(",", ".");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function tarih(v: unknown): string | null {
  const s = metin(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function kalemlerCikar(d: unknown): GelenKalem[] {
  const liste = sec(d, "items", "kalemler", "line_items", "lineItems", "lines", "products", "urunler");
  if (!Array.isArray(liste)) return [];
  return liste.flatMap((it): GelenKalem[] => {
    if (!nesneMi(it)) return [];
    const ad =
      metin(
        sec(
          it,
          "name",
          "ad",
          "title",
          "product_name",
          "productName",
          "urun",
          "urun_adi",
          "product.name",
          "description",
          "order_code",
          "orderCode",
          "sku",
        ),
      ) ?? "—";
    const adet = sayi(sec(it, "quantity", "adet", "qty", "miktar")) ?? 1;
    const fiyat = sayi(
      sec(it, "unit_price", "unitPrice", "quoted_unit_price", "price", "birim_fiyat", "fiyat"),
    );
    return [{ ad, adet, birim_fiyat: fiyat }];
  });
}

/** Müşteri notuna ek olarak proje adı, istenen teslim, adres ve vergi bilgisini okunur bir nota toplar. */
function notlarBirlestir(d: unknown, musteri: unknown): string | null {
  const parcalar = [
    metin(sec(d, "note", "notes", "message", "mesaj", "not", "notlar", "comment", "comments", "customer_note", "customerNote")),
    ((p) => (p ? `Proje: ${p}` : null))(metin(sec(d, "project_name", "projectName", "proje"))),
    ((t) => (t ? `İstenen teslim: ${t}` : null))(metin(sec(d, "requested_delivery", "requestedDelivery"))),
    ((a) => (a ? `Adres: ${a}` : null))(metin(sec(musteri, "address", "adres") ?? sec(d, "address", "adres"))),
    ((v) => (v ? `Vergi: ${v}` : null))(
      [metin(sec(musteri, "tax_number", "taxNumber", "vergi_no")), metin(sec(musteri, "tax_office", "taxOffice", "vergi_dairesi"))]
        .filter(Boolean)
        .join(" / "),
    ),
  ].filter((p): p is string => Boolean(p));
  return parcalar.length ? parcalar.join("\n") : null;
}

/** Olay adından (order.created, quote.updated ...) tipi çıkarır; ilgilenmediğimiz olaylar için null. */
export function olayTipi(olay: string | null): GelenTip | null {
  if (!olay) return null;
  const o = olay.toLowerCase();
  if (o === "order.created" || o === "order.updated") return "siparis";
  if (o === "quote.created" || o === "quote.updated") return "teklif";
  return null;
}

/**
 * Siteden gelen (webhook ya da API) bir sipariş/teklif kaydını DiTrack alanlarına eşler.
 * Şema henüz kesin olmadığı için yaygın alan adlarını dener; bulunamayanlar boş kalır, ham veri her zaman saklanır.
 */
export function normalizeGelen(
  govde: unknown,
  tip: GelenTip,
  kaynak: "webhook" | "api",
): NormalGelen | null {
  let d: unknown = govde;
  if (kaynak === "webhook") {
    // Zarf: { id (olay kimliği), type, data: { quote | order | object } } — olay kimliğini kayıt kimliği sanmamak için içteki nesneye in.
    d = sec(govde, "data.object", "data.quote", "data.order", "payload", "order", "quote", "data") ?? govde;
  }
  if (!nesneMi(d)) return null;

  const dis_no = metin(
    sec(
      d,
      "number",
      "order_number",
      "orderNumber",
      "order_no",
      "orderNo",
      "quote_number",
      "quoteNumber",
      "quote_no",
      "quoteNo",
      "siparis_no",
      "teklif_no",
      "reference",
      "ref",
      "no",
      "code",
    ),
  );
  const dis_id = metin(sec(d, "id", "uuid", "_id", "order_id", "quote_id")) ?? dis_no;
  if (!dis_id) return null;

  const musteri = sec(d, "customer", "musteri", "contact", "user", "billing", "client");
  const adSoyad = [sec(musteri, "first_name", "firstName", "ad"), sec(musteri, "last_name", "lastName", "soyad")]
    .map(metin)
    .filter(Boolean)
    .join(" ");

  const kalemler = kalemlerCikar(d);
  let toplam = sayi(sec(d, "total", "toplam", "grand_total", "grandTotal", "total_amount", "totalAmount", "amount", "genel_toplam"));
  if (toplam === null && kalemler.length > 0 && kalemler.every((k) => k.birim_fiyat !== null)) {
    toplam = kalemler.reduce((s, k) => s + k.adet * (k.birim_fiyat ?? 0), 0);
  }

  const paraHam = (metin(sec(d, "currency", "para_birimi", "currency_code", "currencyCode")) ?? "TL").toUpperCase();

  return {
    tip,
    dis_id,
    dis_no,
    musteri_ad:
      metin(sec(musteri, "name", "ad", "full_name", "fullName", "ad_soyad", "adSoyad", "contact_name", "contactName")) ??
      (adSoyad || null) ??
      metin(sec(d, "customer_name", "customerName", "musteri_ad", "contact_name", "name")),
    musteri_firma:
      metin(sec(musteri, "company", "company_name", "companyName", "firma", "sirket")) ??
      metin(sec(d, "company", "company_name", "companyName", "firma", "sirket")),
    musteri_eposta:
      metin(sec(musteri, "email", "eposta", "e_posta", "mail")) ??
      metin(sec(d, "customer_email", "customerEmail", "email", "eposta", "musteri_eposta")),
    musteri_telefon:
      metin(sec(musteri, "phone", "telefon", "tel", "mobile", "gsm")) ??
      metin(sec(d, "customer_phone", "customerPhone", "phone", "telefon", "musteri_telefon")),
    toplam,
    para_birimi: paraHam === "TRY" ? "TL" : paraHam,
    kalemler,
    notlar: notlarBirlestir(d, musteri),
    ham: govde,
    dis_olusturma: tarih(sec(d, "created_at", "createdAt", "created", "date")),
    dis_guncelleme: tarih(sec(d, "updated_at", "updatedAt", "updated", "modified_at")),
  };
}

/** Normalize edilmiş kaydı yazar. Aynı (tip, dis_id) tekrar gelirse alanlar güncellenir; onay/ret durumu korunur. */
export async function kaydetGelen(supabase: SupabaseClient, g: NormalGelen) {
  const { data, error } = await supabase
    .from("site_gelenler")
    .upsert(
      {
        tip: g.tip,
        dis_id: g.dis_id,
        dis_no: g.dis_no,
        musteri_ad: g.musteri_ad,
        musteri_firma: g.musteri_firma,
        musteri_eposta: g.musteri_eposta,
        musteri_telefon: g.musteri_telefon,
        toplam: g.toplam,
        para_birimi: g.para_birimi,
        kalemler: g.kalemler,
        notlar: g.notlar,
        ham: g.ham,
        dis_olusturma: g.dis_olusturma,
        dis_guncelleme: g.dis_guncelleme,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tip,dis_id" },
    )
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}
