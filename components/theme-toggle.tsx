"use client";

import { useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark",
  );

  function toggle() {
    const next = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("cuneyt-theme", next);
    setIsDark(!isDark);
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center justify-between gap-3 rounded-[10px] border border-border bg-card px-2.5 py-2 text-[12.5px] text-text-dim"
    >
      <span suppressHydrationWarning>{isDark ? "Koyu Mod" : "Açık Mod"}</span>
      <span className="relative h-4 w-[30px] rounded-full bg-border">
        <span
          suppressHydrationWarning
          className="absolute top-0.5 h-3 w-3 rounded-full transition-[left]"
          style={{
            left: isDark ? "16px" : "2px",
            background: isDark ? "var(--orange)" : "var(--green)",
          }}
        />
      </span>
    </button>
  );
}
