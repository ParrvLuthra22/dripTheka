import { HeroSection } from "@/components/hero/HeroSection";
import { PourGrid } from "@/components/pour/PourGrid";
import { POUR_001 } from "@/data/pour-001";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <HeroSection />

      {/* Editorial strip */}
      <section className="bg-[#004AAD] py-5 overflow-hidden">
        <div className="flex gap-12 animate-marquee whitespace-nowrap">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="font-mono text-xs uppercase tracking-widest text-[#E4E2DD] shrink-0">
              Pour #001 — The First Round &nbsp;·&nbsp; 200 Units Only &nbsp;·&nbsp; 30% Deposit &nbsp;·&nbsp; Opening Night
            </span>
          ))}
        </div>
      </section>

      {/* The collection */}
      <PourGrid pour={POUR_001} />

      {/* Editorial break — brand statement */}
      <section className="bg-[#141518] py-32 px-6 md:px-12">
        <div className="max-w-[1440px] mx-auto">
          <div className="max-w-[800px]">
            <p className="font-mono text-xs uppercase tracking-widest text-[#004AAD] mb-8">
              Why we exist
            </p>
            <blockquote className="font-display italic text-4xl md:text-5xl lg:text-6xl text-[#E4E2DD] leading-tight mb-10">
              &ldquo;Every brand says they&apos;re different.
              <br />
              We just made{" "}
              <span className="text-[#004AAD]">200 pieces</span>{" "}
              and stopped talking.&rdquo;
            </blockquote>
            <p className="font-sans text-[#E4E2DD]/50 text-base max-w-[480px] leading-relaxed">
              Drip Theka is a clothing brand. The actual product is belonging.
              We make small runs of quality pieces for people who know what they
              want and don&apos;t need to be sold to.
            </p>
          </div>
        </div>
      </section>

      {/* Last Call CTA */}
      <section className="bg-[#E4E2DD] py-24 px-6 md:px-12">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="font-display italic text-3xl md:text-4xl text-[#141518] mb-2">
              Don&apos;t miss the next pour.
            </h2>
            <p className="font-sans text-[#141518]/60">
              Join Last Call. First to know. First to order.
            </p>
          </div>
          <Link
            href="/last-call"
            className="font-mono text-xs uppercase tracking-widest bg-[#141518] text-[#E4E2DD] px-10 py-4 hover:bg-[#004AAD] transition-colors duration-200 whitespace-nowrap shrink-0"
          >
            Join Last Call
          </Link>
        </div>
      </section>
    </>
  );
}
