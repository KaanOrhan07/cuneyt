import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button, Panel, Select } from "@/components/ui";
import { formatTarihSaat } from "@/lib/format";
import { kayitMetni, MODUL_ETIKET } from "@/lib/kayit-metin";
import { parseIstanbulDate } from "@/lib/tr-time";
import type { IslemKaydi } from "@/lib/types";

type Filtre = { modul?: string; kullanici?: string; baslangic?: string; bitis?: string; limit?: string };

export default async function KayitlarPage({ searchParams }: { searchParams: Promise<Filtre> }) {
  const f = await searchParams;
  const limit = Math.min(Number(f.limit) || 200, 2000);
  const supabase = await createClient();

  let query = supabase
    .from("islem_kayitlari")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (f.modul) query = query.eq("modul", f.modul);
  if (f.kullanici) query = query.eq("kullanici_id", f.kullanici);
  if (f.baslangic) query = query.gte("created_at", parseIstanbulDate(f.baslangic).toISOString());
  if (f.bitis) {
    const gunSonu = new Date(parseIstanbulDate(f.bitis).getTime() + 24 * 60 * 60 * 1000 - 1);
    query = query.lte("created_at", gunSonu.toISOString());
  }

  const [{ data: kayitlar, error: hata }, { data: ekip }] = await Promise.all([
    query,
    supabase.from("ekip_uyeleri").select("auth_user_id, ad_soyad").order("ad_soyad"),
  ]);

  const liste = (kayitlar ?? []) as IslemKaydi[];

  const sonrakiLimit = new URLSearchParams(
    Object.entries({ ...f, limit: String(limit + 200) }).filter(([, v]) => v) as [string, string][],
  ).toString();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-[22px] font-semibold">Kayıtlar</h1>
        <p className="mt-0.5 text-[13px] text-text-dim">
          Ekibin yaptığı işlemlerin kaydı — tarih ve saatler Türkiye saatiyle gösterilir
        </p>
      </div>

      {hata && (
        <p className="mb-4 rounded-lg bg-orange-soft px-3 py-2 text-[12.5px] text-orange">
          Veritabanı güncellemesi (migration) henüz çalıştırılmamış: {hata.message}
        </p>
      )}

      <form className="mb-5 flex flex-wrap gap-2.5">
        <Select name="modul" defaultValue={f.modul ?? ""}>
          <option value="">Tüm Modüller</option>
          {Object.entries(MODUL_ETIKET).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
        <Select name="kullanici" defaultValue={f.kullanici ?? ""}>
          <option value="">Tüm Kullanıcılar</option>
          {ekip?.map((e) => (
            <option key={e.auth_user_id} value={e.auth_user_id}>
              {e.ad_soyad}
            </option>
          ))}
        </Select>
        <input
          type="date"
          name="baslangic"
          defaultValue={f.baslangic ?? ""}
          className="rounded-[9px] border border-border bg-bg px-3 py-2 text-[13px]"
        />
        <input
          type="date"
          name="bitis"
          defaultValue={f.bitis ?? ""}
          className="rounded-[9px] border border-border bg-bg px-3 py-2 text-[13px]"
        />
        <Button type="submit" variant="secondary">
          Filtrele
        </Button>
      </form>

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-dim">
                <th className="pb-2.5 text-left font-semibold">Tarih / Saat</th>
                <th className="pb-2.5 text-left font-semibold">Kullanıcı</th>
                <th className="pb-2.5 text-left font-semibold">Modül</th>
                <th className="pb-2.5 text-left font-semibold">İşlem</th>
                <th className="pb-2.5 text-left font-semibold">Kayıt</th>
                <th className="pb-2.5 text-left font-semibold">Detay</th>
              </tr>
            </thead>
            <tbody>
              {liste.map((k) => {
                const m = kayitMetni(k);
                return (
                  <tr key={k.id} className="border-b border-border last:border-0 align-top">
                    <td className="whitespace-nowrap py-2.5 font-mono text-[12px]">
                      {formatTarihSaat(k.created_at)}
                    </td>
                    <td className="py-2.5">{k.kullanici_ad || "—"}</td>
                    <td className="py-2.5 text-text-dim">{MODUL_ETIKET[k.modul] ?? k.modul}</td>
                    <td className="py-2.5">
                      <span
                        className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          m.ton === "green"
                            ? "bg-green-soft text-green"
                            : m.ton === "orange"
                              ? "bg-orange-soft text-[#C74519]"
                              : "bg-bg-elev text-text-dim"
                        }`}
                      >
                        {m.islem}
                      </span>
                    </td>
                    <td className="py-2.5 font-medium">{k.baslik || "—"}</td>
                    <td className="py-2.5 text-[12px] text-text-dim">{m.ozet}</td>
                  </tr>
                );
              })}
              {liste.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-text-dim">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {liste.length >= limit && (
          <div className="mt-4">
            <Link href={`/kayitlar?${sonrakiLimit}`} className="text-[12.5px] font-medium text-green hover:underline">
              Daha eski kayıtları göster →
            </Link>
          </div>
        )}
      </Panel>
    </div>
  );
}
