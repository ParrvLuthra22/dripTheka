"use client";

// Currently Pouring — asymmetric 12-column product grid on the homepage.
// Cards shared with PourProductGrid via /components/ui/ProductCard.

import Link from "next/link";
import { ProductCard } from "@/components/ui/ProductCard";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/motion/Reveal";
import { POUR_001 } from "@/data/pour-001";

// Asymmetric editorial grid spans — row1 (7+5), row2 (4+4+4), row3 (12)
const COL_SPANS = [
  "col-span-12 md:col-span-7",
  "col-span-12 md:col-span-5",
  "col-span-12 md:col-span-4",
  "col-span-12 md:col-span-4",
  "col-span-12 md:col-span-4",
  "col-span-12",
];

const ASPECT_RATIOS = [
  "aspect-[4/5]",   // hero — tall portrait
  "aspect-[3/4]",   // tall
  "aspect-square",
  "aspect-square",
  "aspect-square",
  "aspect-[21/8]",  // full-width banner
];

export function CurrentlyPouring() {
  return (
    <section className="bg-[--cream] py-20 md:py-28" aria-labelledby="pouring-heading">
      <div style={{ paddingInline: "var(--pad-x)" }}>
        {/* Section header */}
        <Reveal className="flex items-start justify-between mb-12 border-b border-[--ink]/10 pb-8">
          <div>
            <Eyebrow color="ink" className="mb-3">[02 / Currently Pouring]</Eyebrow>
            <h2
              id="pouring-heading"
              className="font-display italic text-[--ink] leading-none"
              style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}
            >
              The First Round.
            </h2>
          </div>
          <p className="hidden md:block font-mono text-[9px] uppercase tracking-[0.12em] text-[--ink]/30 text-right max-w-[180px] leading-relaxed">
            {POUR_001.editorialNote}
          </p>
        </Reveal>

        {/* Asymmetric product grid */}
        <div className="grid grid-cols-12 gap-3 md:gap-4">
          {POUR_001.products.map((product, index) => (
            <div
              key={product.id}
              className={COL_SPANS[index] ?? "col-span-12 md:col-span-4"}
            >
              <ProductCard
                product={product}
                aspectRatio={ASPECT_RATIOS[index]}
                animDelay={(index % 3) * 0.08}
              />
            </div>
          ))}
        </div>

        {/* Section CTA */}
        <Reveal delay={100} className="mt-12 pt-8 border-t border-[--ink]/10 flex items-center justify-between">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--ink]/30">
            {POUR_001.products.length}&nbsp;pieces&nbsp;·&nbsp;200 of each
          </p>
          <Link
            href="/pour/pour-001"
            data-hover
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-[--blue] hover:text-[--ink] transition-colors duration-200 flex items-center gap-2"
          >
            See the full pour&nbsp;→
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
