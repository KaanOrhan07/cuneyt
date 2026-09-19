import { TeklifListe, type TeklifFiltreleri } from "@/components/teklif-liste";

export default async function Page({ searchParams }: { searchParams: Promise<TeklifFiltreleri> }) {
  return <TeklifListe tip="alis" filters={await searchParams} />;
}
