"use client";

import { useRef, useState } from "react";
import { deleteUrun, updateUrun } from "@/lib/actions/urunler";
import { Button, Input } from "@/components/ui";
import { formatTL } from "@/lib/format";
import type { Urun } from "@/lib/types";

export function UrunRow({ urun }: { urun: Urun }) {
  const [editing, setEditing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const kritikMi = urun.stok_adet <= urun.kritik_stok_esigi;

  if (editing) {
    return (
      <tr className="border-b border-border last:border-0 bg-bg-elev">
        <td colSpan={6} className="py-3">
          <form
            ref={formRef}
            action={async (formData) => {
              await updateUrun(urun.id, formData);
              setEditing(false);
            }}
            className="flex flex-wrap items-end gap-2.5"
          >
            <Input name="ad" defaultValue={urun.ad} required className="w-40" placeholder="Ürün adı" />
            <Input
              name="fotograf_url"
              type="url"
              defaultValue={urun.fotograf_url ?? ""}
              className="w-48"
              placeholder="Fotoğraf URL"
            />
            <Input
              name="stok_adet"
              type="number"
              defaultValue={urun.stok_adet}
              className="w-24"
              placeholder="Stok"
            />
            <Input
              name="ortalama_maliyet"
              type="number"
              step="0.01"
              defaultValue={urun.ortalama_maliyet}
              className="w-24"
              placeholder="Maliyet"
            />
            <Input
              name="satis_fiyati"
              type="number"
              step="0.01"
              defaultValue={urun.satis_fiyati}
              className="w-24"
              placeholder="Satış fiyatı"
            />
            <Input
              name="kritik_stok_esigi"
              type="number"
              defaultValue={urun.kritik_stok_esigi}
              className="w-24"
              placeholder="Kritik eşik"
            />
            <Button type="submit">Kaydet</Button>
            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
              Vazgeç
            </Button>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-2.5 font-medium">
        <div className="flex items-center gap-2.5">
          {urun.fotograf_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={urun.fotograf_url}
              alt={urun.ad}
              className="h-8 w-8 rounded-md border border-border object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded-md border border-border bg-bg-elev" />
          )}
          {urun.ad}
        </div>
      </td>
      <td className={`py-2.5 font-mono ${kritikMi ? "font-semibold text-orange" : ""}`}>
        {urun.stok_adet}
      </td>
      <td className="py-2.5 font-mono">{formatTL(urun.ortalama_maliyet)}</td>
      <td className="py-2.5 font-mono">{formatTL(urun.satis_fiyati)}</td>
      <td className="py-2.5 font-mono text-text-dim">{urun.kritik_stok_esigi}</td>
      <td className="py-2.5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditing(true)}
            className="text-[11px] font-medium text-green hover:underline"
          >
            Düzenle
          </button>
          <form action={deleteUrun.bind(null, urun.id)}>
            <button className="text-[11px] text-text-dim hover:text-orange">Sil</button>
          </form>
        </div>
      </td>
    </tr>
  );
}
