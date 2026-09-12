export const TR_TIMEZONE = "Europe/Istanbul";

export function formatTL(value: number) {
  return `₺${value.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
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
