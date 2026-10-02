import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Giriş yapmış kullanıcının tarayıcısı için: verilen andan sonra siteden yeni kayıt gelmiş mi? */
export async function GET(request: Request) {
  const since = new URL(request.url).searchParams.get("since");
  const supabase = await createClient();

  let yeniSorgu = supabase.from("site_gelenler").select("tip", { count: "exact" });
  if (since && !Number.isNaN(Date.parse(since))) yeniSorgu = yeniSorgu.gt("created_at", since);
  else yeniSorgu = yeniSorgu.limit(0);

  const [{ data: yeniler, count }, { count: bekleyen }, { data: son }] = await Promise.all([
    yeniSorgu,
    supabase.from("site_gelenler").select("id", { count: "exact", head: true }).eq("durum", "beklemede"),
    supabase.from("site_gelenler").select("created_at").order("created_at", { ascending: false }).limit(1),
  ]);

  return NextResponse.json({
    yeni: count ?? 0,
    yeniTeklif: yeniler?.filter((y) => y.tip === "teklif").length ?? 0,
    yeniSiparis: yeniler?.filter((y) => y.tip === "siparis").length ?? 0,
    bekleyen: bekleyen ?? 0,
    son: son?.[0]?.created_at ?? null,
  });
}
