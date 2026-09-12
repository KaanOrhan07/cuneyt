"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { AuthState } from "@/lib/actions/auth";

export function AuthForm({
  action,
  mode,
}: {
  action: (prevState: AuthState, formData: FormData) => Promise<AuthState>;
  mode: "login" | "signup";
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-[380px] rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow)]">
        <div className="mb-7 flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-[9px] font-display text-[16px] font-bold text-white"
            style={{ background: "linear-gradient(135deg, var(--green), #1c4f38)" }}
          >
            C
          </div>
          <div>
            <div className="font-display text-[15px] font-semibold">CÜNEYT</div>
            <div className="-mt-0.5 text-[11px] text-text-dim">Sipariş Takip</div>
          </div>
        </div>

        <h1 className="mb-1 font-display text-xl font-semibold">
          {mode === "login" ? "Giriş Yap" : "Hesap Oluştur"}
        </h1>
        <p className="mb-6 text-[13px] text-text-dim">
          {mode === "login"
            ? "Devam etmek için giriş yapın."
            : "Yeni bir hesap oluşturarak başlayın."}
        </p>

        <form action={formAction} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-medium text-text-dim">E-posta</label>
            <input
              name="email"
              type="email"
              required
              className="rounded-[9px] border border-border bg-bg px-3 py-2.5 text-[13.5px] outline-none focus:border-green"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-medium text-text-dim">Şifre</label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="rounded-[9px] border border-border bg-bg px-3 py-2.5 text-[13.5px] outline-none focus:border-green"
            />
          </div>

          {state?.error && (
            <p className="rounded-lg bg-orange-soft px-3 py-2 text-[12.5px] text-orange">
              {state.error}
            </p>
          )}
          {state?.message && (
            <p className="rounded-lg bg-green-soft px-3 py-2 text-[12.5px] text-green">
              {state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-[9px] bg-green px-4 py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Bekleyin..." : mode === "login" ? "Giriş Yap" : "Hesap Oluştur"}
          </button>
        </form>

        <p className="mt-5 text-center text-[12.5px] text-text-dim">
          {mode === "login" ? (
            <>
              Hesabınız yok mu?{" "}
              <Link href="/signup" className="font-medium text-green">
                Kayıt olun
              </Link>
            </>
          ) : (
            <>
              Zaten hesabınız var mı?{" "}
              <Link href="/login" className="font-medium text-green">
                Giriş yapın
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
