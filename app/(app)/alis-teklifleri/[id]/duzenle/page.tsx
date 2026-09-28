import { TeklifDuzenleSayfasi } from "@/components/teklif-duzenle-sayfasi";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TeklifDuzenleSayfasi id={id} tip="alis" />;
}
