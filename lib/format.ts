export const TR_TIMEZONE = "Europe/Istanbul";

export function formatTL(value: number) {
  return `₺${value.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export const PARA_BIRIMLERI = ["TL", "USD", "EUR", "GBP"] as const;
export type ParaBirimi = (typeof PARA_BIRIMLERI)[number];

export const PARA_BIRIMI_SEMBOL: Record<ParaBirimi, string> = {
  TL: "₺",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export function paraBirimiSembol(paraBirimi: string) {
  return PARA_BIRIMI_SEMBOL[paraBirimi as ParaBirimi] ?? paraBirimi;
}

export function formatParaBirimi(value: number, paraBirimi: string = "TL") {
  const sayi = Math.abs(value).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `${value < 0 ? "-" : ""}${paraBirimiSembol(paraBirimi)}${sayi}`;
}

export function formatTarihSaat(value: string | Date) {
  return new Date(value).toLocaleString("tr-TR", { timeZone: TR_TIMEZONE });
}

export function formatTarih(
  value: string | Date,
  opts: Intl.DateTimeFormatOptions = {},
) {
  return new Date(value).toLocaleDateString("tr-TR", { timeZone: TR_TIMEZONE, ...opts });
}
