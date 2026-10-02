import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { Panel } from "@/components/ui";
import { SiteGelenKarti } from "@/components/site-gelen-karti";
import { SitedenCekButonu } from "@/components/siteden-cek-butonu";
import { epostaYapilandirildiMi } from "@/lib/eposta";
import type { SiteGelen } from "@/lib/types";

type Filters = { tip?: string; durum?: string };

const TIPLER = [
  { key: undefined, label: "Tümü" },
  { key: "teklif", label: "Gelen Teklifler" },
  { key: "siparis", label: "Gelen Siparişler" },
];

const DURUMLAR = [
  { key: undefined, label: "Onay bekleyen" },
  { key: "onaylandi", label: "Onaylanan" },
  { key: "reddedildi", label: "Reddedilen" },
  { key: "hepsi", label: "Hepsi" },
];

function href(tip?: string, durum?: string) {
  const p = new URLSearchParams();
  if (tip) p.set("tip", tip);
  if (durum) p.set("durum", durum);
  const s = p.toString();
  return s ? `/siteden-gelenler?${s}` : "/siteden-gelenler";
}

export default async function SitedenGelenlerPage({ searchParams }: { searchParams: Promise<Filters> }) {
  const { tip, durum } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("site_gelenler").select("*").order("created_at", { ascending: false }).limit(200);
  if (tip === "teklif" || tip === "siparis") query = query.eq("tip", tip);
  if (durum !== "hepsi") query = query.eq("durum", durum === "onaylandi" || durum === "reddedildi" ? durum : "beklemede");

  const [{ data, error }, { data: bekleyenler }] = await Promise.all([
    query,
    supabase.from("site_gelenler").select("tip").eq("durum", "beklemede"),
  ]);

  const kayitlar = (data ?? []) as SiteGelen[];
  const bekleyenTeklif = bekleyenler?.filter((b) => b.tip === "teklif").length ?? 0;
  const bekleyenSiparis = bekleyenler?.filter((b) => b.tip === "siparis").length ?? 0;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const webhookUrl = `${proto}://${host}/api/entegrasyon/webhook`;

  const apiHazir = Boolean(process.env.SITE_API_TABAN_URL && process.env.SITE_API_ANAHTARI);
  const kurulum = [
    { ad: "Webhook anahtarı (X-Api-Key)", hazir: Boolean(process.env.ENTEGRASYON_WEBHOOK_ANAHTARI), env: "ENTEGRASYON_WEBHOOK_ANAHTARI" },
    { ad: "İmza anahtarı (opsiyonel)", hazir: Boolean(process.env.ENTEGRASYON_IMZA_ANAHTARI), env: "ENTEGRASYON_IMZA_ANAHTARI" },
    { ad: "Siteden API ile çekme", hazir: apiHazir, env: "SITE_API_TABAN_URL, SITE_API_ANAHTARI" },
    { ad: "E-posta gönderimi (SMTP)", hazir: epostaYapilandirildiMi(), env: "SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM" },
  ];

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[22px] font-semibold">Siteden Gelenler</h1>
          <p className="mt-0.5 text-[13px] text-text-dim">
            Web sitesinden gelen teklif ve siparişleri inceleyin; onayladığınızda müşteriye e-posta gider
          </p>
        </div>
        <SitedenCekButonu hazir={apiHazir} />
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-orange-soft px-3 py-2 text-[12.5px] text-orange">
          Veritabanı güncellemesi (migration 0010) henüz çalıştırılmamış: {error.message}
        </p>
      )}

      <details className="mb-5 rounded-[14px] border border-border bg-card p-4 shadow-[var(--shadow)]">
        <summary className="cursor-pointer text-[13.5px] font-semibold">Entegrasyon ayarları</summary>
        <div className="mt-3 flex flex-col gap-3 text-[13px]">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-text-dim">Webhook adresi (sitenin Admin → Entegrasyonlar bölümüne girin)</div>
            <code className="mt-1 block break-all rounded-lg bg-bg-elev px-3 py-2 text-[12.5px]">{webhookUrl}</code>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-text-dim">Ek başlık ve olaylar</div>
            <p className="mt-1 text-text-dim">
              Ek başlık: <code>X-Api-Key: &lt;ENTEGRASYON_WEBHOOK_ANAHTARI değeri&gt;</code> · Olaylar:{" "}
              <code>order.created</code>, <code>quote.created</code> (isteğe bağlı <code>order.updated</code>,{" "}
              <code>quote.updated</code>)
            </p>
          </div>
          <ul className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
            {kurulum.map((k) => (
              <li key={k.ad} className="flex items-start gap-2">
                <span className={`mt-0.5 text-[12px] font-bold ${k.hazir ? "text-green" : "text-orange"}`}>
                  {k.hazir ? "✓" : "✗"}
                </span>
                <span>
                  {k.ad}
                  {!k.hazir && <span className="block text-[11.5px] text-text-dim">Vercel ortam değişkeni: {k.env}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </details>

      <div className="mb-3 flex flex-wrap gap-2">
        {TIPLER.map((t) => {
          const bekleyen = t.key === "teklif" ? bekleyenTeklif : t.key === "siparis" ? bekleyenSiparis : bekleyenTeklif + bekleyenSiparis;
          return (
            <Link
              key={t.label}
              href={href(t.key, durum)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium ${
                tip === t.key ? "bg-green text-white" : "border border-border bg-card text-text-dim"
              }`}
            >
              {t.label}
              {bekleyen > 0 && (
                <span
                  className="flex h-[17px] min-w-[17px] items-center justify-center rounded-full px-1 text-[10.5px] font-semibold text-white"
                  style={{ background: tip === t.key ? "rgba(255,255,255,0.25)" : "var(--orange)" }}
                >
                  {bekleyen}
                </span>
              )}
            </Link>
          );
        })}
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        {DURUMLAR.map((d) => (
          <Link
            key={d.label}
            href={href(tip, d.key)}
            className={`rounded-full px-3 py-1 text-[12px] font-medium ${
              durum === d.key ? "bg-text text-bg" : "border border-border bg-card text-text-dim"
            }`}
          >
            {d.label}
          </Link>
        ))}
      </div>

      {kayitlar.length === 0 && !error ? (
        <Panel>
          <p className="text-[13px] text-text-dim">
            {durum === undefined ? "Onay bekleyen kayıt yok." : "Bu filtrede kayıt yok."}
          </p>
        </Panel>
      ) : (
        <div className="flex flex-col gap-4">
          {kayitlar.map((g) => (
            <SiteGelenKarti key={g.id} g={g} />
          ))}
        </div>
      )}
    </div>
  );
}
