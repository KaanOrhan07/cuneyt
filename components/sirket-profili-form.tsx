"use client";

import { useRef, useState, useTransition } from "react";
import {
  updateSirketProfili,
  uploadLogo,
  removeLogo,
  uploadOzelSablon,
  removeOzelSablon,
  type SablonTuru,
} from "@/lib/actions/sirket";
import { Button, Input, Label, Panel, Textarea } from "@/components/ui";
import type { SirketProfili } from "@/lib/types";

export function SirketProfiliForm({ profil }: { profil: SirketProfili | null }) {
  const [pending, startTransition] = useTransition();
  const [kaydedildi, setKaydedildi] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoYukleniyor, setLogoYukleniyor] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <Panel title="Şirket Bilgileri">
        <form
          action={(formData) => {
            setHata(null);
            startTransition(async () => {
              try {
                await updateSirketProfili(formData);
                setKaydedildi(true);
                setTimeout(() => setKaydedildi(false), 2500);
              } catch (err) {
                setHata(err instanceof Error ? err.message : "Kaydedilemedi.");
              }
            });
          }}
          className="flex flex-col gap-3.5"
        >
          <div className="grid grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <Label>Şirket Adı</Label>
              <Input name="sirket_adi" defaultValue={profil?.sirket_adi ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Vergi No</Label>
              <Input name="vergi_no" defaultValue={profil?.vergi_no ?? ""} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Adres</Label>
            <Textarea name="adres" rows={2} defaultValue={profil?.adres ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <Label>Telefon</Label>
              <Input name="telefon" defaultValue={profil?.telefon ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>E-posta</Label>
              <Input name="eposta" type="email" defaultValue={profil?.eposta ?? ""} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Banka Bilgileri (teklif PDF&apos;inin altında görünür)</Label>
            <Textarea
              name="banka_bilgisi"
              rows={3}
              defaultValue={profil?.banka_bilgisi ?? ""}
              placeholder={"Örn:\nHALKBANK ŞUBE: 01471 AKYURT\nHESAP NO: 5810 0102\nIBAN: TR92 0001 2001 4710 0058 1001 02"}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Varsayılan Teklif Notu</Label>
            <Textarea
              name="varsayilan_notlar"
              rows={2}
              defaultValue={profil?.varsayilan_notlar ?? ""}
              placeholder="Her yeni teklifte otomatik doldurulacak alt not"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pending} className="self-start">
              {pending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
            {kaydedildi && <span className="text-[12.5px] text-green">Kaydedildi ✓</span>}
          </div>
          {hata && <p className="rounded-lg bg-orange-soft px-3 py-2 text-[12.5px] text-orange">{hata}</p>}
        </form>
      </Panel>

      <Panel title="Logo">
        <div className="flex items-center gap-4">
          {profil?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profil.logo_url} alt="Logo" className="h-16 w-auto rounded-lg border border-border object-contain p-1" />
          ) : (
            <div className="flex h-16 w-28 items-center justify-center rounded-lg border border-dashed border-border text-[11px] text-text-dim">
              Logo yok
            </div>
          )}
          <div className="flex flex-col gap-2">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="text-[12px]"
              onChange={() => {
                const file = logoInputRef.current?.files?.[0];
                if (!file) return;
                const fd = new FormData();
                fd.set("logo", file);
                setLogoYukleniyor(true);
                setHata(null);
                startTransition(async () => {
                  try {
                    await uploadLogo(fd);
                  } catch (err) {
                    setHata(err instanceof Error ? err.message : "Logo yüklenemedi.");
                  } finally {
                    setLogoYukleniyor(false);
                    if (logoInputRef.current) logoInputRef.current.value = "";
                  }
                });
              }}
            />
            {profil?.logo_url && (
              <button
                type="button"
                className="self-start text-[12px] text-text-dim hover:text-orange"
                onClick={() => startTransition(() => removeLogo())}
              >
                Logoyu kaldır
              </button>
            )}
            {logoYukleniyor && <span className="text-[11.5px] text-text-dim">Yükleniyor...</span>}
          </div>
        </div>
      </Panel>

      <SablonBolumu
        tur="satis"
        baslik="Satış Teklifi Şablonu (opsiyonel)"
        url={profil?.ozel_sablon_url ?? null}
        aciklama={
          <>
            Elinizdeki herhangi bir teklif/fatura PDF&apos;ini (dolu olsa bile) yükleyebilirsiniz — üst kısımdaki
            logo/başlık alanı (yaklaşık 4 cm) olduğu gibi korunur, altındaki her şeyi biz otomatik olarak
            temizleyip yeni teklif içeriğini oraya basarız. Elle silme/boşaltma yapmanıza gerek yok. Yüklemezseniz
            DiTrack&apos;in kendi tasarımı kullanılır.
          </>
        }
      />
      <SablonBolumu
        tur="alis"
        baslik="Alış Teklifi Şablonu (opsiyonel)"
        url={profil?.alis_teklif_sablon_url ?? null}
        aciklama={
          <>
            Alış teklifleriniz için ayrı bir şablon yükleyebilirsiniz; aynı şekilde üst antet alanı korunur,
            altı otomatik temizlenir. Yüklemezseniz DiTrack&apos;in kendi tasarımı kullanılır.
          </>
        }
      />
    </div>
  );
}

function SablonBolumu({
  tur,
  baslik,
  url,
  aciklama,
}: {
  tur: SablonTuru;
  baslik: string;
  url: string | null;
  aciklama: React.ReactNode;
}) {
  const [, startTransition] = useTransition();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Panel title={baslik}>
      <p className="mb-3 text-[12.5px] text-text-dim">{aciklama}</p>
      <div className="flex items-center gap-4">
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12.5px] font-medium text-green hover:underline"
          >
            Yüklü şablonu görüntüle
          </a>
        ) : (
          <span className="text-[12px] text-text-dim">Şablon yüklenmedi</span>
        )}
      </div>
      <div className="mt-2 flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="text-[12px]"
          onChange={() => {
            const file = inputRef.current?.files?.[0];
            if (!file) return;
            const fd = new FormData();
            fd.set("sablon", file);
            setYukleniyor(true);
            setHata(null);
            startTransition(async () => {
              try {
                await uploadOzelSablon(tur, fd);
              } catch (err) {
                setHata(err instanceof Error ? err.message : "Şablon yüklenemedi.");
              } finally {
                setYukleniyor(false);
                if (inputRef.current) inputRef.current.value = "";
              }
            });
          }}
        />
        {url && (
          <button
            type="button"
            className="self-start text-[12px] text-text-dim hover:text-orange"
            onClick={() => startTransition(() => removeOzelSablon(tur))}
          >
            Şablonu kaldır (DiTrack tasarımına dön)
          </button>
        )}
        {yukleniyor && <span className="text-[11.5px] text-text-dim">Yükleniyor...</span>}
        {hata && <p className="rounded-lg bg-orange-soft px-3 py-2 text-[12.5px] text-orange">{hata}</p>}
      </div>
    </Panel>
  );
}
