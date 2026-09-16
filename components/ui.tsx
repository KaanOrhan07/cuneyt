import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  ButtonHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { DURUM_LABEL, type SiparisDurum } from "@/lib/types";

export function Panel({
  title,
  action,
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[14px] border border-border bg-card p-5 shadow-[var(--shadow)]">
      {title && (
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[14.5px] font-semibold">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`rounded-[9px] border border-border bg-bg px-3 py-2 text-[13.5px] outline-none focus:border-green ${props.className ?? ""}`}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`rounded-[9px] border border-border bg-bg px-3 py-2 text-[13.5px] outline-none focus:border-green ${props.className ?? ""}`}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`rounded-[9px] border border-border bg-bg px-3 py-2 text-[13.5px] outline-none focus:border-green ${props.className ?? ""}`}
    />
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[12.5px] font-medium text-text-dim">{children}</label>;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  const styles = {
    primary: "bg-green text-white",
    secondary: "border border-border bg-card text-text",
    ghost: "text-text-dim hover:text-text",
  }[variant];

  return (
    <button
      {...props}
      className={`flex items-center gap-1.5 rounded-[9px] px-4 py-2 text-[13.5px] font-semibold disabled:opacity-60 ${styles} ${className}`}
    />
  );
}

export function Badge({ tip }: { tip: "alis" | "satis" }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        tip === "alis"
          ? "bg-green-soft text-green"
          : "bg-orange-soft text-[#C74519]"
      }`}
    >
      {tip === "alis" ? "Alış" : "Satış"}
    </span>
  );
}

export function StatusDot({ durum }: { durum: SiparisDurum }) {
  const color =
    durum === "teslim_edildi"
      ? "var(--green)"
      : durum === "yolda"
        ? "var(--orange)"
        : durum === "iptal_edildi"
          ? "#C0392B"
          : "var(--gray)";
  return (
    <span
      className={`flex items-center gap-1.5 text-[11px] font-medium ${
        durum === "iptal_edildi" ? "text-[#C0392B] line-through" : "text-text-dim"
      }`}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
      {DURUM_LABEL[durum]}
    </span>
  );
}

export function StatCard({
  label,
  value,
  delta,
  deltaTone,
  valueColor,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  delta?: React.ReactNode;
  deltaTone?: "up" | "down" | "neutral";
  valueColor?: string;
}) {
  const deltaColor =
    deltaTone === "up" ? "text-green" : deltaTone === "down" ? "text-orange" : "text-text-dim";
  return (
    <div className="rounded-[14px] border border-border bg-card p-[18px] shadow-[var(--shadow)]">
      <div className="mb-2.5 flex items-center justify-between text-[12px] font-medium text-text-dim">
        {label}
      </div>
      <div className="font-display text-[26px] font-semibold" style={{ color: valueColor }}>
        {value}
      </div>
      {delta && <div className={`mt-1.5 text-[11.5px] font-medium ${deltaColor}`}>{delta}</div>}
    </div>
  );
}
