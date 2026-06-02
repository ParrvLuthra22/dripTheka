import { getLegalDoc, LEGAL_DOCS } from "@/data/legal";
import { notFound } from "next/navigation";

interface Props { params: Promise<{ doc: string }> }

export async function generateStaticParams() {
  return LEGAL_DOCS.map((d) => ({ doc: d.slug }));
}

export default async function LegalDocPage({ params }: Props) {
  const { doc } = await params;
  const document = getLegalDoc(doc);
  if (!document) notFound();
  return (
    <div className="container-site py-24 max-w-[720px]">
      <h1 className="type-display-md text-[--ink] mb-4">{document.title}</h1>
      <p className="font-mono text-[10px] text-[--ink]/30 uppercase tracking-widest mb-8">Last updated {document.lastUpdated}</p>
      <div className="type-body-md text-[--ink]/70 whitespace-pre-line">{document.body}</div>
    </div>
  );
}
