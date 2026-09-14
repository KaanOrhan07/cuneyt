export const normalizeKolon = (s: string) => s.trim().toLocaleLowerCase("tr-TR");

export function bulKolon(row: Record<string, unknown>, ...adaylar: string[]) {
  const anahtarlar = Object.keys(row);
  for (const aday of adaylar) {
    const bulunan = anahtarlar.find((k) => normalizeKolon(k) === normalizeKolon(aday));
    if (bulunan) return row[bulunan];
  }
  return undefined;
}

export function evetMi(v: unknown) {
  const s = normalizeKolon(String(v ?? ""));
  return s === "evet" || s === "true" || s === "1" || s === "x" || s === "yes";
}

export function sayiDegeri(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
