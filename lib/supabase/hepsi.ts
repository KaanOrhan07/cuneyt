import type { createClient } from "@/lib/supabase/server";

type Istemci = Awaited<ReturnType<typeof createClient>>;

/** PostgREST'in 1000 satır sınırını aşarak bir tablonun tüm satırlarını sayfa sayfa çeker. */
export async function tumSatirlar<T = Record<string, unknown>>(
  supabase: Istemci,
  tablo: string,
  select = "*",
  sirala = "id",
): Promise<{ data: T[]; error: string | null }> {
  const boyut = 1000;
  const hepsi: T[] = [];
  for (let bas = 0; ; bas += boyut) {
    const { data, error } = await supabase
      .from(tablo)
      .select(select)
      .order(sirala)
      .range(bas, bas + boyut - 1);
    if (error) return { data: hepsi, error: error.message };
    const parca = (data ?? []) as unknown as T[];
    hepsi.push(...parca);
    if (parca.length < boyut) break;
  }
  return { data: hepsi, error: null };
}
