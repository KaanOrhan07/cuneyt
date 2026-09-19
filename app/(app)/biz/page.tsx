import { createClient } from "@/lib/supabase/server";
import { SirketProfiliForm } from "@/components/sirket-profili-form";
import { EkipPanel } from "@/components/ekip-panel";
import { YedekPanel } from "@/components/yedek-panel";
import type { EkipUyesi, SirketProfili } from "@/lib/types";

export default async function BizPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: sirket, error: sirketHata }, { data: ekip, error: ekipHata }] = await Promise.all([
    supabase.from("sirket_profili").select("*").eq("id", true).maybeSingle(),
    supabase.from("ekip_uyeleri").select("*").order("created_at"),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-[22px] font-semibold">Biz</h1>
        <p className="mt-0.5 text-[13px] text-text-dim">
          Şirket bilgileriniz teklif PDF&apos;lerinde satıcı olarak görünür; ekip bölümünden çalışma
          arkadaşlarınızı sisteme ekleyebilirsiniz
        </p>
      </div>

      {(sirketHata || ekipHata) && (
        <p className="mb-4 rounded-lg bg-orange-soft px-3 py-2 text-[12.5px] text-orange">
          Veritabanı güncellemesi (migration) henüz çalıştırılmamış: {(sirketHata ?? ekipHata)?.message}
        </p>
      )}

      <div className="flex flex-col gap-5">
        <SirketProfiliForm profil={sirket as SirketProfili | null} />
        <EkipPanel ekip={(ekip as EkipUyesi[]) ?? []} mevcutKullaniciId={user?.id ?? ""} />
        <YedekPanel />
      </div>
    </div>
  );
}
