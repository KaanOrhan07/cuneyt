export type Yon = "alacak" | "verecek";

export const DONEMLER = [
  { key: "hafta", label: "1 Hafta", gun: 7 },
  { key: "ay", label: "1 Ay", gun: 30 },
  { key: "3ay", label: "3 Ay", gun: 90 },
  { key: "6ay", label: "6 Ay", gun: 180 },
  { key: "yil", label: "1 Yıl", gun: 365 },
] as const;

/** "YYYY-MM-DD" anahtarına n gün ekler (saat dilimi etkisi olmadan). */
export function gunEkle(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}

export type FinansHareket = {
  id: string;
  firma_id: string;
  firma_ad: string;
  tarih: string;
  fatura_no: string | null;
  aciklama: string | null;
  tutar: number;
  vade_tarihi: string | null;
  yon: Yon;
  para_birimi: string;
  odenen: number;
  kalan: number;
};

export type FinansOdeme = { tarih: string; tutar: number; yon: Yon; para_birimi: string };
export type FinansGider = { tarih: string; tutar: number; para_birimi: string };

export type ParaBirimiOzeti = {
  paraBirimi: string;
  toplamGelir: number;
  toplamGider: number;
  toplamKar: number;
  toplamAlacak: number;
  toplamBorc: number;
  gecikmisAlacak: number;
  gecikmisBorc: number;
  /** DONEMLER sırasıyla, bugünden itibaren o güne kadar (kümülatif) vadesi gelen kalan tutarlar */
  beklenenAlacak: number[];
  beklenenBorc: number[];
  /** DONEMLER sırasıyla, geriye doğru o kadar gün içinde gerçekleşenler */
  gerceklesenGelir: number[];
  gerceklesenGider: number[];
};

const PARA_SIRASI = ["TL", "USD", "EUR", "GBP"];

function sirala(birimler: string[]) {
  return [...birimler].sort((a, b) => {
    const ia = PARA_SIRASI.indexOf(a);
    const ib = PARA_SIRASI.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
  });
}

const yuvarla = (n: number) => Math.round(n * 100) / 100;

export function finansOzeti(
  hareketler: FinansHareket[],
  odemeler: FinansOdeme[],
  giderler: FinansGider[],
  bugun: string,
): ParaBirimiOzeti[] {
  const birimler = new Set<string>(["TL"]);
  hareketler.forEach((h) => birimler.add(h.para_birimi));
  giderler.forEach((g) => birimler.add(g.para_birimi));

  return sirala([...birimler]).map((pb) => {
    const hp = hareketler.filter((h) => h.para_birimi === pb);
    const op = odemeler.filter((o) => o.para_birimi === pb);
    const gp = giderler.filter((g) => g.para_birimi === pb);

    const alacaklar = hp.filter((h) => h.yon === "alacak" && h.kalan > 0);
    const borclar = hp.filter((h) => h.yon === "verecek" && h.kalan > 0);
    const topla = <T,>(liste: T[], f: (x: T) => number) => liste.reduce((s, x) => s + f(x), 0);

    const gelir = topla(op.filter((o) => o.yon === "alacak"), (o) => o.tutar);
    const odenenBorc = topla(op.filter((o) => o.yon === "verecek"), (o) => o.tutar);
    const giderToplam = topla(gp, (g) => g.tutar);
    const gider = odenenBorc + giderToplam;

    const pencere = (liste: FinansHareket[], gun: number) => {
      const son = gunEkle(bugun, gun);
      return topla(
        liste.filter((h) => h.vade_tarihi && h.vade_tarihi >= bugun && h.vade_tarihi <= son),
        (h) => h.kalan,
      );
    };
    const gecmis = (yon: Yon, gun: number) => {
      const bas = gunEkle(bugun, -gun);
      const odemeToplam = topla(
        op.filter((o) => o.yon === yon && o.tarih >= bas && o.tarih <= bugun),
        (o) => o.tutar,
      );
      if (yon === "alacak") return odemeToplam;
      return odemeToplam + topla(gp.filter((g) => g.tarih >= bas && g.tarih <= bugun), (g) => g.tutar);
    };

    return {
      paraBirimi: pb,
      toplamGelir: yuvarla(gelir),
      toplamGider: yuvarla(gider),
      toplamKar: yuvarla(gelir - gider),
      toplamAlacak: yuvarla(topla(alacaklar, (h) => h.kalan)),
      toplamBorc: yuvarla(topla(borclar, (h) => h.kalan)),
      gecikmisAlacak: yuvarla(
        topla(alacaklar.filter((h) => h.vade_tarihi && h.vade_tarihi < bugun), (h) => h.kalan),
      ),
      gecikmisBorc: yuvarla(
        topla(borclar.filter((h) => h.vade_tarihi && h.vade_tarihi < bugun), (h) => h.kalan),
      ),
      beklenenAlacak: DONEMLER.map((d) => yuvarla(pencere(alacaklar, d.gun))),
      beklenenBorc: DONEMLER.map((d) => yuvarla(pencere(borclar, d.gun))),
      gerceklesenGelir: DONEMLER.map((d) => yuvarla(gecmis("alacak", d.gun))),
      gerceklesenGider: DONEMLER.map((d) => yuvarla(gecmis("verecek", d.gun))),
    };
  });
}

export type FirmaBakiye = {
  firma_id: string;
  firma_ad: string;
  para_birimi: string;
  toplam: number;
  odenen: number;
  kalan: number;
  enYakinVade: string | null;
  gecikmis: boolean;
};

export function firmaBakiyeleri(hareketler: FinansHareket[], yon: Yon, bugun: string): FirmaBakiye[] {
  const harita = new Map<string, FirmaBakiye>();
  for (const h of hareketler.filter((x) => x.yon === yon)) {
    const anahtar = `${h.firma_id}|${h.para_birimi}`;
    const b =
      harita.get(anahtar) ??
      ({
        firma_id: h.firma_id,
        firma_ad: h.firma_ad,
        para_birimi: h.para_birimi,
        toplam: 0,
        odenen: 0,
        kalan: 0,
        enYakinVade: null,
        gecikmis: false,
      } as FirmaBakiye);
    b.toplam += h.tutar;
    b.odenen += h.odenen;
    b.kalan += Math.max(h.kalan, 0);
    if (h.kalan > 0 && h.vade_tarihi) {
      if (!b.enYakinVade || h.vade_tarihi < b.enYakinVade) b.enYakinVade = h.vade_tarihi;
      if (h.vade_tarihi < bugun) b.gecikmis = true;
    }
    harita.set(anahtar, b);
  }
  return [...harita.values()]
    .map((b) => ({ ...b, toplam: yuvarla(b.toplam), odenen: yuvarla(b.odenen), kalan: yuvarla(b.kalan) }))
    .sort((a, b) => b.kalan - a.kalan || a.firma_ad.localeCompare(b.firma_ad, "tr"));
}

export type HareketDurumu = "odendi" | "kismi" | "odenmedi" | "gecikmis";

export function hareketDurumu(h: FinansHareket, bugun: string): HareketDurumu {
  if (h.kalan <= 0) return "odendi";
  if (h.vade_tarihi && h.vade_tarihi < bugun) return "gecikmis";
  return h.odenen > 0 ? "kismi" : "odenmedi";
}
