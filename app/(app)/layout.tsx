import { Sidebar } from "@/components/sidebar";
import { logout } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: urunler } = await supabase
    .from("urunler")
    .select("stok_adet, kritik_stok_esigi")
    .is("deleted_at", null);
  const kritikStokSayisi =
    urunler?.filter((u) => u.stok_adet <= u.kritik_stok_esigi).length ?? 0;

  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr]">
      <Sidebar kritikStokSayisi={kritikStokSayisi} />
      <div className="flex flex-col">
        <div className="flex justify-end border-b border-border px-8 py-3">
          <form action={logout}>
            <button
              type="submit"
              className="text-[12.5px] font-medium text-text-dim hover:text-text"
            >
              Çıkış Yap
            </button>
          </form>
        </div>
        <main className="flex-1 px-8 py-7">{children}</main>
      </div>
    </div>
  );
}
