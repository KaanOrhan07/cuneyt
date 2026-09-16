"use client";

import { useActionState, useState, useTransition } from "react";
import { ekipUyesiEkle, ekipUyesiSil, type EkipState } from "@/lib/actions/ekip";
import { Button, Input, Label, Panel } from "@/components/ui";
import { formatTarih } from "@/lib/format";
import type { EkipUyesi } from "@/lib/types";

export function EkipPanel({ ekip, mevcutKullaniciId }: { ekip: EkipUyesi[]; mevcutKullaniciId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<EkipState, FormData>(ekipUyesiEkle, undefined);
  const [siliniyorId, startSilTransition] = useTransition();
  const [silHata, setSilHata] = useState<string | null>(null);

  return (
    <Panel
      title="Ekip"
      action={
        <Button variant="secondary" onClick={() => setOpen((v) => !v)}>
          {open ? "Kapat" : "+ Ekip Üyesi Ekle"}
        </Button>
      }
    >
      <p className="mb-4 text-[12.5px] text-text-dim">
        Çalışma arkadaşlarınız için hesap oluşturun; onlar da aynı panele kendi giriş bilgileriyle erişip
        sipariş/teklif girebilir, siz de kimin ne eklediğini takip edebilirsiniz.
      </p>

      {open && (
        <form
          action={formAction}
          className="mb-5 flex flex-wrap items-end gap-3 rounded-[10px] border border-border bg-bg-elev p-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label>Ad Soyad</Label>
            <Input name="ad_soyad" required className="w-48" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>E-posta</Label>
            <Input name="eposta" type="email" required className="w-56" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Şifre</Label>
            <Input name="sifre" type="text" required minLength={6} className="w-40" />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Ekleniyor..." : "Ekle"}
          </Button>
          {state?.error && (
            <p className="w-full rounded-lg bg-orange-soft px-3 py-2 text-[12.5px] text-orange">
              {state.error}
            </p>
          )}
        </form>
      )}

      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-dim">
            <th className="pb-2.5 text-left font-semibold">Ad Soyad</th>
            <th className="pb-2.5 text-left font-semibold">E-posta</th>
            <th className="pb-2.5 text-left font-semibold">Eklenme Tarihi</th>
            <th className="pb-2.5 text-left font-semibold" />
          </tr>
        </thead>
        <tbody>
          {ekip.map((e) => (
            <tr key={e.id} className="border-b border-border last:border-0">
              <td className="py-2.5 font-medium">{e.ad_soyad}</td>
              <td className="py-2.5 text-text-dim">{e.eposta}</td>
              <td className="py-2.5 font-mono text-text-dim">{formatTarih(e.created_at)}</td>
              <td className="py-2.5">
                {e.auth_user_id !== mevcutKullaniciId && (
                  <button
                    disabled={siliniyorId}
                    onClick={() => {
                      if (!confirm(`${e.ad_soyad} hesabını silmek istediğinize emin misiniz?`)) return;
                      setSilHata(null);
                      startSilTransition(async () => {
                        try {
                          await ekipUyesiSil(e.id, e.auth_user_id);
                        } catch (err) {
                          setSilHata(err instanceof Error ? err.message : "Silinemedi.");
                        }
                      });
                    }}
                    className="text-[11px] font-medium text-orange hover:underline disabled:opacity-50"
                  >
                    Sil
                  </button>
                )}
              </td>
            </tr>
          ))}
          {ekip.length === 0 && (
            <tr>
              <td colSpan={4} className="py-4 text-text-dim">
                Henüz ekip üyesi eklenmedi.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {silHata && <p className="mt-3 rounded-lg bg-orange-soft px-3 py-2 text-[12.5px] text-orange">{silHata}</p>}
    </Panel>
  );
}
