"use client";

import { useActionState, useState } from "react";
import { createTeklif, type TeklifState } from "@/lib/actions/teklifler";
import { Button, Input, Label, Select, Textarea } from "@/components/ui";
import { formatParaBirimi, PARA_BIRIMLERI, paraBirimiSembol } from "@/lib/format";
import type { Firma, Urun } from "@/lib/types";

type Row = { urun_id: string; adet: string; birim_fiyat: string };

export function TeklifOlusturForm({
  firmalar,
  urunler,
  varsayilanFirmaId,
  varsayilanSatici,
  varsayilanNotlar,
  sirketSablonVarMi,
}: {
  firmalar: Firma[];
  urunler: Urun[];
  varsayilanFirmaId?: string;
  varsayilanSatici?: string;
  varsayilanNotlar?: string;
  sirketSablonVarMi?: boolean;
}) {
  const [state, formAction, pending] = useActionState<TeklifState, FormData>(
    createTeklif,
    undefined,
  );
  const [tip, setTip] = useState<"alis" | "satis">("satis");
  const [rows, setRows] = useState<Row[]>([{ urun_id: "", adet: "", birim_fiyat: "" }]);
  const [iskonto, setIskonto] = useState("0");
  const [kdvOrani, setKdvOrani] = useState("20");
  const [paraBirimi, setParaBirimi] = useState("TL");

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  const araToplam = rows.reduce((s, r) => s + (Number(r.adet) || 0) * (Number(r.birim_fiyat) || 0), 0);
  const kdvTutari = araToplam * ((Number(kdvOrani) || 0) / 100);
  const genelToplam = araToplam + kdvTutari - (Number(iskonto) || 0);

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
          <Select name="firma_id" required defaultValue={varsayilanFirmaId ?? ""}>
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
            <option value="satis">Satış (verilen teklif)</option>
            <option value="alis">Alış (alınan teklif)</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Para Birimi</Label>
          <Select name="para_birimi" value={paraBirimi} onChange={(e) => setParaBirimi(e.target.value)}>
            {PARA_BIRIMLERI.map((pb) => (
              <option key={pb} value={pb}>
                {pb} ({paraBirimiSembol(pb)})
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label>Satıcı</Label>
          <Input name="satici" defaultValue={varsayilanSatici ?? ""} placeholder="Örn. Cüneyt Gökmen" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Termin</Label>
          <Input name="termin" placeholder="Örn. 2 hafta" className="w-32" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Nakliye</Label>
          <Input name="nakliye" placeholder="Örn. UPS" className="w-28" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Teslimat</Label>
          <Input name="teslimat_sekli" placeholder="Örn. Kapıda" className="w-28" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Ödeme Şartları</Label>
        <Input name="odeme_sartlari" placeholder="Örn. Teslimatta ödeme" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Müşteriye Mesaj (opsiyonel)</Label>
        <Textarea
          name="mesaj"
          rows={2}
          placeholder="Örn. Firmamıza göstermiş olduğunuz ilgi için teşekkür ederiz."
        />
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

      <div className="flex gap-4">
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
        <div className="flex flex-col gap-1.5">
          <Label>İskonto ({paraBirimiSembol(paraBirimi)})</Label>
          <Input
            type="number"
            step="0.01"
            name="iskonto"
            value={iskonto}
            onChange={(e) => setIskonto(e.target.value)}
            className="w-32"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Alt Not (opsiyonel)</Label>
        <Textarea
          name="notlar"
          rows={2}
          defaultValue={varsayilanNotlar ?? ""}
          placeholder="Örn. Sipariş üzerine üretilen ürünler iptal edilemez."
        />
      </div>

      <div className="flex flex-col items-end gap-1 rounded-[10px] border border-border bg-bg-elev px-4 py-3 text-[13px]">
        <div className="flex w-48 justify-between text-text-dim">
          <span>Ara Toplam</span>
          <span className="font-mono">{formatParaBirimi(araToplam, paraBirimi)}</span>
        </div>
        <div className="flex w-48 justify-between text-text-dim">
          <span>KDV (%{kdvOrani || 0})</span>
          <span className="font-mono">{formatParaBirimi(kdvTutari, paraBirimi)}</span>
        </div>
        {Number(iskonto) > 0 && (
          <div className="flex w-48 justify-between text-text-dim">
            <span>İskonto</span>
            <span className="font-mono">-{formatParaBirimi(Number(iskonto), paraBirimi)}</span>
          </div>
        )}
        <div className="flex w-48 justify-between border-t border-border pt-1 font-semibold">
          <span>Genel Toplam</span>
          <span className="font-mono">{formatParaBirimi(genelToplam, paraBirimi)}</span>
        </div>
      </div>

      {sirketSablonVarMi && (
        <label className="flex items-center gap-2 text-[13px]">
          <input type="checkbox" name="sablon_kullan" defaultChecked className="h-4 w-4" />
          Şirket şablonunuzu bu teklifte kullan (kapatırsanız DiTrack&apos;in kendi tasarımı kullanılır)
        </label>
      )}

      {state?.error && (
        <p className="rounded-lg bg-orange-soft px-3 py-2 text-[12.5px] text-orange">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Kaydediliyor..." : "Teklifi Kaydet"}
      </Button>
    </form>
  );
}
