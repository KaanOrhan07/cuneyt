"use client";

export const XL_TH =
  "sticky top-0 z-10 whitespace-nowrap border border-border bg-bg-elev px-2 py-1.5 text-left";
export const XL_TD = "border border-border p-0 text-[12.5px] align-middle";
export const XL_ROW_NUM =
  "w-10 border border-border bg-bg-elev px-2 py-1 text-center text-[11px] text-text-dim";

export type SortDir = "asc" | "desc";

export function SortableHeader({
  label,
  active,
  direction,
  onClick,
  align = "left",
}: {
  label: string;
  active: boolean;
  direction: SortDir;
  onClick: () => void;
  align?: "left" | "right";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-text-dim hover:text-text ${
        align === "right" ? "flex-row-reverse" : ""
      }`}
    >
      {label}
      <span className={`text-[9px] ${active ? "opacity-100" : "opacity-0"}`}>
        {direction === "asc" ? "▲" : "▼"}
      </span>
    </button>
  );
}

export function sortRows<T>(
  rows: T[],
  key: keyof T | null,
  direction: SortDir,
): T[] {
  if (!key) return rows;
  const sorted = [...rows].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (typeof av === "number" && typeof bv === "number") return av - bv;
    return String(av).localeCompare(String(bv), "tr");
  });
  return direction === "asc" ? sorted : sorted.reverse();
}

export function BulkBar({
  count,
  onClear,
  children,
}: {
  count: number;
  onClear: () => void;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <div className="mb-2 flex items-center gap-3 rounded-[10px] border border-green bg-green-soft px-3 py-2 text-[12.5px]">
      <span className="font-medium text-green">{count} satır seçildi</span>
      <div className="flex items-center gap-2">{children}</div>
      <button onClick={onClear} className="ml-auto text-text-dim hover:text-text">
        Seçimi temizle
      </button>
    </div>
  );
}
