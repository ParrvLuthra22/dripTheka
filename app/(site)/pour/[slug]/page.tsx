import { notFound } from "next/navigation";
import { POUR_001 } from "@/data/pour-001";

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return [{ slug: "pour-001" }];
}

export default async function PourPage({ params }: Props) {
  const { slug } = await params;
  if (slug !== "pour-001") notFound();
  return (
    <div className="container-site py-24">
      <p className="font-mono text-xs text-[--ink]/40 uppercase tracking-widest mb-4">Pour #{POUR_001.number}</p>
      <h1 className="type-display-lg text-[--ink]">{POUR_001.title}</h1>
      <p className="type-body-lg text-[--ink]/60 mt-4">{POUR_001.description}</p>
      <p className="font-mono text-xs text-[--blue] mt-8 uppercase tracking-widest">← Collection page built in a later prompt</p>
    </div>
  );
}
