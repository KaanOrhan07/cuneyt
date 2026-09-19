import { TeklifDetay } from "@/components/teklif-detay";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TeklifDetay id={id} listeYolu="/alis-teklifleri" />;
}
