"use client";

import { useRef, useState, useTransition } from "react";
import {
  updateSirketProfili,
  uploadLogo,
  removeLogo,
  uploadOzelSablon,
  removeOzelSablon,
} from "@/lib/actions/sirket";
import { Button, Input, Label, Panel, Textarea } from "@/components/ui";
import type { SirketProfili } from "@/lib/types";

export function SirketProfiliForm({ profil }: { profil: SirketProfili | null }) {
  const [pending, startTransition] = useTransition();
  const [kaydedildi, setKaydedildi] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const sablonInputRef = useRef<HTMLInputElement>(null);
  const [logoYukleniyor, setLogoYukleniyor] = useState(false);
  const [sablonYukleniyor, setSablonYukleniyor] = useState(false);

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

      <Panel title="Kendi PDF Şablonunuz (opsiyonel)">
        <p className="mb-3 text-[12.5px] text-text-dim">
          Elinizdeki herhangi bir teklif/fatura PDF&apos;ini (dolu olsa bile) yükleyebilirsiniz — üst kısımdaki
          logo/başlık alanı (yaklaşık 6 cm) olduğu gibi korunur, altındaki her şeyi biz otomatik olarak
          temizleyip yeni teklif içeriğini oraya basarız. Elle silme/boşaltma yapmanıza gerek yok. Yüklemezseniz
          DiTrack&apos;in kendi tasarımı (üstteki logo/bilgiler ile) kullanılır.
        </p>
        <div className="flex items-center gap-4">
          {profil?.ozel_sablon_url ? (
            <a
              href={profil.ozel_sablon_url}
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
            ref={sablonInputRef}
            type="file"
            accept="application/pdf"
            className="text-[12px]"
            onChange={() => {
              const file = sablonInputRef.current?.files?.[0];
              if (!file) return;
              const fd = new FormData();
              fd.set("sablon", file);
              setSablonYukleniyor(true);
              setHata(null);
              startTransition(async () => {
                try {
                  await uploadOzelSablon(fd);
                } catch (err) {
                  setHata(err instanceof Error ? err.message : "Şablon yüklenemedi.");
                } finally {
                  setSablonYukleniyor(false);
                  if (sablonInputRef.current) sablonInputRef.current.value = "";
                }
              });
            }}
          />
          {profil?.ozel_sablon_url && (
            <button
              type="button"
              className="self-start text-[12px] text-text-dim hover:text-orange"
              onClick={() => startTransition(() => removeOzelSablon())}
            >
              Şablonu kaldır (DiTrack tasarımına dön)
            </button>
          )}
          {sablonYukleniyor && <span className="text-[11.5px] text-text-dim">Yükleniyor...</span>}
        </div>
      </Panel>
    </div>
  );
}
