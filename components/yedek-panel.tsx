"use client";

import { useRef, useState } from "react";
import { yedekSatirlariYukle, yedekStokDuzelt, yedekYuklemeBitti } from "@/lib/actions/yedek";
import { Button, Panel } from "@/components/ui";
import { IMPORT_EDILEBILIR, YEDEK_PARCA_BOYUTU, YEDEK_TABLOLARI } from "@/lib/yedek";

type Satirlar = Record<string, unknown>[];
type Analiz = { dosyaAdi: string; sayfalar: { tablo: string; etiket: string; satirlar: Satirlar }[] };
type Sonuc = Record<string, { eklenen: number; atlanan: number }>;

export function YedekPanel() {
  const [analiz, setAnaliz] = useState<Analiz | null>(null);
  const [durum, setDurum] = useState<string | null>(null);
  const [sonuc, setSonuc] = useState<Sonuc | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function dosyaSecildi(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setHata(null);
    setSonuc(null);
    setAnaliz(null);
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sayfalar = YEDEK_TABLOLARI.filter((t) => IMPORT_EDILEBILIR.has(t.tablo) && wb.Sheets[t.tablo]).map(
        (t) => ({
          tablo: t.tablo,
          etiket: t.etiket,
          satirlar: XLSX.utils.sheet_to_json(wb.Sheets[t.tablo], { defval: null }) as Satirlar,
        }),
      );
      if (sayfalar.length === 0) {
        setHata("Bu dosyada tanınan bir DiTrack yedek sayfası bulunamadı. Biz sayfasından indirdiğiniz yedek dosyasını seçin.");
        return;
      }
      setAnaliz({ dosyaAdi: file.name, sayfalar });
    } catch {
      setHata("Dosya okunamadı. Geçerli bir .xlsx dosyası seçin.");
    }
  }

  async function yukle() {
    if (!analiz) return;
    setCalisiyor(true);
    setHata(null);
    setSonuc(null);
    const ozet: Sonuc = {};
    const yeniUrunIdleri = new Set<string>();
    try {
      for (const s of analiz.sayfalar) {
        ozet[s.tablo] = { eklenen: 0, atlanan: 0 };
        for (let i = 0; i < s.satirlar.length; i += YEDEK_PARCA_BOYUTU) {
          setDurum(`${s.etiket}: ${Math.min(i + YEDEK_PARCA_BOYUTU, s.satirlar.length)} / ${s.satirlar.length}`);
          const r = await yedekSatirlariYukle(s.tablo, s.satirlar.slice(i, i + YEDEK_PARCA_BOYUTU));
          ozet[s.tablo].eklenen += r.eklenen;
          ozet[s.tablo].atlanan += r.atlanan;
          if (s.tablo === "urunler") r.idler.forEach((id) => yeniUrunIdleri.add(id));
        }
      }

      const urunSayfasi = analiz.sayfalar.find((s) => s.tablo === "urunler");
      if (urunSayfasi && yeniUrunIdleri.size > 0) {
        setDurum("Stok değerleri yedekteki haline getiriliyor…");
        const duzeltmeler = urunSayfasi.satirlar
          .filter((u) => yeniUrunIdleri.has(String(u.id)))
          .map((u) => ({
            id: String(u.id),
            stok_adet: Number(u.stok_adet) || 0,
            ortalama_maliyet: Number(u.ortalama_maliyet) || 0,
          }));
        await yedekStokDuzelt(duzeltmeler);
      }

      await yedekYuklemeBitti(analiz.dosyaAdi, ozet);
      setSonuc(ozet);
      setAnaliz(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Yükleme sırasında hata oluştu.");
    } finally {
      setDurum(null);
      setCalisiyor(false);
    }
  }

  return (
    <Panel title="Veri Yedekleme (Export / Import)">
      <p className="mb-4 text-[12.5px] text-text-dim">
        Tüm işletme verinizi (firmalar, ürünler, siparişler, teklifler, tedarik, cari hesaplar, giderler, stok
        hareketleri, kayıtlar) tek bir Excel dosyası olarak indirip yedek alabilirsiniz. Aynı dosyayla verileri geri
        yükleyebilirsiniz.
      </p>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <a href="/api/yedek">
          <Button>Tüm Veriyi İndir (Excel)</Button>
        </a>
        <span className="text-[11.5px] text-text-dim">Veri miktarına göre birkaç saniye sürebilir.</span>
      </div>

      <div className="rounded-[10px] border border-border bg-bg-elev p-4">
        <div className="mb-1 text-[13px] font-semibold">Yedekten Geri Yükle</div>
        <p className="mb-3 text-[12px] text-text-dim">
          Yedek dosyasındaki kayıtlar mevcut verinizin <strong>üzerine yazmaz</strong>: sistemde zaten olan kayıtlar
          atlanır, olmayanlar eklenir. En temiz sonuç için boş/yeni bir kurulumda kullanın. Yüklenen siparişler stok
          hesabını etkileyebilir; yeni eklenen ürünlerin stoğu yedekteki değerine geri alınır.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx"
          onChange={dosyaSecildi}
          disabled={calisiyor}
          className="text-[12px]"
        />

        {analiz && (
          <div className="mt-4">
            <p className="mb-2 text-[12.5px]">
              <strong>{analiz.dosyaAdi}</strong> içinde bulunanlar:
            </p>
            <ul className="mb-3 grid grid-cols-2 gap-x-6 gap-y-1 text-[12.5px] md:grid-cols-3">
              {analiz.sayfalar.map((s) => (
                <li key={s.tablo} className="flex justify-between">
                  <span className="text-text-dim">{s.etiket}</span>
                  <span className="font-mono">{s.satirlar.length}</span>
                </li>
              ))}
            </ul>
            <Button onClick={yukle} disabled={calisiyor}>
              {calisiyor ? "Yükleniyor…" : "Yüklemeyi Başlat"}
            </Button>
          </div>
        )}

        {durum && <p className="mt-3 text-[12.5px] text-text-dim">{durum}</p>}

        {sonuc && (
          <div className="mt-4 rounded-lg bg-green-soft px-3 py-2 text-[12.5px] text-green">
            <div className="mb-1 font-semibold">Yükleme tamamlandı</div>
            <ul className="grid grid-cols-1 gap-y-0.5 md:grid-cols-2">
              {YEDEK_TABLOLARI.filter((t) => sonuc[t.tablo]).map((t) => (
                <li key={t.tablo}>
                  {t.etiket}: {sonuc[t.tablo].eklenen} eklendi
                  {sonuc[t.tablo].atlanan ? `, ${sonuc[t.tablo].atlanan} zaten vardı` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}

        {hata && <p className="mt-3 rounded-lg bg-orange-soft px-3 py-2 text-[12.5px] text-orange">{hata}</p>}
      </div>
    </Panel>
  );
}
