"use client";

import { useRef, useState } from "react";
import { addUrun } from "@/lib/actions/urunler";
import { Button, Input, Label } from "@/components/ui";

export function UrunForm() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div>
      <Button onClick={() => setOpen((v) => !v)}>{open ? "Kapat" : "+ Ürün Ekle"}</Button>

      {open && (
        <form
          ref={formRef}
          action={async (formData) => {
            await addUrun(formData);
            formRef.current?.reset();
            setOpen(false);
          }}
          className="mt-4 flex flex-wrap items-end gap-3 rounded-[14px] border border-border bg-card p-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label>Ürün Adı</Label>
            <Input name="ad" required className="w-48" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Başlangıç Stok</Label>
            <Input name="stok_adet" type="number" step="1" defaultValue={0} className="w-28" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Maliyet (₺)</Label>
            <Input name="ortalama_maliyet" type="number" step="0.01" defaultValue={0} className="w-28" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Satış Fiyatı (₺)</Label>
            <Input name="satis_fiyati" type="number" step="0.01" defaultValue={0} className="w-28" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Kritik Stok Eşiği</Label>
            <Input name="kritik_stok_esigi" type="number" step="1" defaultValue={0} className="w-28" />
          </div>
          <Button type="submit">Kaydet</Button>
        </form>
      )}
    </div>
  );
}
