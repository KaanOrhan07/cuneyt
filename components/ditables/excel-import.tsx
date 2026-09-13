"use client";

import { useRef, useState } from "react";
import { bulkImportUrunler, type UrunImportSatiri } from "@/lib/actions/urunler";
import { bulkImportFirmalar, type FirmaImportSatiri } from "@/lib/actions/firmalar";
import { Button, Select } from "@/components/ui";

type Sablon = "urun" | "firma";

const norm = (s: string) => s.trim().toLocaleLowerCase("tr-TR");

function evetMi(v: unknown) {
  const s = norm(String(v ?? ""));
  return s === "evet" || s === "true" || s === "1" || s === "x" || s === "yes";
}

function sayi(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function ExcelImport() {
  const [sablon, setSablon] = useState<Sablon>("urun");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [dosyaAdi, setDosyaAdi] = useState("");
  const [durum, setDurum] = useState<{ tip: "ok" | "error"; mesaj: string } | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function dosyaSecildi(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setDosyaAdi(file.name);
    setDurum(null);

    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as Record<string, unknown>[];
    setRows(json);
  }

  function bul(row: Record<string, unknown>, ...adaylar: string[]) {
    const anahtarlar = Object.keys(row);
    for (const aday of adaylar) {
      const bulunan = anahtarlar.find((k) => norm(k) === norm(aday));
      if (bulunan) return row[bulunan];
    }
    return undefined;
  }

  async function iceAktar() {
    setYukleniyor(true);
    setDurum(null);
    try {
      if (sablon === "urun") {
        const veri: UrunImportSatiri[] = rows.map((r) => ({
          ad: String(bul(r, "Ürün Adı", "Urun Adi", "Ad") ?? ""),
          fotograf_url: String(bul(r, "Fotoğraf URL", "Fotograf URL") ?? "") || undefined,
          stok_adet: sayi(bul(r, "Stok Adedi", "Stok")),
          ortalama_maliyet: sayi(bul(r, "Ortalama Maliyet", "Maliyet")),
          satis_fiyati: sayi(bul(r, "Satış Fiyatı", "Satis Fiyati")),
          kritik_stok_esigi: sayi(bul(r, "Kritik Stok Eşiği", "Kritik Esik")),
        }));
        const sonuc = await bulkImportUrunler(veri);
        setDurum({ tip: "ok", mesaj: `${sonuc.eklenen} ürün başarıyla eklendi.` });
      } else {
        const veri: FirmaImportSatiri[] = rows.map((r) => ({
          ad: String(bul(r, "Firma Adı", "Firma Adi", "Ad") ?? ""),
          renk: String(bul(r, "Renk (hex)", "Renk") ?? "") || undefined,
          is_tedarikci: evetMi(bul(r, "Tedarikçi (Evet/Hayır)", "Tedarikçi", "Tedarikci")),
          is_musteri: evetMi(bul(r, "Müşteri (Evet/Hayır)", "Müşteri", "Musteri")),
        }));
        const sonuc = await bulkImportFirmalar(veri);
        setDurum({ tip: "ok", mesaj: `${sonuc.eklenen} firma başarıyla eklendi.` });
      }
      setRows([]);
      setDosyaAdi("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setDurum({ tip: "error", mesaj: err instanceof Error ? err.message : "İçe aktarma başarısız." });
    } finally {
      setYukleniyor(false);
    }
  }

  const gecerliSatirSayisi = rows.filter((r) => {
    const ad = bul(r, sablon === "urun" ? "Ürün Adı" : "Firma Adı", "Ad");
    return String(ad ?? "").trim().length > 0;
  }).length;

  return (
    <div className="rounded-[10px] border border-border bg-card p-4">
      <h3 className="mb-1 text-[14.5px] font-semibold">Excel&apos;den Toplu İçe Aktar</h3>
      <p className="mb-3 text-[12.5px] text-text-dim">
        Yukarıdaki şablonu doldurup indirdiğiniz (veya kendi Excel dosyanızı aynı sütun
        başlıklarıyla hazırladığınız) .xlsx dosyasını yükleyin.
      </p>

      <div className="flex flex-wrap items-center gap-2.5">
        <Select value={sablon} onChange={(e) => setSablon(e.target.value as Sablon)}>
          <option value="urun">Ürün olarak içe aktar</option>
          <option value="firma">Firma olarak içe aktar</option>
        </Select>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={dosyaSecildi}
          className="text-[12.5px]"
        />
      </div>

      {rows.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 text-[12.5px] text-text-dim">
            <strong>{dosyaAdi}</strong> — {rows.length} satır bulundu, {gecerliSatirSayisi} tanesi
            geçerli (ad alanı dolu).
          </p>
          <div className="max-h-48 overflow-auto rounded-md border border-border">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-bg-elev">
                  {Object.keys(rows[0]).map((k) => (
                    <th key={k} className="border border-border px-2 py-1 text-left font-semibold">
                      {k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 8).map((r, i) => (
                  <tr key={i}>
                    {Object.keys(rows[0]).map((k) => (
                      <td key={k} className="border border-border px-2 py-1">
                        {String(r[k] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 8 && (
            <p className="mt-1 text-[11.5px] text-text-dim">…ve {rows.length - 8} satır daha.</p>
          )}
          <Button onClick={iceAktar} disabled={yukleniyor || gecerliSatirSayisi === 0} className="mt-3">
            {yukleniyor ? "Aktarılıyor..." : `${gecerliSatirSayisi} satırı içe aktar`}
          </Button>
        </div>
      )}

      {durum && (
        <p
          className={`mt-3 rounded-lg px-3 py-2 text-[12.5px] ${
            durum.tip === "ok" ? "bg-green-soft text-green" : "bg-orange-soft text-orange"
          }`}
        >
          {durum.mesaj}
        </p>
      )}
    </div>
  );
}
