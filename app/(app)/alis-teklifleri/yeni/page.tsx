import { YeniTeklifSayfasi } from "@/components/yeni-teklif-sayfasi";

export default async function Page({ searchParams }: { searchParams: Promise<{ firma_id?: string }> }) {
  const { firma_id } = await searchParams;
  return <YeniTeklifSayfasi tip="alis" firma_id={firma_id} />;
}
