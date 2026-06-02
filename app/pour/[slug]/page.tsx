import { notFound } from "next/navigation";
import { POUR_001 } from "@/data/pour-001";
import { PourGrid } from "@/components/pour/PourGrid";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (slug !== "pour-001") return { title: "Wrong Theka — Drip Theka" };

  return {
    title: `Pour #001: ${POUR_001.title} — Drip Theka`,
    description: POUR_001.description,
  };
}

export async function generateStaticParams() {
  return [{ slug: "pour-001" }];
}

export default async function PourPage({ params }: Props) {
  const { slug } = await params;
  if (slug !== "pour-001") notFound();

  const pour = POUR_001;

  return (
    <>
      {/* Pour hero */}
      <section className="bg-[#141518] pt-32 pb-16 px-6 md:px-12">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-[#004AAD] mb-4">
                Pour #{pour.number} — Opening Night
              </p>
              <h1 className="font-display italic text-5xl md:text-7xl text-[#E4E2DD] leading-none">
                {pour.title}
              </h1>
              <p className="font-sans text-[#E4E2DD]/60 mt-4 max-w-[460px] leading-relaxed">
                {pour.subtitle}
              </p>
            </div>
            <div className="md:text-right">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#E4E2DD]/30 mb-1">
                Editorial
              </p>
              <p className="font-sans text-sm text-[#E4E2DD]/50 max-w-[280px] leading-relaxed">
                {pour.editorialNote}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-[#E4E2DD]/10" />

      {/* Products */}
      <PourGrid pour={pour} />

      {/* Deposit explanation */}
      <section className="bg-[#004AAD] py-16 px-6 md:px-12">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-[#E4E2DD]/60 mb-2">
              Step 01
            </p>
            <p className="font-display italic text-xl text-[#E4E2DD] mb-1">
              Pay 30% now
            </p>
            <p className="font-sans text-sm text-[#E4E2DD]/70">
              Reserve your piece. We start production.
            </p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-[#E4E2DD]/60 mb-2">
              Step 02
            </p>
            <p className="font-display italic text-xl text-[#E4E2DD] mb-1">
              Drop unlocks
            </p>
            <p className="font-sans text-sm text-[#E4E2DD]/70">
              We notify you when your order ships.
            </p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-[#E4E2DD]/60 mb-2">
              Step 03
            </p>
            <p className="font-display italic text-xl text-[#E4E2DD] mb-1">
              Pay the remaining 70%
            </p>
            <p className="font-sans text-sm text-[#E4E2DD]/70">
              Only when it&apos;s ready. Then it&apos;s yours.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
