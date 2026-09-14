"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { bulkImportUrunler, type UrunImportSatiri } from "@/lib/actions/urunler";
import { bulkImportFirmalar, type FirmaImportSatiri } from "@/lib/actions/firmalar";
import { Button } from "@/components/ui";
import { bulKolon, evetMi, sayiDegeri } from "@/lib/excel-import-helpers";

type Tip = "urun" | "firma";

const SABLON_BASLIKLARI: Record<Tip, string[]> = {
  urun: ["Ürün Adı", "Fotoğraf URL", "Stok Adedi", "Ortalama Maliyet", "Satış Fiyatı", "Kritik Stok Eşiği"],
  firma: ["Firma Adı", "Renk (hex)", "Tedarikçi (Evet/Hayır)", "Müşteri (Evet/Hayır)"],
};

const SABLON_DOSYA_ADI: Record<Tip, string> = {
  urun: "urun-sablonu",
  firma: "firma-sablonu",
};

export function ImportExcelButton({ tip }: { tip: Tip }) {
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [dosyaAdi, setDosyaAdi] = useState("");
  const [durum, setDurum] = useState<{ tip: "ok" | "error"; mesaj: string } | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function sablonuIndir() {
    const XLSX = await import("xlsx");
    const sheet = XLSX.utils.aoa_to_sheet([SABLON_BASLIKLARI[tip]]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, tip === "urun" ? "Ürünler" : "Firmalar");
    XLSX.writeFile(workbook, `${SABLON_DOSYA_ADI[tip]}.xlsx`);
  }

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

  async function iceAktar() {
    setYukleniyor(true);
    setDurum(null);
    try {
      if (tip === "urun") {
        const veri: UrunImportSatiri[] = rows.map((r) => ({
          ad: String(bulKolon(r, "Ürün Adı", "Urun Adi", "Ad") ?? ""),
          fotograf_url: String(bulKolon(r, "Fotoğraf URL", "Fotograf URL") ?? "") || undefined,
          stok_adet: sayiDegeri(bulKolon(r, "Stok Adedi", "Stok")),
          ortalama_maliyet: sayiDegeri(bulKolon(r, "Ortalama Maliyet", "Maliyet")),
          satis_fiyati: sayiDegeri(bulKolon(r, "Satış Fiyatı", "Satis Fiyati")),
          kritik_stok_esigi: sayiDegeri(bulKolon(r, "Kritik Stok Eşiği", "Kritik Esik")),
        }));
        const sonuc = await bulkImportUrunler(veri);
        setDurum({ tip: "ok", mesaj: `${sonuc.eklenen} ürün başarıyla eklendi.` });
      } else {
        const veri: FirmaImportSatiri[] = rows.map((r) => ({
          ad: String(bulKolon(r, "Firma Adı", "Firma Adi", "Ad") ?? ""),
          renk: String(bulKolon(r, "Renk (hex)", "Renk") ?? "") || undefined,
          is_tedarikci: evetMi(bulKolon(r, "Tedarikçi (Evet/Hayır)", "Tedarikçi", "Tedarikci")),
          is_musteri: evetMi(bulKolon(r, "Müşteri (Evet/Hayır)", "Müşteri", "Musteri")),
        }));
        const sonuc = await bulkImportFirmalar(veri);
        setDurum({ tip: "ok", mesaj: `${sonuc.eklenen} firma başarıyla eklendi.` });
      }
      setRows([]);
      setDosyaAdi("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } catch (err) {
      setDurum({ tip: "error", mesaj: err instanceof Error ? err.message : "İçe aktarma başarısız." });
    } finally {
      setYukleniyor(false);
    }
  }

  const adBaslikAdaylari = tip === "urun" ? ["Ürün Adı", "Urun Adi", "Ad"] : ["Firma Adı", "Firma Adi", "Ad"];
  const gecerliSatirSayisi = rows.filter((r) => {
    const ad = bulKolon(r, ...adBaslikAdaylari);
    return String(ad ?? "").trim().length > 0;
  }).length;

  return (
    <div className="relative">
      <Button
        variant="secondary"
        onClick={() => {
          setAcik((a) => !a);
          setDurum(null);
        }}
      >
        Yükle (Excel)
      </Button>

      {acik && (
        <div className="absolute right-0 top-full z-20 mt-2 w-[380px] rounded-[10px] border border-border bg-card p-4 shadow-[var(--shadow)]">
          <h3 className="mb-1 text-[13.5px] font-semibold">
            Excel&apos;den {tip === "urun" ? "Ürün" : "Firma"} İçe Aktar
          </h3>
          <p className="mb-3 text-[12px] text-text-dim">
            Şablonumuzla hazırlanmış bir .xlsx dosyası yükleyin. Önce şablonu indirip doldurabilirsiniz.
          </p>

          <button
            type="button"
            onClick={sablonuIndir}
            className="mb-3 text-[12.5px] font-medium text-green hover:underline"
          >
            Şablonu İndir
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={dosyaSecildi}
            className="block w-full text-[12px]"
          />

          {rows.length > 0 && (
            <div className="mt-3">
              <p className="mb-2 text-[12px] text-text-dim">
                <strong>{dosyaAdi}</strong> — {rows.length} satır bulundu, {gecerliSatirSayisi} tanesi
                geçerli (ad alanı dolu).
              </p>
              <Button
                onClick={iceAktar}
                disabled={yukleniyor || gecerliSatirSayisi === 0}
                className="w-full justify-center"
              >
                {yukleniyor ? "Aktarılıyor..." : `${gecerliSatirSayisi} satırı içe aktar`}
              </Button>
            </div>
          )}

          {durum && (
            <p
              className={`mt-3 rounded-lg px-3 py-2 text-[12px] ${
                durum.tip === "ok" ? "bg-green-soft text-green" : "bg-orange-soft text-orange"
              }`}
            >
              {durum.mesaj}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
