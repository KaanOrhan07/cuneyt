"use client";

import { useActionState, useState } from "react";
import { createTeklif, type TeklifState } from "@/lib/actions/teklifler";
import { Button, Input, Label, Select } from "@/components/ui";
import type { Urun } from "@/lib/types";

type Row = { urun_id: string; adet: string; birim_fiyat: string };

export function TeklifForm({ firmaId, urunler }: { firmaId: string; urunler: Urun[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<TeklifState, FormData>(
    createTeklif,
    undefined,
  );
  const [tip, setTip] = useState<"alis" | "satis">("satis");
  const [rows, setRows] = useState<Row[]>([{ urun_id: "", adet: "", birim_fiyat: "" }]);

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  return (
    <div>
      <Button onClick={() => setOpen((v) => !v)}>{open ? "Kapat" : "+ Yeni Teklif"}</Button>

      {open && (
        <form
          action={(formData) => {
            formData.set("firma_id", firmaId);
            formData.set(
              "kalemler",
              JSON.stringify(
                rows
                  .filter((r) => r.urun_id && r.adet && r.birim_fiyat)
                  .map((r) => ({
                    urun_id: r.urun_id,
                    adet: Number(r.adet),
                    birim_fiyat: Number(r.birim_fiyat),
                  })),
              ),
            );
            formAction(formData);
            if (!state?.error) {
              setRows([{ urun_id: "", adet: "", birim_fiyat: "" }]);
            }
          }}
          className="mt-4 flex flex-col gap-3 rounded-[14px] border border-border bg-card p-4"
        >
          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Tip</Label>
              <Select value={tip} onChange={(e) => setTip(e.target.value as "alis" | "satis")}>
                <option value="satis">Satış (verilen teklif)</option>
                <option value="alis">Alış (alınan teklif)</option>
              </Select>
              <input type="hidden" name="tip" value={tip} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Ürünler</Label>
            {rows.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <Select
                  value={row.urun_id}
                  onChange={(e) => updateRow(i, { urun_id: e.target.value })}
                  className="flex-1"
                >
                  <option value="">Ürün seçin</option>
                  {urunler.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.ad}
                    </option>
                  ))}
                </Select>
                <Input
                  type="number"
                  placeholder="Adet"
                  value={row.adet}
                  onChange={(e) => updateRow(i, { adet: e.target.value })}
                  className="w-24"
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Birim fiyat"
                  value={row.birim_fiyat}
                  onChange={(e) => updateRow(i, { birim_fiyat: e.target.value })}
                  className="w-32"
                />
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))}
                    className="text-[12px] text-text-dim hover:text-orange"
                  >
                    Kaldır
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setRows((rs) => [...rs, { urun_id: "", adet: "", birim_fiyat: "" }])}
              className="self-start text-[12.5px] font-medium text-green"
            >
              + Ürün satırı ekle
            </button>
          </div>

          {state?.error && (
            <p className="rounded-lg bg-orange-soft px-3 py-2 text-[12.5px] text-orange">
              {state.error}
            </p>
          )}

          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Kaydediliyor..." : "Teklifi Kaydet"}
          </Button>
        </form>
      )}
    </div>
  );
}
