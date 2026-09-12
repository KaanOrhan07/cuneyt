export function formatTL(value: number) {
  return `₺${value.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
