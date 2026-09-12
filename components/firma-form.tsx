"use client";

import { useRef, useState } from "react";
import { addFirma } from "@/lib/actions/firmalar";
import { Button, Input, Label } from "@/components/ui";

export function FirmaForm() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div>
      <Button onClick={() => setOpen((v) => !v)}>{open ? "Kapat" : "+ Firma Ekle"}</Button>

      {open && (
        <form
          ref={formRef}
          action={async (formData) => {
            await addFirma(formData);
            formRef.current?.reset();
            setOpen(false);
          }}
          className="mt-4 flex flex-wrap items-end gap-3 rounded-[14px] border border-border bg-card p-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label>Firma Adı</Label>
            <Input name="ad" required className="w-56" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Renk</Label>
            <input
              type="color"
              name="renk"
              defaultValue="#28694B"
              className="h-[38px] w-14 rounded-[9px] border border-border bg-bg p-1"
            />
          </div>
          <label className="flex items-center gap-2 pb-2.5 text-[13px]">
            <input type="checkbox" name="is_tedarikci" className="h-4 w-4" />
            Tedarikçi
          </label>
          <label className="flex items-center gap-2 pb-2.5 text-[13px]">
            <input type="checkbox" name="is_musteri" className="h-4 w-4" />
            Müşteri
          </label>
          <Button type="submit">Kaydet</Button>
        </form>
      )}
    </div>
  );
}
