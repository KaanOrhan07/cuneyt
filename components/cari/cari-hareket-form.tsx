"use client";

import { useRef, useState } from "react";
import { addCariHareket } from "@/lib/actions/cari";
import { Button, Input, Label, Select } from "@/components/ui";
import { PARA_BIRIMLERI, paraBirimiSembol } from "@/lib/format";

export function CariHareketForm({
  firmaId,
  firmalar,
}: {
  firmaId?: string;
  firmalar?: { id: string; ad: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [paraBirimi, setParaBirimi] = useState("TL");
  const [hata, setHata] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div>
      <Button onClick={() => setOpen((v) => !v)}>{open ? "Kapat" : "+ Cari Kaydı Ekle"}</Button>

      {open && (
        <form
          ref={formRef}
          action={async (formData) => {
            setHata(null);
            try {
              await addCariHareket(formData);
              formRef.current?.reset();
              setOpen(false);
            } catch (e) {
              setHata(e instanceof Error ? e.message : "Kaydedilemedi.");
            }
          }}
          className="mt-4 flex flex-wrap items-end gap-3 rounded-[14px] border border-border bg-card p-4"
        >
          {firmaId ? (
            <input type="hidden" name="firma_id" value={firmaId} />
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label>Firma</Label>
              <Select name="firma_id" required defaultValue="" className="w-48">
                <option value="" disabled>
                  Firma seçin
                </option>
                {firmalar?.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.ad}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>Yön</Label>
            <Select name="yon" defaultValue="alacak" className="w-52">
              <option value="alacak">Alacak (firma bize borçlu)</option>
              <option value="verecek">Verecek (biz firmaya borçluyuz)</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Tarih</Label>
            <Input type="date" name="tarih" required className="w-40" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Fatura No</Label>
            <Input name="fatura_no" className="w-32" />
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
          <div className="flex flex-col gap-1.5">
            <Label>Vade Tarihi</Label>
            <Input type="date" name="vade_tarihi" className="w-40" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Açıklama</Label>
            <Input name="aciklama" className="w-48" />
          </div>
          <Button type="submit">Kaydet</Button>
          {hata && <p className="w-full rounded-lg bg-orange-soft px-3 py-2 text-[12.5px] text-orange">{hata}</p>}
        </form>
      )}
    </div>
  );
}
