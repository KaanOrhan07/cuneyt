import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { kaydetGelen, normalizeGelen, olayTipi } from "@/lib/site-gelenler";

export const runtime = "nodejs";

const MAKS_GOVDE = 1_000_000;
const IMZA_BASLIKLARI = [
  "x-signature",
  "x-signature-256",
  "x-webhook-signature",
  "x-hub-signature-256",
  "x-ck-signature",
  "x-cosmo-signature",
];

function esitMi(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

function yetkiliMi(request: Request, ham: string): boolean | "yapilandirilmamis" {
  const anahtar = process.env.ENTEGRASYON_WEBHOOK_ANAHTARI?.trim();
  const imzaAnahtari = process.env.ENTEGRASYON_IMZA_ANAHTARI?.trim();
  if (!anahtar && !imzaAnahtari) return "yapilandirilmamis";

  if (anahtar) {
    const auth = request.headers.get("authorization");
    const gelen = request.headers.get("x-api-key") ?? (auth?.toLowerCase().startsWith("bearer ") ? auth.slice(7) : null);
    if (gelen && esitMi(gelen.trim(), anahtar)) return true;
  }

  if (imzaAnahtari) {
    const beklenenHex = createHmac("sha256", imzaAnahtari).update(ham).digest("hex");
    const beklenenB64 = createHmac("sha256", imzaAnahtari).update(ham).digest("base64");
    for (const baslik of IMZA_BASLIKLARI) {
      const deger = request.headers.get(baslik);
      if (!deger) continue;
      const temiz = deger.trim().replace(/^(sha256=|v1=)/i, "");
      if (esitMi(temiz.toLowerCase(), beklenenHex) || esitMi(temiz, beklenenB64)) return true;
    }
  }

  return false;
}

/** Anahtarı doğrulanmış her çağrıyı "Kayıtlar"a düşer; böylece yoksayılan/tanınmayan olaylar da görülebilir. */
async function gunluge(olay: string | null, sonuc: string, govde: unknown) {
  try {
    const metin = typeof govde === "string" ? govde : JSON.stringify(govde);
    await createAdminClient()
      .from("islem_kayitlari")
      .insert({
        modul: "entegrasyon",
        islem: "webhook",
        baslik: olay ?? "(olay adı yok)",
        detay: { sonuc, govde: metin.length > 20_000 ? `${metin.slice(0, 20_000)}…` : govde },
      });
  } catch {
    // günlük yazılamasa da webhook yanıtı etkilenmesin
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, servis: "DiTrack entegrasyon" });
}

export async function POST(request: Request) {
  const ham = await request.text();
  if (ham.length > MAKS_GOVDE) {
    return NextResponse.json({ error: "Gövde çok büyük" }, { status: 413 });
  }

  const yetki = yetkiliMi(request, ham);
  if (yetki === "yapilandirilmamis") {
    return NextResponse.json({ error: "Entegrasyon anahtarı tanımlı değil" }, { status: 503 });
  }
  if (!yetki) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const baslikOlayi = request.headers.get("x-cosmo-event") ?? request.headers.get("x-event");

  let govde: unknown;
  try {
    govde = JSON.parse(ham);
  } catch {
    await gunluge(baslikOlayi, "gecersiz-json", ham);
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const govdeOlayi =
    typeof govde === "object" && govde !== null
      ? ((govde as Record<string, unknown>).event ??
        (govde as Record<string, unknown>).type ??
        (govde as Record<string, unknown>).event_type)
      : null;
  const olay = (govdeOlayi ? String(govdeOlayi) : null) ?? baslikOlayi;

  const tip = olayTipi(olay);
  if (!tip) {
    await gunluge(olay, "yoksayildi", govde);
    return NextResponse.json({ ok: true, ignored: true, event: olay });
  }

  const kayit = normalizeGelen(govde, tip, "webhook");
  if (!kayit) {
    await gunluge(olay, "kimlik-yok", govde);
    return NextResponse.json({ error: "Kayıtta kimlik (id/number) alanı bulunamadı" }, { status: 422 });
  }

  try {
    const id = await kaydetGelen(createAdminClient(), kayit);
    await gunluge(olay, "kaydedildi", govde);
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    const mesaj = e instanceof Error ? e.message : "Kaydedilemedi";
    await gunluge(olay, `hata: ${mesaj}`, govde);
    return NextResponse.json({ error: mesaj }, { status: 500 });
  }
}
