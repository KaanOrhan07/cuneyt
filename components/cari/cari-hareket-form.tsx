"use client";

import { useRef, useState } from "react";
import { addCariHareket } from "@/lib/actions/cari";
import { Button, Input, Label } from "@/components/ui";

export function CariHareketForm({ firmaId }: { firmaId: string }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div>
      <Button onClick={() => setOpen((v) => !v)}>{open ? "Kapat" : "+ Borç Kaydı Ekle"}</Button>

      {open && (
        <form
          ref={formRef}
          action={async (formData) => {
            await addCariHareket(formData);
            formRef.current?.reset();
            setOpen(false);
          }}
          className="mt-4 flex flex-wrap items-end gap-3 rounded-[14px] border border-border bg-card p-4"
        >
          <input type="hidden" name="firma_id" value={firmaId} />
          <div className="flex flex-col gap-1.5">
            <Label>Tarih</Label>
            <Input type="date" name="tarih" required className="w-40" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Fatura No</Label>
            <Input name="fatura_no" className="w-32" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Tutar (₺)</Label>
            <Input type="number" step="0.01" name="tutar" required className="w-28" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Vade Tarihi</Label>
            <Input type="date" name="vade_tarihi" className="w-40" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Açıklama</Label>
            <Input name="aciklama" className="w-48" />
          </div>
          <Button type="submit">Kaydet</Button>
        </form>
      )}
    </div>
  );
}
