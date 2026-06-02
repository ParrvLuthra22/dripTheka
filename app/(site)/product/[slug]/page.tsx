import { notFound } from "next/navigation";
import { POUR_001 } from "@/data/pour-001";

interface Props { params: Promise<{ slug: string }> }

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = POUR_001.products.find((p) => p.slug === slug);
  if (!product) notFound();
  return (
    <div className="container-site py-24">
      <h1 className="type-display-md text-[--ink]">{product.name}</h1>
      <p className="font-mono text-xs text-[--blue] mt-6 uppercase tracking-widest">← Product detail page — built in a later prompt</p>
    </div>
  );
}
