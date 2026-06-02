import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLegalDoc, LEGAL_DOCS, type LegalDocSlug } from "@/data/legal";

interface Props { params: Promise<{ doc: string }> }

const VALID = new Set<LegalDocSlug>(["privacy", "terms", "returns", "shipping"]);

export async function generateStaticParams() {
  return LEGAL_DOCS.map(d => ({ doc: d.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { doc } = await params;
  const d = getLegalDoc(doc);
  if (!d) return { title: "Not Found" };
  return { title: `${d.title} — Drip Theka` };
}

export default async function LegalDocPage({ params }: Props) {
  const { doc } = await params;
  if (!VALID.has(doc as LegalDocSlug)) notFound();
  const document = getLegalDoc(doc);
  if (!document) notFound();

  return (
    <div className="bg-[--cream] min-h-screen">

      {/* Header */}
      <header
        className="py-14 border-b border-[--ink]/8"
        style={{ paddingInline: "var(--pad-x)" }}
      >
        {/* Nav between docs */}
        <nav className="flex flex-wrap gap-4 mb-10" aria-label="Legal documents">
          {LEGAL_DOCS.map(d => (
            <Link
              key={d.slug}
              href={`/legal/${d.slug}`}
              className={`font-mono text-[9px] uppercase tracking-[0.14em] transition-colors duration-200 ${
                d.slug === doc
                  ? "text-[--ink] border-b border-[--ink]"
                  : "text-[--ink]/35 hover:text-[--ink]"
              }`}
            >
              {d.title}
            </Link>
          ))}
        </nav>

        {/* Title */}
        <h1
          className="font-display italic text-[--ink] leading-tight"
          style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
        >
          {document.title}
        </h1>
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--ink]/30 mt-3">
          Last updated {document.lastUpdated}
        </p>
        <p
          className="font-display italic text-[--ink]/55 mt-4 max-w-[560px] leading-snug"
          style={{ fontSize: "clamp(0.95rem, 1.6vw, 1.2rem)" }}
        >
          {document.intro}
        </p>
      </header>

      {/* Body */}
      <main className="py-14 max-w-[760px]" style={{ paddingInline: "var(--pad-x)" }}>
        {document.sections.map(section => (
          <section key={section.num} className="mb-12">
            {/* Section number + heading */}
            <div className="flex items-baseline gap-4 mb-4">
              <span className="font-mono text-[10px] text-[--blue] tracking-widest shrink-0">
                {section.num}
              </span>
              <h2 className="font-display italic text-[--ink] leading-tight" style={{ fontSize: "clamp(1.1rem, 2vw, 1.5rem)" }}>
                {section.head}
              </h2>
            </div>
            <p className="font-sans text-[--ink]/70 leading-relaxed pl-10" style={{ fontSize: "clamp(0.875rem, 1.4vw, 1rem)" }}>
              {section.body}
            </p>
          </section>
        ))}

        {/* Footer note */}
        <div className="mt-16 pt-8 border-t border-[--ink]/8">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--ink]/25">
            Questions? Email us. We&apos;re real people.
          </p>
        </div>
      </main>
    </div>
  );
}
