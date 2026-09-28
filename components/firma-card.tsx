"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { deleteFirma, updateFirma } from "@/lib/actions/firmalar";
import { Button, Input } from "@/components/ui";
import type { Firma } from "@/lib/types";

export function FirmaCard({ firma }: { firma: Firma }) {
  const [editing, setEditing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (editing) {
    return (
      <div className="rounded-[14px] border border-border bg-bg-elev p-4 shadow-[var(--shadow)]">
        <form
          ref={formRef}
          action={async (formData) => {
            await updateFirma(firma.id, formData);
            setEditing(false);
          }}
          className="flex flex-col gap-2.5"
        >
          <Input name="ad" defaultValue={firma.ad} required placeholder="Firma adı" />
          <div className="flex items-center gap-3">
            <input
              type="color"
              name="renk"
              defaultValue={firma.renk}
              className="h-[34px] w-12 rounded-[9px] border border-border bg-bg p-1"
            />
            <label className="flex items-center gap-1.5 text-[12.5px]">
              <input type="checkbox" name="is_tedarikci" defaultChecked={firma.is_tedarikci} className="h-4 w-4" />
              Tedarikçi
            </label>
            <label className="flex items-center gap-1.5 text-[12.5px]">
              <input type="checkbox" name="is_musteri" defaultChecked={firma.is_musteri} className="h-4 w-4" />
              Müşteri
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit">Kaydet</Button>
            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
              Vazgeç
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-[14px] border border-border bg-card p-4 shadow-[var(--shadow)]">
      <div className="flex items-start justify-between">
        <Link href={`/firmalar/${firma.id}`} className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: firma.renk }} />
          <span className="font-medium">{firma.ad}</span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditing(true)}
            className="text-[11px] font-medium text-green hover:underline"
          >
            Düzenle
          </button>
          <form action={deleteFirma.bind(null, firma.id)}>
            <button className="text-[11px] text-text-dim hover:text-orange">Sil</button>
          </form>
        </div>
      </div>
      <div className="mt-3 flex gap-1.5">
        {firma.is_tedarikci && (
          <span className="rounded-full bg-green-soft px-2 py-0.5 text-[11px] font-medium text-green">
            Tedarikçi
          </span>
        )}
        {firma.is_musteri && (
          <span className="rounded-full bg-orange-soft px-2 py-0.5 text-[11px] font-medium text-[#C74519]">
            Müşteri
          </span>
        )}
      </div>
    </div>
  );
}
