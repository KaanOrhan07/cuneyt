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

  let govde: unknown;
  try {
    govde = JSON.parse(ham);
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const olay =
    typeof govde === "object" && govde !== null
      ? String(
          (govde as Record<string, unknown>).event ??
            (govde as Record<string, unknown>).type ??
            (govde as Record<string, unknown>).event_type ??
            request.headers.get("x-event") ??
            "",
        ) || null
      : null;

  const tip = olayTipi(olay);
  if (!tip) {
    return NextResponse.json({ ok: true, ignored: true, event: olay });
  }

  const kayit = normalizeGelen(govde, tip, "webhook");
  if (!kayit) {
    return NextResponse.json({ error: "Kayıtta kimlik (id/number) alanı bulunamadı" }, { status: 422 });
  }

  try {
    const id = await kaydetGelen(createAdminClient(), kayit);
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Kaydedilemedi" }, { status: 500 });
  }
}
