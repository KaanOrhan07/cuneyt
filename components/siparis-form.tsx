"use client";

import { useActionState, useMemo, useState } from "react";
import { createSiparis, type SiparisState } from "@/lib/actions/siparisler";
import { Button, Input, Label, Select } from "@/components/ui";
import { formatTL } from "@/lib/format";
import type { Firma, Urun } from "@/lib/types";

type Row = { urun_id: string; adet: string; birim_fiyat: string };

export function SiparisForm({ firmalar, urunler }: { firmalar: Firma[]; urunler: Urun[] }) {
  const [state, formAction, pending] = useActionState<SiparisState, FormData>(
    createSiparis,
    undefined,
  );
  const [tip, setTip] = useState<"alis" | "satis">("alis");
  const [rows, setRows] = useState<Row[]>([{ urun_id: "", adet: "", birim_fiyat: "" }]);

  const urunMap = useMemo(() => new Map(urunler.map((u) => [u.id, u])), [urunler]);

  const stokUyarilari = rows
    .filter((r) => tip === "satis" && r.urun_id && r.adet)
    .map((r) => {
      const urun = urunMap.get(r.urun_id);
      if (!urun) return null;
      const adet = Number(r.adet);
      if (adet > urun.stok_adet) {
        return `${urun.ad}: stokta ${urun.stok_adet} adet var, ${adet} adet giriliyor.`;
      }
      return null;
    })
    .filter(Boolean) as string[];

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  const [kdvOrani, setKdvOrani] = useState("20");
  const araToplam = rows.reduce((s, r) => s + (Number(r.adet) || 0) * (Number(r.birim_fiyat) || 0), 0);
  const kdvTutari = araToplam * ((Number(kdvOrani) || 0) / 100);
  const genelToplam = araToplam + kdvTutari;

  return (
    <form
      action={(formData) => {
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
        return formAction(formData);
      }}
      className="flex max-w-2xl flex-col gap-4"
    >
      <div className="flex gap-4">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label>Firma</Label>
          <Select name="firma_id" required defaultValue="">
            <option value="" disabled>
              Firma seçin
            </option>
            {firmalar.map((f) => (
              <option key={f.id} value={f.id}>
                {f.ad}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Tip</Label>
          <Select name="tip" value={tip} onChange={(e) => setTip(e.target.value as "alis" | "satis")}>
            <option value="alis">Alış (gelen)</option>
            <option value="satis">Satış (giden)</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Durum</Label>
          <Select name="durum" defaultValue="beklemede">
            <option value="beklemede">Beklemede</option>
            <option value="yolda">Yolda</option>
            <option value="teslim_edildi">Teslim edildi</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Son Teslim Tarihi (opsiyonel)</Label>
          <Input type="date" name="son_teslim_tarihi" />
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Sipariş No</Label>
          <Input name="siparis_no" placeholder="Örn. SP-2026-001" className="w-48" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>KDV Oranı (%)</Label>
          <Input
            type="number"
            name="kdv_orani"
            value={kdvOrani}
            onChange={(e) => setKdvOrani(e.target.value)}
            className="w-28"
          />
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
                  {u.ad} (stok: {u.stok_adet})
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

      <div className="flex flex-col items-end gap-1 rounded-[10px] border border-border bg-bg-elev px-4 py-3 text-[13px]">
        <div className="flex w-48 justify-between text-text-dim">
          <span>Ara Toplam</span>
          <span className="font-mono">{formatTL(araToplam)}</span>
        </div>
        <div className="flex w-48 justify-between text-text-dim">
          <span>KDV (%{kdvOrani || 0})</span>
          <span className="font-mono">{formatTL(kdvTutari)}</span>
        </div>
        <div className="flex w-48 justify-between border-t border-border pt-1 font-semibold">
          <span>Genel Toplam</span>
          <span className="font-mono">{formatTL(genelToplam)}</span>
        </div>
      </div>

      {stokUyarilari.length > 0 && (
        <div className="rounded-lg bg-orange-soft px-3 py-2 text-[12.5px] text-[#C74519]">
          {stokUyarilari.map((msg) => (
            <div key={msg}>⚠ {msg}</div>
          ))}
        </div>
      )}

      {state?.error && (
        <p className="rounded-lg bg-orange-soft px-3 py-2 text-[12.5px] text-orange">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Kaydediliyor..." : "Siparişi Kaydet"}
      </Button>
    </form>
  );
}
