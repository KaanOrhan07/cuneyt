"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/firmalar", label: "Firmalar" },
  { href: "/siparisler", label: "Siparişler" },
  { href: "/urunler", label: "Ürünler / Stok" },
  { href: "/raporlar", label: "Raporlar" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-[240px] flex-col gap-7 border-r border-border bg-bg-elev px-4 py-6">
      <div className="flex items-center gap-2.5 px-2">
        <div
          className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] font-display text-[15px] font-bold text-white"
          style={{ background: "linear-gradient(135deg, var(--green), #1c4f38)" }}
        >
          C
        </div>
        <div>
          <div className="font-display text-[15px] font-semibold">CÜNEYT</div>
          <div className="-mt-0.5 text-[11px] text-text-dim">Sipariş Takip</div>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
                active
                  ? "bg-green text-white"
                  : "text-text-dim hover:bg-border hover:text-text"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <ThemeToggle />
      </div>
    </aside>
  );
}
