"use client";

import { useRef, useState } from "react";
import { addGider } from "@/lib/actions/giderler";
import { Button, Input, Label, Select } from "@/components/ui";
import { PARA_BIRIMLERI, paraBirimiSembol } from "@/lib/format";

const KATEGORILER = ["Kira", "Maaş", "Fatura", "Vergi", "Ulaşım", "Yemek", "Ofis", "Pazarlama", "Diğer"];

export function GiderForm() {
  const [open, setOpen] = useState(false);
  const [paraBirimi, setParaBirimi] = useState("TL");
  const [hata, setHata] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div>
      <Button variant="secondary" onClick={() => setOpen((v) => !v)}>
        {open ? "Kapat" : "+ Gider Ekle"}
      </Button>

      {open && (
        <form
          ref={formRef}
          action={async (formData) => {
            setHata(null);
            try {
              await addGider(formData);
              formRef.current?.reset();
              setOpen(false);
            } catch (e) {
              setHata(e instanceof Error ? e.message : "Kaydedilemedi.");
            }
          }}
          className="mt-4 flex flex-wrap items-end gap-3 rounded-[14px] border border-border bg-card p-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label>Tarih</Label>
            <Input type="date" name="tarih" required className="w-40" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Kategori</Label>
            <Input name="kategori" list="gider-kategorileri" placeholder="Örn. Kira" className="w-36" />
            <datalist id="gider-kategorileri">
              {KATEGORILER.map((k) => (
                <option key={k} value={k} />
              ))}
            </datalist>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Açıklama</Label>
            <Input name="aciklama" required className="w-56" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Tutar ({paraBirimiSembol(paraBirimi)})</Label>
            <Input type="number" step="0.01" name="tutar" required className="w-28" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Para Birimi</Label>
            <Select name="para_birimi" value={paraBirimi} onChange={(e) => setParaBirimi(e.target.value)}>
              {PARA_BIRIMLERI.map((pb) => (
                <option key={pb} value={pb}>
                  {pb}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit">Kaydet</Button>
          {hata && <p className="w-full rounded-lg bg-orange-soft px-3 py-2 text-[12.5px] text-orange">{hata}</p>}
        </form>
      )}
    </div>
  );
}
