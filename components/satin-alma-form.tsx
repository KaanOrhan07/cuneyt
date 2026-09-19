"use client";

import { useActionState, useState } from "react";
import { createSatinAlma, type SatinAlmaState } from "@/lib/actions/satin-alma";
import { Button, Input, Label, Select, Textarea } from "@/components/ui";
import { formatParaBirimi, PARA_BIRIMLERI, paraBirimiSembol } from "@/lib/format";
import type { Firma } from "@/lib/types";

type Satir = { adet: string; aciklama: string; termin: string; birim_fiyat: string };
const BOS_SATIR: Satir = { adet: "", aciklama: "", termin: "", birim_fiyat: "" };

export function SatinAlmaForm({
  firmalar,
  varsayilanFirmaId,
  varsayilanTarih,
  onerilenPoNo,
  varsayilanIletisim,
}: {
  firmalar: Firma[];
  varsayilanFirmaId?: string;
  varsayilanTarih: string;
  onerilenPoNo: string;
  varsayilanIletisim: string;
}) {
  const [state, formAction, pending] = useActionState<SatinAlmaState, FormData>(
    createSatinAlma,
    undefined,
  );
  const [satirlar, setSatirlar] = useState<Satir[]>([{ ...BOS_SATIR }]);
  const [paraBirimi, setParaBirimi] = useState("EUR");
  const [kdvOrani, setKdvOrani] = useState("0");
  const [kargoBedeli, setKargoBedeli] = useState("0");

  function guncelle(i: number, patch: Partial<Satir>) {
    setSatirlar((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  const araToplam = satirlar.reduce((s, r) => s + (Number(r.adet) || 0) * (Number(r.birim_fiyat) || 0), 0);
  const kdvTutari = araToplam * ((Number(kdvOrani) || 0) / 100);
  const kargo = Number(kargoBedeli) || 0;
  const genelToplam = araToplam + kdvTutari + kargo;
  const fmt = (n: number) => formatParaBirimi(n, paraBirimi);

  return (
    <form
      action={(formData) => {
        formData.set(
          "kalemler",
          JSON.stringify(
            satirlar
              .filter((r) => r.aciklama.trim() && Number(r.adet) > 0)
              .map((r) => ({
                adet: Number(r.adet),
                aciklama: r.aciklama,
                termin: r.termin,
                birim_fiyat: Number(r.birim_fiyat) || 0,
              })),
          ),
        );
        return formAction(formData);
      }}
      className="flex max-w-3xl flex-col gap-4"
    >
      <div className="flex gap-4">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label>Tedarikçi (Vendor)</Label>
          <Select name="firma_id" required defaultValue={varsayilanFirmaId ?? ""}>
            <option value="" disabled>
              Tedarikçi seçin
            </option>
            {[...firmalar]
              .sort((a, b) => Number(b.is_tedarikci) - Number(a.is_tedarikci) || a.ad.localeCompare(b.ad, "tr"))
              .map((f) => (
                <option key={f.id} value={f.id}>
                  {f.ad}
                  {f.is_tedarikci ? "" : " (tedarikçi değil)"}
                </option>
              ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Tarih</Label>
          <Input type="date" name="tarih" defaultValue={varsayilanTarih} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Sipariş No (PO No)</Label>
          <Input name="po_no" defaultValue={onerilenPoNo} className="w-32" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Teklif Referansı — &quot;your quote ...&quot; kısmındaki numara</Label>
        <Input name="teklif_ref" placeholder="Örn. 31253" className="w-60" />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label>İlgili Kişi (Contact)</Label>
          <Input name="iletisim" defaultValue={varsayilanIletisim} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Teslimat (Delivery)</Label>
          <Input name="teslimat" placeholder="Örn. Inform before delivery" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Nakliye Şekli (Carriage)</Label>
          <Input name="nakliye" placeholder="Örn. UPS" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Termin</Label>
          <Input name="termin" placeholder="Örn. 2 WEEK" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Ödeme Şartları (Terms)</Label>
          <Input name="odeme_sartlari" placeholder="Örn. 40 days" />
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

      <div className="flex flex-col gap-2">
        <Label>Sipariş Kalemleri (serbest metin — ürün seçimi yok)</Label>
        <div className="hidden gap-2 text-[11px] font-semibold uppercase tracking-wide text-text-dim md:flex">
          <span className="w-20">Adet</span>
          <span className="flex-1">Açıklama / Parça</span>
          <span className="w-28">Termin</span>
          <span className="w-28">Birim Fiyat</span>
          <span className="w-12" />
        </div>
        {satirlar.map((s, i) => (
          <div key={i} className="flex flex-wrap items-start gap-2 md:flex-nowrap">
            <Input
              type="number"
              step="any"
              placeholder="Adet"
              value={s.adet}
              onChange={(e) => guncelle(i, { adet: e.target.value })}
              className="w-20"
            />
            <Textarea
              rows={1}
              placeholder='Örn. H21847, set at 0.1" H2O'
              value={s.aciklama}
              onChange={(e) => guncelle(i, { aciklama: e.target.value })}
              className="min-w-40 flex-1"
            />
            <Input
              placeholder="2 WEEK"
              value={s.termin}
              onChange={(e) => guncelle(i, { termin: e.target.value })}
              className="w-28"
            />
            <Input
              type="number"
              step="0.01"
              placeholder="Fiyat"
              value={s.birim_fiyat}
              onChange={(e) => guncelle(i, { birim_fiyat: e.target.value })}
              className="w-28"
            />
            {satirlar.length > 1 ? (
              <button
                type="button"
                onClick={() => setSatirlar((rs) => rs.filter((_, idx) => idx !== i))}
                className="w-12 pt-2 text-[12px] text-text-dim hover:text-orange"
              >
                Kaldır
              </button>
            ) : (
              <span className="w-12" />
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setSatirlar((rs) => [...rs, { ...BOS_SATIR }])}
          className="self-start text-[12.5px] font-medium text-green"
        >
          + Kalem ekle
        </button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>KDV / VAT Oranı (%)</Label>
          <Input
            type="number"
            name="kdv_orani"
            value={kdvOrani}
            onChange={(e) => setKdvOrani(e.target.value)}
            className="w-28"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Kargo Bedeli ({paraBirimiSembol(paraBirimi)})</Label>
          <Input
            type="number"
            step="0.01"
            name="kargo_bedeli"
            value={kargoBedeli}
            onChange={(e) => setKargoBedeli(e.target.value)}
            className="w-32"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Kargo Notu (bedel yoksa yazı çıkar)</Label>
          <Input name="kargo_notu" placeholder="Örn. Consolidate" className="w-48" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Ek Mesaj (opsiyonel)</Label>
        <Textarea name="mesaj" rows={2} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Alt Not (opsiyonel)</Label>
        <Textarea name="notlar" rows={2} />
      </div>

      <div className="flex flex-col items-end gap-1 rounded-[10px] border border-border bg-bg-elev px-4 py-3 text-[13px]">
        <div className="flex w-52 justify-between text-text-dim">
          <span>Ara Toplam</span>
          <span className="font-mono">{fmt(araToplam)}</span>
        </div>
        <div className="flex w-52 justify-between text-text-dim">
          <span>KDV (%{kdvOrani || 0})</span>
          <span className="font-mono">{fmt(kdvTutari)}</span>
        </div>
        {kargo > 0 && (
          <div className="flex w-52 justify-between text-text-dim">
            <span>Kargo</span>
            <span className="font-mono">{fmt(kargo)}</span>
          </div>
        )}
        <div className="flex w-52 justify-between border-t border-border pt-1 font-semibold">
          <span>Genel Toplam</span>
          <span className="font-mono">{fmt(genelToplam)}</span>
        </div>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-orange-soft px-3 py-2 text-[12.5px] text-orange">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Kaydediliyor..." : "Siparişi Kaydet"}
      </Button>
    </form>
  );
}
