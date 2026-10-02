import nodemailer from "nodemailer";
import { formatParaBirimi } from "@/lib/format";
import type { GelenKalem, GelenTip } from "@/lib/types";

export function epostaYapilandirildiMi() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type OnayEpostasi = {
  to: string;
  bcc?: string | null;
  tip: GelenTip;
  no: string | null;
  musteriAd: string | null;
  kalemler: GelenKalem[];
  toplam: number | null;
  paraBirimi: string;
  sirket: { ad: string | null; telefon: string | null; eposta: string | null };
};

export async function onayEpostasiGonder(o: OnayEpostasi) {
  const port = Number(process.env.SMTP_PORT ?? 587);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const baslik = o.tip === "siparis" ? "Siparişiniz" : "Teklif talebiniz";
  const sirketAd = o.sirket.ad || "Firmamız";
  const para = (n: number) => formatParaBirimi(n, o.paraBirimi);
  const selam = o.musteriAd ? `Merhaba ${o.musteriAd},` : "Merhaba,";
  const noMetin = o.no ? ` (${o.no})` : "";

  const kalemMetin = o.kalemler
    .map((k) => `- ${k.ad} × ${k.adet}${k.birim_fiyat !== null ? ` — ${para(k.birim_fiyat)}` : ""}`)
    .join("\n");
  const iletisim = [o.sirket.telefon, o.sirket.eposta].filter(Boolean).join(" · ");

  const text = [
    selam,
    `${baslik}${noMetin} onaylanmıştır. Bizi tercih ettiğiniz için teşekkür ederiz.`,
    kalemMetin,
    o.toplam !== null ? `Toplam: ${para(o.toplam)}` : "",
    iletisim ? `Sorularınız için: ${iletisim}` : "",
    sirketAd,
  ]
    .filter((s) => s !== "")
    .join("\n\n");

  const satirlar = o.kalemler
    .map(
      (k) =>
        `<tr><td style="padding:6px 12px 6px 0">${esc(k.ad)}</td><td style="padding:6px 12px;text-align:right">${k.adet}</td><td style="padding:6px 0 6px 12px;text-align:right">${
          k.birim_fiyat !== null ? esc(para(k.birim_fiyat)) : ""
        }</td></tr>`,
    )
    .join("");

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1b1c18;max-width:560px">
<p>${esc(selam)}</p>
<p><strong>${esc(baslik)}${esc(noMetin)}</strong> onaylanmıştır. Bizi tercih ettiğiniz için teşekkür ederiz.</p>
${
  satirlar
    ? `<table style="border-collapse:collapse;width:100%;margin:16px 0"><thead><tr style="color:#6e6e73;font-size:12px"><th style="text-align:left;padding:6px 12px 6px 0">Ürün</th><th style="text-align:right;padding:6px 12px">Adet</th><th style="text-align:right;padding:6px 0 6px 12px">Birim fiyat</th></tr></thead><tbody>${satirlar}</tbody></table>`
    : ""
}
${o.toplam !== null ? `<p><strong>Toplam: ${esc(para(o.toplam))}</strong></p>` : ""}
${iletisim ? `<p style="color:#6e6e73">Sorularınız için: ${esc(iletisim)}</p>` : ""}
<p>${esc(sirketAd)}</p>
</div>`;

  const gonderen = process.env.SMTP_FROM || process.env.SMTP_USER!;
  await transporter.sendMail({
    from: gonderen.includes("<") || !o.sirket.ad ? gonderen : { name: o.sirket.ad, address: gonderen },
    to: o.to,
    bcc: o.bcc || undefined,
    replyTo: o.sirket.eposta || undefined,
    subject: `${baslik} onaylandı${noMetin}`,
    text,
    html,
  });
}
